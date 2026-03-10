"use client";

import { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  avatarUrl: string | null;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const supabaseRef = useRef(createClient());
  const currentUserIdRef = useRef<string | null>(null);

  const fetchAvatar = useCallback(async (userId: string, userMeta?: Record<string, any>) => {
    const supabase = supabaseRef.current;
    const { data } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (data?.avatar_url) {
      setAvatarUrl(data.avatar_url);
    } else if (userMeta?.avatar_url) {
      setAvatarUrl(userMeta.avatar_url);
    } else {
      setAvatarUrl(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (currentUserIdRef.current) {
      await fetchAvatar(currentUserIdRef.current, user?.user_metadata);
    }
  }, [fetchAvatar, user?.user_metadata]);

  useEffect(() => {
    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      const newUser = session?.user ?? null;
      if (newUser?.id !== currentUserIdRef.current) {
        currentUserIdRef.current = newUser?.id ?? null;
        setUser(newUser);
        if (newUser) fetchAvatar(newUser.id, newUser.user_metadata);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      const newUser = session?.user ?? null;
      const newUserId = newUser?.id ?? null;
      if (newUserId !== currentUserIdRef.current) {
        currentUserIdRef.current = newUserId;
        setUser(newUser);
        if (newUser) fetchAvatar(newUser.id, newUser.user_metadata);
        else setAvatarUrl(null);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchAvatar]);

  const signUp = useCallback(async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabaseRef.current.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    // Supabase email enumeration protection: existing emails return success
    // with an empty identities array instead of an error
    if (!error && data?.user && data.user.identities?.length === 0) {
      return { error: new Error("An account with this email already exists. Please sign in instead.") };
    }

    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabaseRef.current.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabaseRef.current.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  }, []);

  const signOut = useCallback(async () => {
    await supabaseRef.current.auth.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabaseRef.current.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return { error };
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabaseRef.current.auth.updateUser({
      password: newPassword,
    });
    return { error };
  }, []);

  const value = {
    user,
    session,
    loading,
    avatarUrl,
    refreshProfile,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
