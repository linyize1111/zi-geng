export type MockUser = {
  id: string;
  email: string;
  name: string;
  role: "owner" | "member";
};

export type DataAdapterMode = "mock" | "supabase";

export interface DataAdapter {
  mode: DataAdapterMode;
  getDemoUser(): MockUser | null;
}

const demoOwner: MockUser = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "owner@example.com",
  name: "字耕示範使用者",
  role: "owner",
};

export function createMockAdapter(): DataAdapter {
  return {
    mode: "mock",
    getDemoUser: () => demoOwner,
  };
}

let adapter: DataAdapter | null = null;

export function getDataAdapter(useMock: boolean): DataAdapter {
  if (!adapter) {
    if (!useMock) {
      // Real Supabase adapter arrives in Phase 2; keep explicit failure mode.
      adapter = {
        mode: "supabase",
        getDemoUser: () => null,
      };
    } else {
      adapter = createMockAdapter();
    }
  }
  return adapter;
}

/** Test-only reset */
export function resetDataAdapter(): void {
  adapter = null;
}
