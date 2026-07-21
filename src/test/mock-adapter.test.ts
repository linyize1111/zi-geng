import { describe, expect, it } from "vitest";
import { createMockAdapter, resetDataAdapter } from "@/lib/offline/mock-adapter";

describe("mock adapter", () => {
  it("returns a demo owner in mock mode", () => {
    resetDataAdapter();
    const adapter = createMockAdapter();
    expect(adapter.mode).toBe("mock");
    expect(adapter.getDemoUser()?.role).toBe("owner");
  });
});
