// lib/ocrCache.ts
import { createHash } from "crypto";

type CacheEntry = {
  /** OCR 결과 (이미 파싱된 events 배열) */
  events: Array<{ date: string; title: string; time?: string }>;
  /** 캐시 타임스탬프 (ms) */
  ts: number;
};

/**
 * 간단한 LRU‑like 캐시 (크기 제한만 두는 버전).
 * 필요에 따라 `lru-cache` 패키지로 교체해도 무방.
 */
const MAX_ENTRIES = 200;               // 메모리 보호용 상한
const TTL_MS = 10 * 60 * 1000;         // 10분 후 자동 제거

const cache = new Map<string, CacheEntry>();

/**
 * Buffer → MD5 해시 문자열
 */
export function hashBuffer(buf: Buffer): string {
  return createHash("md5").update(buf).digest("hex");
}

/**
 * 캐시에서 값을 가져오고, 만료된 항목은 자동으로 삭제한다.
 */
export function getFromCache(key: string): CacheEntry | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    return undefined;
  }
  return entry;
}

/**
 * 캐시에 값을 저장하고, 크기 초과 시 가장 오래된 항목을 제거한다.
 */
export function setToCache(key: string, value: CacheEntry) {
  // 크기 제한 초과 시 가장 오래된 항목 삭제 (간단히 처음부터 제거)
  if (cache.size >= MAX_ENTRIES) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(key, { ...value, ts: Date.now() });
}

/** 캐시 전체 비우기 (관리용) */
export function clearCache() {
  cache.clear();
}
