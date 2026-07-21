import { AUTH_STORAGE_KEY, isForeignAuthKey, isZiGengAuthKey } from "@/lib/auth-keys";

/**
 * Remove only 字耕 auth keys from localStorage.
 * Never touch lyz-main-auth / acg-portal-auth / other foreign keys.
 */
export function clearZiGengAuthStorage(storage: Storage = localStorage): string[] {
  const removed: string[] = [];
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key) keys.push(key);
  }
  for (const key of keys) {
    if (isForeignAuthKey(key)) continue;
    if (!isZiGengAuthKey(key) && key !== AUTH_STORAGE_KEY) continue;
    storage.removeItem(key);
    removed.push(key);
  }
  return removed;
}

export function assertSafeLogoutCleanup(removed: string[]): void {
  for (const key of removed) {
    if (isForeignAuthKey(key)) {
      throw new Error(`Refusing to remove foreign auth key: ${key}`);
    }
  }
}
