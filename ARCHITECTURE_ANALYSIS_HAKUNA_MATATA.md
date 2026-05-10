# hakuna-matata 프로젝트 구조 분석

> 기준: 현재 확인된 프로젝트 트리(`app`, `components`) 기반 1차 구조 분석  
> 주의: 이 문서는 **파일 내용 전체를 읽은 정적 코드 리뷰가 아니라**, 현재 확인된 **파일 목록/폴더 구조 기반 분석**입니다.  
> 따라서 **역할 추정 정확도는 높지만 100% 확정은 아님**. 실제 구현 확인은 `app/page.tsx`, `app/layout.tsx`, `components/layout/app-shell.tsx`부터 열어보며 검증하는 것을 권장합니다.

---

## 1. 프로젝트 한 줄 요약

이 프로젝트는 **Next.js App Router 기반의 개인/커플 일정 관리 앱**으로 보이며,  
구조상 다음과 같은 레이어로 나뉩니다.

- `app/` → 앱 진입점, 페이지 라우팅, API 라우트
- `components/layout/` → 앱 전체 프레임과 상/하단 내비게이션
- `components/home/` → 홈 화면
- `components/calendar/` → 캘린더 기능
- `components/tasks/` → 할 일 생성/수정/표시 기능
- `components/more/` → 더보기/설정 화면
- `components/background/` → 배경 연출
- `components/ui/` → 범용 UI 컴포넌트 라이브러리
- `theme-provider.tsx` → 테마 상태 공급
- `app/api/tasks/route.ts` → 태스크 데이터 API

즉, 구조 자체는 **페이지 → 레이아웃 → 기능 모듈 → 범용 UI**로 분리된 전형적인 앱 구조입니다.

---

## 2. 최상위 폴더 역할 분석

### `app/`
App Router의 핵심 폴더입니다.

확인된 파일:
- `app/globals.css`
- `app/layout.tsx`
- `app/page.tsx`
- `app/api/tasks/route.ts`

역할:
- `layout.tsx`: 전체 앱 공통 wrapper
- `page.tsx`: 홈 엔트리 페이지
- `globals.css`: 전역 스타일
- `api/tasks/route.ts`: 태스크 API

판단:
- 이 프로젝트의 **실질적인 진입점은 `app/page.tsx`**
- 시각 톤/전역 테마/폰트는 `layout.tsx` + `globals.css`
- 태스크 저장/조회 흐름은 `api/tasks/route.ts`가 핵심일 가능성 높음

---

### `components/`
앱 UI 실구현이 들어있는 핵심 폴더입니다.

기능별로 아래처럼 분리되어 있어 구조는 양호합니다.

- `background/`
- `calendar/`
- `home/`
- `layout/`
- `more/`
- `tasks/`
- `ui/`

판단:
- **비즈니스 구조 이해용**으로는 `calendar`, `home`, `layout`, `tasks`가 핵심
- `ui`는 구조 파악보다 **스타일/컴포넌트 재사용용**이라 후순위

---

## 3. 파일별 상세 역할 분석

## A. 앱 진입/전역 레이어

### `app/layout.tsx`
예상 역할:
- `<html>`, `<body>` 정의
- 전역 폰트/배경 클래스 적용
- `ThemeProvider` 등 provider 주입
- 전체 앱 공통 래핑

중요도: **매우 높음**

왜 중요한가:
- 이 파일이 망가지면 앱 전체가 깨짐
- 전역 스타일, 테마, 공통 레이아웃 문제가 여기서 시작될 수 있음

확인 포인트:
- `ThemeProvider` 사용 여부
- `className` 구성
- `suppressHydrationWarning` 사용 여부
- `metadata` 정의 여부

수정 시 주의:
- provider 순서 변경
- body className 삭제
- 전역 wrapper 변경

---

### `app/page.tsx`
예상 역할:
- 첫 화면 엔트리
- `AppShell`, `HomeScreen` 또는 메인 화면 컴포넌트 연결

중요도: **매우 높음**

왜 중요한가:
- 이 앱이 처음 어떤 컴포넌트를 렌더하는지 결정
- 전체 구조 이해의 출발점

확인 포인트:
- 어떤 컴포넌트를 import하는지
- 단순 엔트리인지, 상태 제어까지 하는지
- `AppShell`을 직접 부르는지

---

### `app/globals.css`
예상 역할:
- 전역 reset
- 색상/폰트/배경 기본값
- Tailwind 기반이면 base layer 확장
- body/background/selection/scrollbar 등 공통 CSS

중요도: **높음**

왜 중요한가:
- 전체 인상에 큰 영향
- “예쁜 웹앱 느낌” 혹은 “OS 일부 느낌”이 여기서 좌우될 수 있음

---

### `app/api/tasks/route.ts`
예상 역할:
- GET/POST 기반 태스크 조회/생성 API
- 프론트와 데이터 저장/로드 연결점

중요도: **높음**

확인 포인트:
- GET / POST / PATCH / DELETE 유무
- mock 데이터인지 실제 persistence인지
- 응답 구조 (`{ tasks: [] }`, `{ success: true }` 등)
- validation 여부

주의:
- UI만 고쳐도 저장/조회가 안 되면 체감상 앱이 망가진 것처럼 보임
- 프론트 데이터 구조와 API 응답 구조가 어긋나면 버그 발생 가능

---

## B. 레이아웃 레이어

### `components/layout/app-shell.tsx`
예상 역할:
- 상단 헤더 + 본문 + 하단 네비를 묶는 앱 프레임
- 현재 화면(tab) 전환 제어 가능성 높음

중요도: **매우 높음**

이 파일에서 나올 가능성이 높은 것:
- `activeTab` / `currentTab` state
- `TopHeader`, `BottomNav` import
- `HomeScreen`, `CalendarView`, `MoreScreen` 조건부 렌더링

실제 구조 핵심:
- 페이지별로 URL 이동이 아닌, 앱 내부 탭 전환 구조라면 사실상 **앱 제어 본부**

확인 포인트:
- state 기반 탭 전환인지
- `children` 기반인지
- 공통 배경/패딩/스크롤 구조가 여기서 정해지는지

수정 시 주의:
- 이 파일을 건드리면 전체 화면 구조가 같이 흔들릴 수 있음

---

### `components/layout/bottom-nav.tsx`
예상 역할:
- 하단 탭 내비게이션
- 홈 / 캘린더 / 더보기 같은 이동 구조

중요도: **높음**

확인 포인트:
- 탭 수
- 아이콘 구성
- active state 처리
- 클릭 시 부모에 어떤 값을 넘기는지

리팩토링 포인트:
- 탭 수가 너무 많으면 집중도 저하
- 커플용 앱이면 **핵심 3탭 정도로 단순화**가 유리할 수 있음

---

### `components/layout/top-header.tsx`
예상 역할:
- 상단 제목
- 날짜/필터/액션 버튼
- 화면별 헤더 표현

중요도: **중상**

확인 포인트:
- 고정형인지
- 홈/캘린더마다 다른 헤더를 쓰는지
- 버튼이 실제 기능과 연결되어 있는지

리팩토링 포인트:
- 헤더가 과하면 OS형 위젯 느낌이 깨짐
- 높이와 정보량을 최소화하는 편이 전체 톤에 유리

---

## C. 홈 레이어

### `components/home/home-screen.tsx`
예상 역할:
- 홈 메인 화면
- 오늘 일정, 디데이, 빠른 요약, 카드 구조

중요도: **매우 높음**

이 파일에서 기대되는 정보:
- 사용자 첫 화면 정보 배치
- 무엇을 가장 중요하게 보여주는지
- 커플 앱으로서 “공동 일정/개인 디데이” 균형

확인 포인트:
- 오늘 일정이 메인인지
- 디데이 카드가 있는지
- 빠른 추가 버튼이 있는지
- 홈이 정보 과밀인지

리팩토링 포인트:
- 홈은 “오늘 꼭 봐야 하는 것”만 남기는 편이 좋음
- 요약이 많아질수록 앱이 웹서비스처럼 보여짐

---

## D. 캘린더 레이어

### `components/calendar/calendar-view.tsx`
예상 역할:
- 캘린더 메인 렌더링
- 월간/주간 화면
- 날짜 셀 생성
- 태스크 배치

중요도: **매우 높음**

핵심 기능 추정:
- 일정 표시 구조 결정
- 날짜별 태스크 매핑
- 스크롤/행 높이/셀 밀도 제어

확인 포인트:
- 월간인지 주간인지
- 날짜 셀 구조
- 태스크 row 표시 방식
- map 중첩 구조
- 선택된 날짜 state 여부

리팩토링 포인트:
- 셀 안 정보량이 많으면 읽기 어려움
- 커플 일정 앱이라면 **한눈에 보이는 배치**가 최우선

---

### `components/calendar/calendar-task-row.tsx`
예상 역할:
- 캘린더 내부 일정 한 줄 표현
- 제목/시간/상태 뱃지 표시

중요도: **중상**

확인 포인트:
- 시간 텍스트 포함 여부
- 라벨이 너무 긴지
- 색상/점/바 표시 방식
- 여러 일정이 같은 날 있을 때 overflow 처리

리팩토링 포인트:
- 캘린더 내부는 텍스트를 줄이고 식별성을 높이는 방향이 좋음
- “시간 숨기고 파트명만” 같은 요구가 생기면 이 파일이 핵심 수정 지점일 가능성 큼

---

### `components/calendar/calendar-utils.ts`
예상 역할:
- 날짜 계산
- 월간 grid 생성
- 동일 날짜 비교
- 태스크 날짜 키 생성

중요도: **중상**

확인 포인트:
- 함수 목록
- `Date` 객체 사용 방식
- timezone 영향
- 월 시작/끝 계산
- 일정 분류 기준

주의:
- 캘린더 버그는 UI보다 유틸 함수의 날짜 계산 문제일 때가 많음

---

## E. 태스크 레이어

### `components/tasks/task-card.tsx`
예상 역할:
- 할 일 카드 UI
- 제목/상태/기한/카테고리 표시

중요도: **중상**

확인 포인트:
- 카드 정보 밀도
- 클릭 액션
- 상태 뱃지
- 완료 여부 표시

리팩토링 포인트:
- 카드가 복잡하면 홈/캘린더 톤을 망침
- 정보량보다 시선 흐름이 더 중요

---

### `components/tasks/task-modal.tsx`
예상 역할:
- 태스크 생성/수정 모달
- 폼 상태 관리
- 저장 액션 연결

중요도: **매우 높음**

확인 포인트:
- create/edit 구분
- `useState` form 구조
- 저장 submit 함수
- API 연동 지점
- validation 여부
- modal 닫힘 처리

주의:
- 입력 흐름 버그는 사용자 체감상 치명적
- form 필드가 많아질수록 복잡도 급증

---

### `components/tasks/task-modal-field.tsx`
예상 역할:
- 모달 내부 재사용 필드 조각
- input/select/label/section 분리

중요도: **중간**

장점:
- 폼이 모듈화돼 있으면 유지보수 쉬움

주의:
- 추상화가 과하면 오히려 읽기 어려울 수 있음

---

### `components/tasks/task-modal-constants.ts`
예상 역할:
- 태스크 종류, 라벨, 옵션 리스트
- 모달에서 쓰는 선택지 상수

중요도: **중간**

장점:
- 문자열 하드코딩 방지
- 옵션 중앙 관리 가능

---

### `components/tasks/task-modal-styles.ts`
예상 역할:
- 모달 관련 스타일 상수/클래스 관리

중요도: **중간**

판단:
- 디자인 분리가 잘 되어 있다는 뜻일 수도 있지만,
- 너무 세분화되면 오히려 추적이 어려워질 수 있음

---

## F. 기타 기능 레이어

### `components/more/more-screen.tsx`
예상 역할:
- 더보기/설정/부가 메뉴

중요도: **중간**

예상 포함 기능:
- 설정
- 테마
- 앱 정보
- 실험 기능 प्रवेश점

---

### `components/background/app-background.tsx`
예상 역할:
- 배경 gradient, blur, glow 등 시각 효과

중요도: **중상**

왜 중요한가:
- 앱 전체 분위기를 결정
- 특히 “웹앱처럼 보여서 싫다” 문제의 출발점일 가능성 큼

리팩토링 포인트:
- 배경이 강하면 정보보다 연출이 앞서 보임
- 조용한 배경이 더 적합할 가능성 높음

---

### `components/theme-provider.tsx`
예상 역할:
- light/dark/system theme 공급
- next-themes 계열 연동 가능성

중요도: **중상**

확인 포인트:
- defaultTheme
- enableSystem
- attribute 설정
- hydration 이슈 처리

---

## G. 범용 UI 레이어

### `components/ui/*`
확인된 파일 수가 매우 많으며,
구성상 shadcn/ui 또는 유사한 공통 UI 세트로 보입니다.

예:
- `button.tsx`
- `card.tsx`
- `dialog.tsx`
- `sheet.tsx`
- `input.tsx`
- `tabs.tsx`
- `toast.tsx`
- `calendar.tsx`
- 기타 다수

역할:
- 기능 구현보다는 UI 기본 부품 제공

중요도: **구조 파악 단계에서는 낮음 / 스타일 커스터마이즈 단계에서는 중간**

실무 판단:
- 이 폴더는 “앱 구조 이해” 목적에선 후순위
- 단, 버튼/모달/카드 모양을 전역적으로 바꾸고 싶으면 중요한 수정 포인트가 됨

권장:
- 초반에는 여기 건드리지 말고
- 기능 파일(`home`, `calendar`, `tasks`, `layout`) 먼저 이해한 뒤 필요할 때만 수정

---

## 4. 우선순위 분류

## 삭제/수정 매우 신중
- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `app/api/tasks/route.ts`
- `components/layout/app-shell.tsx`
- `components/home/home-screen.tsx`
- `components/calendar/calendar-view.tsx`
- `components/tasks/task-modal.tsx`

이유:
- 앱 진입, 프레임, 핵심 기능, 저장 흐름에 직접 영향

---

## 자주 수정할 가능성 높음
- `components/layout/bottom-nav.tsx`
- `components/layout/top-header.tsx`
- `components/background/app-background.tsx`
- `components/calendar/calendar-task-row.tsx`
- `components/calendar/calendar-utils.ts`
- `components/tasks/task-card.tsx`
- `components/tasks/task-modal-field.tsx`
- `components/tasks/task-modal-constants.ts`
- `components/tasks/task-modal-styles.ts`
- `components/more/more-screen.tsx`
- `components/theme-provider.tsx`

---

## 구조 파악 단계에선 후순위
- `components/ui/*`
- `.next/*`
- `node_modules/*`

---

## 5. 실제 분석 시작 순서

이 순서대로 열어보면 가장 효율적입니다.

1. `app/page.tsx`
2. `app/layout.tsx`
3. `components/layout/app-shell.tsx`
4. `components/home/home-screen.tsx`
5. `components/calendar/calendar-view.tsx`
6. `components/tasks/task-modal.tsx`
7. `components/layout/bottom-nav.tsx`
8. `components/calendar/calendar-task-row.tsx`
9. `components/calendar/calendar-utils.ts`
10. `components/tasks/task-card.tsx`
11. `components/background/app-background.tsx`
12. `components/theme-provider.tsx`
13. `app/api/tasks/route.ts`
14. `components/ui/*`

이 순서의 장점:
- 전체 구조 → 핵심 화면 → 세부 로직 → 공통 UI 순으로 이해 가능

---

## 6. 프로젝트 구조상 장점

### 1) 기능별 분리가 잘 되어 있음
- `calendar`, `home`, `layout`, `tasks` 분리가 واضح함
- 기능 찾기 쉬운 편

### 2) App Router 구조가 비교적 단순함
- `app/page.tsx`, `layout.tsx` 중심이라 진입 구조가 복잡하지 않음

### 3) 범용 UI와 기능 UI가 분리돼 있음
- `components/ui` vs 기능 폴더 분리가 되어 있어 유지보수 측면에서 유리

### 4) 태스크 모달 영역이 세분화돼 있음
- `field`, `constants`, `styles` 분리는 폼 규모가 커질 때 유리할 수 있음

---

## 7. 잠재적 위험 포인트

### 1) `components/ui` 비대화 가능성
현재 `ui` 파일 수가 많기 때문에:
- 무엇이 실제 사용 중인지 추적 어려움
- unused component가 많아질 수 있음

권장:
- 실제 사용 중인 UI 컴포넌트 목록을 한번 정리

---

### 2) Task 모달 세분화 과도 가능성
`task-modal.tsx`, `field`, `constants`, `styles`로 쪼개져 있는데,
구현이 작다면 오히려 오버엔지니어링일 수 있음.

점검 기준:
- 파일이 너무 자주 서로 왔다갔다 해야 하는가?
- 단일 수정이 여러 파일에 흩어지는가?

---

### 3) Home / Calendar / Layout 사이 상태 흐름 복잡화 위험
탭 상태, 선택 날짜, 태스크 선택 상태가 여러 파일에 흩어져 있으면
나중에 버그가 생기기 쉬움.

점검 기준:
- 상태의 진짜 source of truth가 어디인지
- AppShell에 너무 많은 상태가 몰려 있는지

---

### 4) 배경/테마 연출이 기능을 압도할 위험
`app-background.tsx`와 `theme-provider.tsx`가 존재하는 걸 보면
시각 완성도에 신경을 많이 쓴 구조일 수 있음.

주의:
- 배경 연출이 너무 강하면 정보 전달력이 떨어짐
- “예쁜 앱”이 되기 쉽고 “조용한 생활 위젯” 느낌은 약해질 수 있음

---

## 8. Git에 올리기 좋은 추천 문서 목록

이 프로젝트를 GitHub에 올릴 때 아래 문서를 같이 두면 좋습니다.

### 필수
- `README.md`
  - 프로젝트 소개
  - 사용 기술
  - 폴더 구조
  - 실행 방법

### 추천
- `docs/ARCHITECTURE.md`
  - 지금 이 문서처럼 구조 설명
- `docs/CONTRIBUTING.md`
  - 파일 수정 규칙
  - 네이밍 규칙
- `docs/DECISIONS.md`
  - 왜 이런 구조를 택했는지 기록

---

## 9. README에 들어가면 좋은 구조 예시

```md
# Hakuna Matata

커플/개인 일정 관리를 위한 Next.js 기반 스케줄 앱입니다.

## Tech Stack
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

## Structure
- app/: 라우팅 및 API
- components/layout: 앱 프레임
- components/home: 홈 화면
- components/calendar: 캘린더
- components/tasks: 할 일 관리
- components/ui: 공통 UI 컴포넌트

## Run
```bash
npm install
npm run dev
```
```

---

## 10. 바로 실행 가능한 Git 커밋용 추천 파일명

이 문서를 아래 경로에 저장 추천:

- `docs/ARCHITECTURE.md`

추천 커밋 메시지:
- `docs: add architecture overview`
- `docs: document project structure and file responsibilities`

---

## 11. 다음 단계 추천

### 1단계
실제로 아래 6개 파일을 열어서 이 문서 추정을 검증:
- `app/page.tsx`
- `app/layout.tsx`
- `components/layout/app-shell.tsx`
- `components/home/home-screen.tsx`
- `components/calendar/calendar-view.tsx`
- `components/tasks/task-modal.tsx`

### 2단계
실제 구현 확인 후 이 문서를 “추정형”에서 “확정형”으로 업데이트

### 3단계
README + ARCHITECTURE 문서 같이 Git에 반영

---

## 12. 최종 정리

현재 트리만 봤을 때 이 프로젝트는 구조가 크게 나쁘지 않고,
오히려 **기능별 분리와 UI 재사용 관점에서는 꽤 정리된 편**입니다.

핵심은:
- `app`에서 진입 구조 파악
- `layout`에서 앱 프레임 파악
- `home`, `calendar`, `tasks`에서 실사용 흐름 파악
- `ui`는 후순위로 보기

즉, 이 프로젝트를 이해하는 가장 좋은 기준은 아래 한 줄입니다.

> **page → layout → home/calendar/tasks → ui**

