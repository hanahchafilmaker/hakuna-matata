// Hakuna Calendar Widget for Scriptable (iOS)
// 설치 방법:
// 1. App Store에서 "Scriptable" 앱 설치
// 2. 이 코드를 Scriptable에 새 스크립트로 복사
// 3. 홈 화면에서 위젯 추가 → Scriptable 선택 → 이 스크립트 선택

const API_URL = "https://script.google.com/macros/s/AKfycbzyvuYzGF1gHOrflfgQAXpcGqFg8ZEvHw_8r_m-hxRKL6BkNPvnTa5tPiGauul2ytQJ/exec";

// 색상 테마 (라이온킹 테마)
const COLORS = {
  background: new Color("#0a1628"),
  cardBg: new Color("#111d2e", 0.9),
  gold: new Color("#d4a843"),
  goldSoft: new Color("#c9a84c"),
  textPrimary: new Color("#f5f0e1"),
  textMuted: new Color("#8a9aae"),
  hana: new Color("#d4a843"),
  minhyo: new Color("#3a8c6a"),
  together: new Color("#7c6fcc"),
  sunday: new Color("#c0392b"),
  saturday: new Color("#2e86c1"),
  today: new Color("#d4a843", 0.2),
  otherMonth: new Color("#4a5568"),
};

// 요일 한글
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 날짜 포맷
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// API에서 태스크 가져오기
async function fetchTasks() {
  try {
    const req = new Request(API_URL);
    const res = await req.loadJSON();
    if (res.ok) {
      return res.data || [];
    }
  } catch (e) {
    console.log("API Error: " + e);
  }
  return [];
}

// 특정 날짜의 태스크 필터링
function getTasksForDate(tasks, dateStr) {
  return tasks.filter((t) => {
    if (t.done) return false;
    const start = t.date_start;
    const end = t.date_end || t.date_start;
    return dateStr >= start && dateStr <= end;
  });
}

// 담당자 색상
function getAssigneeColor(assignee) {
  if (assignee === "하나") return COLORS.hana;
  if (assignee === "민효") return COLORS.minhyo;
  if (assignee === "같이") return COLORS.together;
  return COLORS.textMuted;
}

// 해당 월의 캘린더 데이터 생성
function getMonthCalendar(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  const calendar = [];
  let week = [];
  
  // 이전 달 날짜 채우기
  const prevMonth = new Date(year, month, 0);
  const prevDays = prevMonth.getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    week.push({
      date: prevDays - i,
      isCurrentMonth: false,
      fullDate: new Date(year, month - 1, prevDays - i)
    });
  }
  
  // 현재 달 날짜
  for (let d = 1; d <= daysInMonth; d++) {
    week.push({
      date: d,
      isCurrentMonth: true,
      fullDate: new Date(year, month, d)
    });
    
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }
  
  // 다음 달 날짜 채우기
  if (week.length > 0) {
    let nextDate = 1;
    while (week.length < 7) {
      week.push({
        date: nextDate++,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, nextDate - 1)
      });
    }
    calendar.push(week);
  }
  
  return calendar;
}

// Medium 위젯 - 월간 캘린더 전체
async function createWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(10, 10, 10, 10);

  const tasks = await fetchTasks();
  const today = new Date();
  const todayStr = formatDate(today);
  const year = today.getFullYear();
  const month = today.getMonth();

  // 헤더: 현재 월 + 하쿠나
  const headerStack = widget.addStack();
  headerStack.layoutHorizontally();
  headerStack.centerAlignContent();

  const monthText = headerStack.addText(
    `${year}년 ${month + 1}월`
  );
  monthText.font = Font.boldSystemFont(13);
  monthText.textColor = COLORS.gold;

  headerStack.addSpacer();

  const titleText = headerStack.addText("하쿠나");
  titleText.font = Font.mediumSystemFont(10);
  titleText.textColor = COLORS.textMuted;

  widget.addSpacer(6);

  // 요일 헤더
  const weekdayStack = widget.addStack();
  weekdayStack.layoutHorizontally();

  for (let i = 0; i < WEEKDAYS.length; i++) {
    const day = WEEKDAYS[i];
    const dayText = weekdayStack.addText(day);
    dayText.font = Font.mediumSystemFont(9);
    dayText.textColor = i === 0 ? COLORS.sunday : i === 6 ? COLORS.saturday : COLORS.textMuted;
    dayText.centerAlignText();
    
    if (i < 6) weekdayStack.addSpacer();
  }

  widget.addSpacer(4);

  // 월간 캘린더 그리드
  const calendar = getMonthCalendar(year, month);
  
  for (const week of calendar) {
    const weekStack = widget.addStack();
    weekStack.layoutHorizontally();
    
    for (let i = 0; i < week.length; i++) {
      const dayInfo = week[i];
      const dateStr = formatDate(dayInfo.fullDate);
      const dayTasks = getTasksForDate(tasks, dateStr);
      const isToday = dateStr === todayStr;
      
      const dayStack = weekStack.addStack();
      dayStack.layoutVertically();
      dayStack.centerAlignContent();
      dayStack.size = new Size(42, 24);
      
      if (isToday) {
        dayStack.backgroundColor = COLORS.today;
        dayStack.cornerRadius = 6;
      }
      
      // 날짜 숫자
      const dateText = dayStack.addText(String(dayInfo.date));
      dateText.font = isToday ? Font.boldSystemFont(11) : Font.systemFont(11);
      
      if (!dayInfo.isCurrentMonth) {
        dateText.textColor = COLORS.otherMonth;
      } else if (isToday) {
        dateText.textColor = COLORS.gold;
      } else if (i === 0) {
        dateText.textColor = COLORS.sunday;
      } else if (i === 6) {
        dateText.textColor = COLORS.saturday;
      } else {
        dateText.textColor = COLORS.textPrimary;
      }
      dateText.centerAlignText();
      
      // 태스크 도트 (최대 2개)
      if (dayTasks.length > 0 && dayInfo.isCurrentMonth) {
        const dotStack = dayStack.addStack();
        dotStack.layoutHorizontally();
        dotStack.centerAlignContent();
        
        const maxDots = Math.min(dayTasks.length, 2);
        for (let j = 0; j < maxDots; j++) {
          const dot = dotStack.addText("●");
          dot.font = Font.systemFont(4);
          dot.textColor = getAssigneeColor(dayTasks[j].assignee);
          if (j < maxDots - 1) dotStack.addSpacer(1);
        }
      }
      
      if (i < 6) weekStack.addSpacer();
    }
    
    widget.addSpacer(2);
  }

  return widget;
}

// Small 위젯 (오늘 날짜 + 할 일 개수)
async function createSmallWidget() {
  const widget = new ListWidget();
  widget.backgroundColor = COLORS.background;
  widget.setPadding(12, 12, 12, 12);

  const tasks = await fetchTasks();
  const today = new Date();
  const todayStr = formatDate(today);
  const todayTasks = getTasksForDate(tasks, todayStr);

  // 하쿠나 로고
  const logoText = widget.addText("하쿠나");
  logoText.font = Font.mediumSystemFont(10);
  logoText.textColor = COLORS.textMuted;
  
  widget.addSpacer(4);

  // 날짜
  const dayNum = widget.addText(String(today.getDate()));
  dayNum.font = Font.boldSystemFont(42);
  dayNum.textColor = COLORS.gold;

  const dayName = widget.addText(
    `${today.getMonth() + 1}월 ${WEEKDAYS[today.getDay()]}요일`
  );
  dayName.font = Font.systemFont(12);
  dayName.textColor = COLORS.textMuted;

  widget.addSpacer(8);

  // 오늘 할 일 개수
  const countStack = widget.addStack();
  countStack.layoutHorizontally();
  countStack.centerAlignContent();

  const taskCount = countStack.addText(`${todayTasks.length}`);
  taskCount.font = Font.boldSystemFont(16);
  taskCount.textColor = todayTasks.length > 0 ? COLORS.gold : COLORS.textMuted;

  const taskLabel = countStack.addText(" 개 할 일");
  taskLabel.font = Font.systemFont(11);
  taskLabel.textColor = COLORS.textMuted;

  widget.addSpacer(4);

  // 담당자별 도트 미리보기
  if (todayTasks.length > 0) {
    const dotStack = widget.addStack();
    dotStack.layoutHorizontally();
    dotStack.spacing = 3;
    
    const maxDots = Math.min(todayTasks.length, 5);
    for (let i = 0; i < maxDots; i++) {
      const dot = dotStack.addText("●");
      dot.font = Font.systemFont(8);
      dot.textColor = getAssigneeColor(todayTasks[i].assignee);
    }
    
    if (todayTasks.length > 5) {
      const more = dotStack.addText(`+${todayTasks.length - 5}`);
      more.font = Font.systemFont(8);
      more.textColor = COLORS.textMuted;
    }
  }

  return widget;
}

// 실행
async function run() {
  let widget;

  if (config.widgetFamily === "small") {
    widget = await createSmallWidget();
  } else {
    widget = await createWidget();
  }

  if (config.runsInWidget) {
    Script.setWidget(widget);
  } else {
    // 미리보기
    await widget.presentMedium();
  }

  Script.complete();
}

await run();
