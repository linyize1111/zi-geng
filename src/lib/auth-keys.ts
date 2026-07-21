export const AUTH_STORAGE_KEY = "zi-geng-auth" as const;
export const MAIN_AUTH_STORAGE_KEY = "lyz-main-auth" as const;
export const ACG_AUTH_STORAGE_KEY = "acg-portal-auth" as const;

/** Keys that must never be removed by 字耕 logout / cleanup. */
export const FOREIGN_AUTH_KEY_PREFIXES = [
  MAIN_AUTH_STORAGE_KEY,
  ACG_AUTH_STORAGE_KEY,
  "acg_",
] as const;

export function isForeignAuthKey(key: string): boolean {
  return FOREIGN_AUTH_KEY_PREFIXES.some(
    (prefix) => key === prefix || key.startsWith(`${prefix}.`) || key.startsWith(prefix),
  );
}

export function isZiGengAuthKey(key: string): boolean {
  return key === AUTH_STORAGE_KEY || key.startsWith(`${AUTH_STORAGE_KEY}-`);
}
