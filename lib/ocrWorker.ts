import { createWorker } from "tesseract.js";

let workerPromise: Promise<any> | null = null;

export const getOCRWorker = async () => {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker();
      await worker.loadLanguage("kor+eng");
      await worker.initialize("kor+eng");
      return worker;
    })();
  }

  return workerPromise;
};