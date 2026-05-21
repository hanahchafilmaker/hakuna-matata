export function normalizeEvent(raw: any) {
  return {
    date: raw.date ?? '',
    title: String(raw.text ?? '').trim(),
    time: raw.time ?? null,
    confidence: raw.confidence ?? 0.8,
  };
}