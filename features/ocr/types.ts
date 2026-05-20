export interface OcrEvent {
  date: string; // YYYY-MM-DD
  title: string;
  time: string; // HH:mm or empty
}

export interface ScanCalendarRequest {
  imageBase64: string;
  mediaType: string;
  year: number;
  month: number;
}

export interface ScanCalendarResponse {
  events: OcrEvent[];
}