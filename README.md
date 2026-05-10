# Hakuna Matata

커플 또는 1인 사용을 위한 **생활형 스케줄 관리 앱**입니다.  
복잡한 생산성 툴보다는, **조용하게 생활 리듬을 정리하는 홈 화면형 앱**을 목표로 합니다.

현재 프로젝트는 **Next.js App Router + TypeScript + Tailwind CSS** 기반으로 구성되어 있으며,  
홈 화면, 캘린더, 할 일(Task), 더보기 화면 중심으로 구조가 나뉘어 있습니다.

---

## Overview

이 프로젝트는 아래 같은 흐름을 중심으로 설계되어 있습니다.

- **Home**
  - 오늘 일정 요약
  - 빠르게 확인해야 하는 정보 중심
  - 디데이, 일정 요약, 생활 리듬 중심 화면

- **Calendar**
  - 한눈에 일정을 보는 캘린더 화면
  - 날짜별 태스크 표시
  - 월간 또는 주간 일정 확인용 핵심 기능

- **Tasks**
  - 할 일 추가 / 수정 / 확인
  - 모달 기반 입력 흐름
  - 카드/리스트 기반 표시

- **More**
  - 설정, 확장 메뉴, 부가 기능 영역

이 앱은 “기능 많은 협업 툴”보다는  
**개인과 커플이 매일 자연스럽게 여는 일정 앱**에 더 가까운 방향을 지향합니다.

---

## Tech Stack

- **Next.js**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui 계열 공통 UI 컴포넌트**
- **App Router 구조**

---

## Project Structure

```txt
app/
  globals.css
  layout.tsx
  page.tsx
  api/
    tasks/
      route.ts

components/
  theme-provider.tsx
  background/
    app-background.tsx
  calendar/
    calendar-task-row.tsx
    calendar-utils.ts
    calendar-view.tsx
  home/
    home-screen.tsx
  layout/
    app-shell.tsx
    bottom-nav.tsx
    top-header.tsx
  more/
    more-screen.tsx
  tasks/
    task-card.tsx
    task-modal.tsx
    task-modal-field.tsx
    task-modal-constants.ts
    task-modal-styles.ts
  ui/
    ...
```

---

## Folder Guide

### `app/`
앱의 진입점과 라우팅을 담당합니다.

- `layout.tsx`
  - 앱 전체 공통 레이아웃
  - theme/provider/global wrapper 가능성이 높은 핵심 파일
- `page.tsx`
  - 첫 화면 엔트리
- `globals.css`
  - 전역 스타일
- `api/tasks/route.ts`
  - 태스크 관련 API 엔드포인트

### `components/layout/`
앱의 큰 프레임을 담당합니다.

- `app-shell.tsx`
  - 전체 화면 구조
- `top-header.tsx`
  - 상단 헤더
- `bottom-nav.tsx`
  - 하단 탭 내비게이션

### `components/home/`
홈 화면 본체가 위치합니다.

- `home-screen.tsx`
  - 오늘의 정보, 요약, 디데이 등 메인 홈 구성

### `components/calendar/`
캘린더 기능을 담당합니다.

- `calendar-view.tsx`
  - 캘린더 메인 화면
- `calendar-task-row.tsx`
  - 날짜 셀 내부 일정 표시
- `calendar-utils.ts`
  - 날짜 계산 및 캘린더 유틸

### `components/tasks/`
할 일 생성/수정/표시 로직이 모여 있습니다.

- `task-card.tsx`
  - 태스크 카드 UI
- `task-modal.tsx`
  - 태스크 생성/수정 모달
- `task-modal-field.tsx`
  - 모달 내부 재사용 필드
- `task-modal-constants.ts`
  - 옵션/상수 관리
- `task-modal-styles.ts`
  - 모달 관련 스타일 관리

### `components/more/`
설정 또는 부가 메뉴 화면입니다.

### `components/background/`
앱 배경 연출 관련 컴포넌트입니다.

### `components/ui/`
공통 UI 컴포넌트 모음입니다.  
버튼, 카드, 다이얼로그, 입력창 등 범용 부품이 포함되어 있습니다.

---

## Core Files

프로젝트를 빠르게 이해하려면 아래 파일부터 보는 것을 권장합니다.

1. `app/page.tsx`
2. `app/layout.tsx`
3. `components/layout/app-shell.tsx`
4. `components/home/home-screen.tsx`
5. `components/calendar/calendar-view.tsx`
6. `components/tasks/task-modal.tsx`

이 6개 파일을 먼저 보면:

- 앱이 어디서 시작하는지
- 전체 화면이 어떻게 조립되는지
- 홈/캘린더/태스크 흐름이 어떻게 구성되는지

를 빠르게 파악할 수 있습니다.

---

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Start development server

```bash
npm run dev
```

### 3) Open in browser

```txt
http://localhost:3000
```

---

## Scripts

`package.json`에 따라 다를 수 있지만, 일반적으로 아래 명령어를 사용합니다.

```bash
npm run dev
npm run build
npm run start
npm run lint
```

실제 사용 가능한 스크립트는 `package.json`을 확인해주세요.

---

## Development Notes

### What to check first
구조를 파악할 때는 아래 순서가 가장 효율적입니다.

- `page.tsx`
- `layout.tsx`
- `app-shell.tsx`
- `home-screen.tsx`
- `calendar-view.tsx`
- `task-modal.tsx`

### What not to touch first
처음 구조를 파악하는 단계에서는 아래 폴더를 바로 건드리지 않는 편이 좋습니다.

- `components/ui/*`
- `.next/*`
- `node_modules/*`

이 폴더들은 공통 UI 또는 빌드/외부 의존성에 가까워서,  
초반에는 기능 구조 파악에 큰 도움이 되지 않을 수 있습니다.

### Likely high-impact files
수정 시 영향이 큰 파일들:

- `app/layout.tsx`
- `app/page.tsx`
- `app/globals.css`
- `components/layout/app-shell.tsx`
- `components/home/home-screen.tsx`
- `components/calendar/calendar-view.tsx`
- `components/tasks/task-modal.tsx`
- `app/api/tasks/route.ts`

---

## Design Direction

이 프로젝트는 다음과 같은 방향을 지향합니다.

- 과하게 화려한 생산성 앱보다는
- 생활 속에서 부담 없이 열 수 있는
- 조용하고 차분한 일정 앱
- 홈 화면과 캘린더가 핵심인 구조
- 정보량보다 **가독성과 습관성**을 우선하는 인터페이스

즉,  
“기능이 많은 앱”보다  
**“매일 열기 쉬운 앱”**에 가깝게 만드는 것이 목표입니다.

---

## Documentation

프로젝트 구조 분석 문서는 아래와 같은 별도 문서로 관리하는 것을 권장합니다.

```txt
docs/ARCHITECTURE.md
```

권장 문서 예시:

- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/CHANGELOG.md`

---

## Suggested Commit Message

README를 Git에 추가할 때는 아래 같은 커밋 메시지를 사용할 수 있습니다.

```txt
docs: add project README
```

또는

```txt
docs: write initial README for project structure
```

---

## Status

현재 README는 **프로젝트 트리 기준 1차 정리본**입니다.  
실제 구현 세부 내용은 핵심 파일을 직접 열어보며 계속 업데이트하는 것을 권장합니다.

특히 아래 파일들을 검토한 뒤 README를 보완하면 더 정확해집니다.

- `app/page.tsx`
- `app/layout.tsx`
- `components/layout/app-shell.tsx`
- `components/home/home-screen.tsx`
- `components/calendar/calendar-view.tsx`
- `components/tasks/task-modal.tsx`

---

## License

개인 프로젝트 또는 내부 실험용으로 사용하는 경우,  
필요에 따라 별도 라이선스 문구를 추가해주세요.
