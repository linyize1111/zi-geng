/** Content lifecycle statuses (字耕 v2.4). `inactive` kept for soft-deactivate compat. */
export type ContentStatus =
  "seed" | "candidate" | "active" | "quarantine" | "rejected" | "archived" | "inactive" | "draft";

/** Statuses visible in Today / Learn draws */
export const LEARNABLE_STATUSES: ContentStatus[] = ["active", "seed"];
