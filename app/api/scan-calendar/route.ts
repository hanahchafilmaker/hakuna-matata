import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';

interface ScanCalendarRequest {
  imageBase64: string;
  mediaType: string; // e.g., 'image/jpeg', 'image/png'
  year: number;
  month: number; // 1-12
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanCalendarRequest = await request.json();
    const { imageBase64, mediaType, year, month } = body;

    if (!imageBase64 || !mediaType || !year || !month) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Base64 문자열 정제 (Data URL 접두사가 붙어있을 경우 제거)
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(cleanBase64, 'base64');

    // 한글과 영어를 동시에 지원하도록 주입 (달력/포스터 텍스트 인식률 대폭 향상)
    const worker = await createWorker();
    await worker.loadLanguage('kor+eng');
    await worker.initialize('kor+eng');

    const { data: { text } } = await worker.recognize(imageBuffer);
    await worker.terminate();

    // 개선된 컨텍스트 기반 파서 호출
    const events = parseCalendarText(text, year, month);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('OCR processing failed:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}

/**
 * 줄바꿈 깨짐 현상을 방지하는 고도화된 달력 텍스트 파서
 */
function parseCalendarText(text: string, year: number, month: number) {
  // 전처리: 다중 공백 단일화 및 불필요한 특수문자 제거 후 줄단위 분할
  const lines = text
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(line => line.length > 0);

  const events: Array<{ date: string; title: string; time: string }> = [];

  // 핵심 장치: 직전 줄에서 발견된 가장 최근의 날짜를 저장하는 컨텍스트 변수
  let currentTargetDateStr: string | null = null;

  // 날짜 식별용 정규식 패턴들
  const regexMonthDay = /(\d{1,2})[/\-월]\s*(\d{1,2})[일]?/; // "5/21", "5월 21일", "5-21"
  const regexOnlyDay = /^(\d{1,2})일/;                      // "21일" (문두에 올 때)
  const regexTime = /(?:(\d{1,2}):(\d{2}))/;               // "14:00", "09:30"

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    let extractedMonth = month;
    let extractedDay: number | null = null;
    let extractedTime = '';
    let title = line;

    // 1. 날짜 추출 시도 (MM/DD 또는 MM월 DD일)
    const matchMonthDay = line.match(regexMonthDay);
    if (matchMonthDay) {
      extractedMonth = parseInt(matchMonthDay[1], 10);
      extractedDay = parseInt(matchMonthDay[2], 10);
      // 날짜 패턴 부분을 타이틀에서 제거
      title = title.replace(matchMonthDay[0], '').trim();
    }
    // 2. 월 없이 일만 단독으로 나온 경우 ("21일 회의" 등)
    else {
      const matchOnlyDay = line.match(regexOnlyDay);
      if (matchOnlyDay) {
        extractedDay = parseInt(matchOnlyDay[1], 10);
        title = title.replace(matchOnlyDay[0], '').trim();
      }
    }

    // 3. 시간 추출 시도
    const matchTime = title.match(regexTime);
    if (matchTime) {
      const hh = matchTime[1].padStart(2, '0');
      const mm = matchTime[2];
      extractedTime = `${hh}:${mm}`;
      title = title.replace(matchTime[0], '').trim();
    }

    // 타이틀 앞뒤 잔여 특수문자나 기호 정리 (예: "- 회의" -> "회의")
    title = title.replace(/^[:\-\s•◦]+/g, '').trim();

    // 4. 날짜 컨텍스트 상태 머신 검증 및 매칭
    if (extractedDay !== null) {
      // 새로운 유효 날짜가 정의된 경우
      const dateObj = new Date(year, extractedMonth - 1, extractedDay);

      // JavaScript Date 개체의 유효성 검증 (32일 같은 잘못된 날짜 방어)
      if (!isNaN(dateObj.getTime()) && dateObj.getDate() === extractedDay) {
        // 안전한 ISO 날짜 포맷 생성 (KST 기준 날짜 유지)
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        currentTargetDateStr = `${yyyy}-${mm}-${dd}`;
      } else {
        currentTargetDateStr = null; // 유효하지 않은 날짜인 경우 초기화
      }
    }

    // 5. 이벤트 등록 조건 분기
    if (currentTargetDateStr) {
      // 이번 줄에 내용(타이틀)이 존재한다면 바로 이벤트 등록
      if (title.length > 0) {
        events.push({
          date: currentTargetDateStr,
          title: title,
          time: extractedTime
        });
      }
      // 만약 이번 줄에 날짜 정보만 달랑 있고 내용이 없다면 (줄바꿈이 찢어진 상황),
      // 바로 다음 줄을 미리 들여다보고(Look-ahead) 그것을 타이틀로 흡수합니다.
      else if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];

        // 다음 줄이 또 새로운 날짜 패턴을 시작하는 게 아니라면, 순수 내용으로 판단
        if (!regexMonthDay.test(nextLine) && !regexOnlyDay.test(nextLine)) {
          let nextTitle = nextLine;

          // 다음 줄에 시간이 숨어있을 수 있으므로 재포착
          const matchNextTime = nextTitle.match(regexTime);
          let nextTime = extractedTime;
          if (matchNextTime) {
            nextTime = `${matchNextTime[1].padStart(2, '0')}:${matchNextTime[2]}`;
            nextTitle = nextTitle.replace(matchNextTime[0], '').trim();
          }

          nextTitle = nextTitle.replace(/^[:\-\s•◦]+/g, '').trim();

          if (nextTitle.length > 0) {
            events.push({
              date: currentTargetDateStr,
              title: nextTitle,
              time: nextTime
            });
            i++; // 다음 줄을 미리 처리했으므로 인덱스를 한 칸 건너뜁니다 (Look-ahead 소모)
          }
        }
      }
    }
  }

  return events;
}