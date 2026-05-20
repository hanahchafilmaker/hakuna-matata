"use client";

import { useState, useEffect } from "react";
import { useMemoStorage } from "@/features/memo/hooks/useMemoStorage";

export function MemoWidget() {
  const { memo, saveMemo } = useMemoStorage();
  const [value, setValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. 저장소에서 초기 메모를 불러와 입력창에 동기화합니다.
  useEffect(() => {
    if (memo) {
      setValue(memo.content);
    }
  }, [memo]);

  // 2. 디바운스(Debounce) 자동 저장 핵심 로직
  useEffect(() => {
    // 기존 내용과 완전히 일치하면 불필요한 저장을 방지합니다.
    if (memo && value === memo.content) return;

    // 최초 진입 시 빈 텍스트 상태에서 무의미하게 저장소가 돌아가는 것을 막습니다.
    if (!memo && !value) return;

    // [보완] if (!memo) return; 을 걷어내어 최초 메모 작성 시에도 정상 작동합니다.
    const timer = setTimeout(async () => {
      setIsSaving(true);
      await saveMemo(value);
      setIsSaving(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [value, memo, saveMemo]);

  return (
    <div className="card memo-widget">
      <div className="memo-widget__header">
        <h3 className="memo-widget__title">오늘의 메모</h3>
        <span className="memo-widget__timestamp">
          {isSaving ? "조용히 저장 중..." : memo?.updatedAt ? "적어둠" : ""}
        </span>
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="기억해둘 일을 적어보세요."
        className="memo-widget__textarea"
        rows={5}
      />
    </div>
  );
}