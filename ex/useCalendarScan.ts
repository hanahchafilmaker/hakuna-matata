import { useRef, useState } from "react";

export function useCalendarScan() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const [scanSuccess, setScanSuccess] = useState("");

  function fileToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () =>
        resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
    });
  }

  async function runScan(e?: React.ChangeEvent<HTMLInputElement>) {
    const file = e?.target?.files?.[0];
    if (!file) return;

    setScanning(true);
    setScanError("");
    setScanSuccess("");

    try {
      const base64 = await fileToBase64(file);

      const res = await fetch("/api/scan-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mediaType: file.type,
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
        }),
      });

      if (!res.ok) throw new Error("scan failed");

      const data = await res.json();

      setScanSuccess(
        data.events?.length
          ? `완료: ${data.events.length}개`
          : "감지 없음"
      );
    } catch (e: any) {
      setScanError(e.message);
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return {
    scanning,
    scanError,
    scanSuccess,
    runScan,
    fileInputRef,
  };
}