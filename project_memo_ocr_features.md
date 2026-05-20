---
name: project_memo_ocr_features
description: Memo widget and OCR features added to Hakuna Matata
metadata:
  type: project
---

Added memo widget to home and more screens, OCR upload button to more screen, OCR preview modal, OCR parsing utility, API route for OCR processing, and Supabase storage integration for OCR events.

**Why:** The user requested two features: a memo widget for quick notes on the home screen, and OCR-based schedule registration to extract tasks from images. These features enhance the living (생활형) UX of the app by providing lightweight, emotional, and minimal interaction tools.

**How to apply:** 
- Memo widget is implemented in `features/memo/` with a custom hook for localStorage, a component that autosaves, and is inserted at the top of `HomeScreen` and `MoreScreen`.
- OCR feature includes:
  - API route `/app/api/scan-calendar/route.ts` that uses Tesseract.js to extract text from images and a sophisticated parser (`features/ocr/utils/parseCalendarText.ts`) to handle line breaks and various date/time formats.
  - UI components: `OCRUploadButton` (in `MoreScreen`) and `OCRPreviewModal`.
  - Supabase integration: OCR events are saved as tasks with assignee='함께', type='ocr', and duplicate prevention based on date, title, and time.
  - Types updated: `TaskRow.type` now includes 'ocr', and `Task.assignee' includes '함께' (already present), `Task.type` includes 'ocr'.

This implementation follows the app's existing patterns (e.g., using `useTasks` hook for Supabase operations, Tailwind styling, and modular feature organization).