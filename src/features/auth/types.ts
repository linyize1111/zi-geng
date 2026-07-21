import { z } from "zod";

export const membershipSchema = z.object({
  isMember: z.boolean(),
  isOwner: z.boolean(),
});

export type Membership = z.infer<typeof membershipSchema>;

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type AuthState = {
  status: "loading" | "anonymous" | "authenticated" | "unauthorized";
  user: AuthUser | null;
  membership: Membership | null;
  usingMock: boolean;
};
