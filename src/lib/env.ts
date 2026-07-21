const truthy = new Set(["1", "true", "yes", "on"]);

function readFlag(value: string | undefined): boolean {
  return truthy.has(
    String(value ?? "")
      .trim()
      .toLowerCase(),
  );
}

export const env = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  mainSiteUrl: import.meta.env.VITE_MAIN_SITE_URL || "https://linyize1111.github.io/",
  appBasePath: import.meta.env.VITE_APP_BASE_PATH || "/zi-geng/",
  useMockAdapter: readFlag(import.meta.env.VITE_USE_MOCK_ADAPTER),
  isProd: import.meta.env.PROD,
};

export function assertMockPolicy(): void {
  if (env.isProd && env.useMockAdapter) {
    throw new Error("VITE_USE_MOCK_ADAPTER must not be enabled in production builds.");
  }
}

export function hasSupabaseConfig(): boolean {
  return Boolean(env.supabaseUrl.startsWith("http") && env.supabaseAnonKey.length > 20);
}
