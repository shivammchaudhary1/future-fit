import {
  OFFLINE_DB,
  OFFLINE_STORE,
  OFFLINE_VERSION,
} from "@/config/assessment.constants";
import type { Answer } from "@future-fit/validation";
export interface OfflineDraft {
  key: string;
  answers: Answer[];
  updatedAt: number;
}
async function database() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB, OFFLINE_VERSION);
    request.onupgradeneeded = () =>
      request.result.createObjectStore(OFFLINE_STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("IndexedDB request failed"));
  });
}
export async function readDraft(
  key: string,
): Promise<OfflineDraft | undefined> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db
        .transaction(OFFLINE_STORE)
        .objectStore(OFFLINE_STORE)
        .get(key);
      request.onsuccess = () =>
        resolve(request.result as OfflineDraft | undefined);
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB request failed"));
    });
  } finally {
    db.close();
  }
}
export async function writeDraft(draft: OfflineDraft) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(OFFLINE_STORE, "readwrite");
      transaction.objectStore(OFFLINE_STORE).put(draft);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction failed"));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("IndexedDB transaction failed"));
    });
  } finally {
    db.close();
  }
}
export async function clearDrafts() {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(OFFLINE_STORE, "readwrite");
      tx.objectStore(OFFLINE_STORE).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(tx.error ?? new Error("IndexedDB transaction failed"));
    });
  } finally {
    db.close();
  }
}
