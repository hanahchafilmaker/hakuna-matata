import { useState, useEffect, useCallback } from 'react';

export interface Memo {
  id: string;
  content: string;
  updatedAt: string; // ISO string
}

export function useMemoStorage() {
  const [memo, setMemo] = useState<Memo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Load memo from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('hakuna-memo');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Memo;
        setMemo(parsed);
      } catch (e) {
        console.error('Failed to parse memo from localStorage', e);
        // If parsing fails, we'll start with empty memo
        setMemo(null);
      }
    } else {
      setMemo(null);
    }
    setLoading(false);
  }, []);

  // Save memo to localStorage
  const saveMemo = useCallback((content: string) => {
    const updatedAt = new Date().toISOString();
    const memoToSave: Memo = {
      id: 'hakuna-memo', // fixed id for singleton memo
      content,
      updatedAt,
    };
    try {
      localStorage.setItem('hakuna-memo', JSON.stringify(memoToSave));
      setMemo(memoToSave);
    } catch (e) {
      console.error('Failed to save memo to localStorage', e);
    }
  }, []);

  // Clear memo (optional)
  const clearMemo = useCallback(() => {
    localStorage.removeItem('hakuna-memo');
    setMemo(null);
  }, []);

  return { memo, loading, saveMemo, clearMemo };
}