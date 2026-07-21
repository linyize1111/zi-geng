import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthState, AuthUser, Membership } from "@/features/auth/types";
import { env } from "@/lib/env";
import { getDataAdapter } from "@/lib/offline/mock-adapter";
import { clearZiGengAuthStorage } from "@/lib/supabase/clear-auth-storage";
import { getSupabaseClient } from "@/lib/supabase/client";

type AuthContextValue = AuthState & {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const loadingState: AuthState = {
  status: "loading",
  user: null,
  membership: null,
  usingMock: false,
};

async function fetchMembership(): Promise<Membership> {
  const client = getSupabaseClient();
  if (!client) return { isMember: false, isOwner: false };
  const [memberRes, ownerRes] = await Promise.all([
    client.rpc("is_zg_member"),
    client.rpc("is_zg_owner"),
  ]);
  return {
    isMember: memberRes.data === true,
    isOwner: ownerRes.data === true,
  };
}

function toAuthUser(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): AuthUser {
  const metaName = user.user_metadata?.name ?? user.user_metadata?.full_name;
  return {
    id: user.id,
    email: user.email ?? "",
    name: typeof metaName === "string" && metaName ? metaName : (user.email ?? "使用者"),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadingState);

  const applySession = useCallback(async () => {
    if (env.useMockAdapter) {
      const demo = getDataAdapter(true).getDemoUser();
      if (!demo) {
        setState({ status: "anonymous", user: null, membership: null, usingMock: true });
        return;
      }
      setState({
        status: "authenticated",
        user: { id: demo.id, email: demo.email, name: demo.name },
        membership: { isMember: true, isOwner: demo.role === "owner" },
        usingMock: true,
      });
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setState({ status: "anonymous", user: null, membership: null, usingMock: false });
      return;
    }

    const { data } = await client.auth.getSession();
    const session = data.session;
    if (!session?.user) {
      setState({ status: "anonymous", user: null, membership: null, usingMock: false });
      return;
    }

    const membership = await fetchMembership();
    if (!membership.isMember) {
      setState({
        status: "unauthorized",
        user: toAuthUser(session.user),
        membership,
        usingMock: false,
      });
      return;
    }

    setState({
      status: "authenticated",
      user: toAuthUser(session.user),
      membership,
      usingMock: false,
    });
  }, []);

  useEffect(() => {
    void applySession();
    if (env.useMockAdapter) return;
    const client = getSupabaseClient();
    if (!client) return;
    const { data } = client.auth.onAuthStateChange(() => {
      void applySession();
    });
    return () => data.subscription.unsubscribe();
  }, [applySession]);

  const signInWithGoogle = useCallback(async () => {
    if (env.useMockAdapter) {
      await applySession();
      return;
    }
    const client = getSupabaseClient();
    if (!client) throw new Error("尚未設定 Supabase");
    const redirectTo = `${window.location.origin}${env.appBasePath}`;
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: { access_type: "online", prompt: "select_account" },
      },
    });
    if (error) throw error;
  }, [applySession]);

  const signOut = useCallback(async () => {
    if (!env.useMockAdapter) {
      const client = getSupabaseClient();
      if (client) await client.auth.signOut({ scope: "local" });
    }
    clearZiGengAuthStorage();
    setState({
      status: "anonymous",
      user: null,
      membership: null,
      usingMock: env.useMockAdapter,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signInWithGoogle,
      signOut,
      refreshMembership: applySession,
    }),
    [state, signInWithGoogle, signOut, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
