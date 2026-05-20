# Implementation Plan for Hakuna Matata Features

## Overview
We need to implement two features:
1. Memo Widget on the home screen
2. OCR-based schedule registration

## 1. Memo Widget

### Files to create/modify:
- `features/memo/components/MemoWidget.tsx`
- `features/memo/hooks/useMemoStorage.ts`
- `features/memo/types.ts` (already created)

### Implementation details:
- Use localStorage with key `hakuna-memo`
- Widget should display a textarea and a save button
- Show last saved timestamp
- On mount, load memo from localStorage
- On textarea change, update state (for immediate reflection)
- On save button click, save to localStorage and update timestamp

### Integration:
- Add the MemoWidget to the HomeScreen component, likely above or below existing sections.

## 2. OCR-based Schedule Registration

### Files to create/modify:
- `app/api/scan-calendar/route.ts` (complete the API route)
- `features/ocr/components/OCRUploadButton.tsx`
- `features/ocr/components/OCRPreviewModal.tsx`
- `features/ocr/utils/parseCalendarText.ts`
- `features/ocr/types.ts`

### API Route (`app/api/scan-calendar/route.ts`):
- Accept POST with JSON body: { imageBase64, mediaType, year, month }
- Use an OCR library (we need to choose one, e.g., Tesseract.js or a cloud service? Since we are in Next.js, we can use Tesseract.js for client-side OCR? But the route is server-side. We'll need to use a server-side OCR solution or call an external API. However, the instructions suggest we are to complete the existing route. Let's assume we can use an OCR service. For simplicity, we'll use a placeholder OCR function that returns mock text, but in reality we would integrate with an OCR library.
- Extract text from the image (using OCR)
- Parse the extracted text into schedule events using the parseCalendarText utility
- Return the events in the format: { events: [] }

### Parsing Utility (`features/ocr/utils/parseCalendarText.ts`):
- Implement rules to parse lines like:
  - "5/21 회의"
  - "5월 21일 회의"
  - "21일 병원"
  - "14:00 약속"
  - "5/21 14:00 미팅"
- Convert to objects with date (YYYY-MM-DD), title, time (HH:mm)
- Handle year and month from the API input (if the text doesn't have year, use the provided year and month)

### UI:
- Add a button in the CalendarView (or a floating button) labeled "[사진으로 일정 등록]"
- On click, open an image picker (we can use <input type="file" accept="image/*">)
- After selecting an image, convert to base64 and call the OCR API
- Show a preview modal with the parsed events (OCRPreviewModal)
- Allow user to confirm and then save each event to Supabase using the existing addTask function (or a similar function for schedules)
- Note: The existing tasks are stored in the 'tasks' table. We must check if the OCR-generated schedules should go into the same table or a different one? The instructions say: "existing schedules 테이블 사용" and "existing createSchedule / insertSchedule 함수 재사용". However, we haven't found such functions. We found `useTasks` hook that deals with a 'tasks' table. Let's assume the OCR schedules are also tasks.

### Duplicate Prevention:
- Before inserting, check if a task with the same date, title, and time already exists (in the tasks table). If yes, skip.

### Supabase Storage:
- Use the existing `addTask` function from `hooks/use-tasks.ts` to insert the OCR-generated schedule as a task.
- We must map the OCR event to a task object:
  - text: title
  - date_start: date (YYYY-MM-DD)
  - date_end: date (YYYY-MM-DD) [assuming same day]
  - time: time (HH:mm) [if parsed, otherwise empty?]
  - assignee: maybe "하나" or leave blank? We'll use "하나" as default.
  - type: maybe we can set a new type for OCR? But the existing types are 'ui' | 'nui' | 'uni'. We can use 'ui' or create a new one? Let's stick to 'ui' for now.
  - repeat: "none"
  - done: false
  - memo: maybe note that it came from OCR? Or leave empty.

### Steps in the OCR flow:
1. User clicks the OCR upload button in the CalendarView.
2. User selects an image.
3. Convert image to base64.
4. Call POST /api/scan-calendar with { imageBase64, mediaType, year: selectedYear, month: selectedMonth }.
   - We need to decide what year and month to send. Perhaps we can use the currently displayed month in the calendar? Or we can let the user specify? The instructions say the API requires year and month. We'll get the year and month from the current calendar view (if we are in CalendarView) or from the date of the first event in the OCR result? Actually, the OCR might not have year. We'll use the current year and month from the calendar view. We'll need to pass the current year and month to the OCR upload button.

### CalendarView Integration:
- We need to modify the CalendarView to show the OCR button and handle the OCR flow.
- We'll need to store the current displayed month and year in the CalendarView state (or we can derive from the URL?).

## Implementation Order (as per instructions):
1. Memo Widget
2. OCR API route
3. OCR upload UI
4. Supabase storage connection

## Notes on Style:
- Use Tailwind CSS
- Mobile-first, responsive
- Keep the existing living (생활형) UX: quiet, emotional, minimal interaction.

## Open Questions:
- Where is the CalendarView component? We saw there is a `CalendarView` imported in `app/page.tsx` from "@/components/calendar/calendar-view". We need to check that component.
- We need to check if there is an existing OCR library installed or if we need to install one.

Let's first examine the CalendarView component to understand its structure.
