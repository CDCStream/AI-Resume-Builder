"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionStatus = "trialing" | "active" | "canceled" | "expired" | "none";
export type PlanType = "TRIAL" | "PRO_MONTHLY" | "PRO_QUARTERLY" | "PRO_SEMI_ANNUAL" | "FREE";

const CACHE_KEY = "linimpact_sub_cache";
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface Subscription {
  id: string;
  user_id: string;
  polar_subscription_id: string | null;
  polar_customer_id: string | null;
  plan: PlanType;
  status: SubscriptionStatus;
  current_period_end: string | null;
  canceled_at: string | null;
  created_at: string;
  updated_at: string;
}

interface CachedData {
  subscription: Subscription | null;
  userCreatedAt: string | null;
  timestamp: number;
}

function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY) || sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    return cached;
  } catch { /* ignore */ }
  return null;
}

function writeCache(subscription: Subscription | null, userCreatedAt: string | null) {
  const data = JSON.stringify({ subscription, userCreatedAt, timestamp: Date.now() });
  try { localStorage.setItem(CACHE_KEY, data); } catch { /* ignore */ }
  try { sessionStorage.setItem(CACHE_KEY, data); } catch { /* ignore */ }
}

// SSR-safe: useLayoutEffect on client, useEffect on server (suppresses SSR warning)
const useClientLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  isLoading: boolean;
  isPro: boolean;
  isTrialing: boolean;
  trialExpired: boolean;
  trialDaysRemaining: number | null;
  plan: PlanType;
  status: SubscriptionStatus;
  daysRemaining: number | null;
  refetch: () => Promise<void>;
  userCreatedAt: string | null;
  needsTrialPayment: boolean;
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabaseRef = useRef<ReturnType<typeof createClient> | null>(null);
  const fetchedRef = useRef(false);

  // Phase 1: Read cache BEFORE browser paints — prevents any "Upgrade to Pro" flash
  useClientLayoutEffect(() => {
    const cached = readCache();
    if (cached) {
      setSubscription(cached.subscription);
      setUserCreatedAt(cached.userCreatedAt);
      setIsLoading(false);
    }
  }, []);

  const fetchSubscription = useCallback(async () => {
    try {
      if (!supabaseRef.current) supabaseRef.current = createClient();
      const supabase = supabaseRef.current;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        setUserCreatedAt(null);
        writeCache(null, null);
        setIsLoading(false);
        return;
      }

      setUserCreatedAt(user.created_at);

      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription:", error);
      }

      const sub = data as Subscription | null;
      setSubscription(sub);
      writeCache(sub, user.created_at);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Phase 2: Fetch fresh data from Supabase in background
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSubscription();
  }, [fetchSubscription]);

  // Paid Pro plan (monthly/quarterly/semi-annual with active status)
  const hasPaidPlan = subscription?.status === "active" &&
    subscription.plan !== "FREE" &&
    subscription.plan !== "TRIAL";

  // Trial: user has a TRIAL plan with active status and period not expired
  let isTrialing = false;
  let trialExpired = false;
  let trialDaysRemaining: number | null = null;

  if (subscription?.plan === "TRIAL" && subscription.status === "active") {
    if (subscription.current_period_end) {
      const endDate = new Date(subscription.current_period_end);
      const now = new Date();
      const msRemaining = endDate.getTime() - now.getTime();
      if (msRemaining > 0) {
        isTrialing = true;
        trialDaysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      } else {
        trialExpired = true;
        trialDaysRemaining = 0;
      }
    }
  } else if (!hasPaidPlan && subscription?.plan === "TRIAL" && subscription.status !== "active") {
    trialExpired = true;
    trialDaysRemaining = 0;
  }

  // User registered but never paid $1 trial — needs to pay
  const needsTrialPayment = !!userCreatedAt && !subscription && !isLoading;

  // If no subscription at all and user exists, trial is "expired" (they never started one)
  if (userCreatedAt && !subscription && !isLoading) {
    trialExpired = true;
  }

  // isPro is true if user has paid plan OR is in active trial period
  const isPro = hasPaidPlan || isTrialing;
  const plan = subscription?.plan || "FREE";
  const status = subscription?.status || "none";

  let daysRemaining: number | null = null;
  if (subscription?.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysRemaining < 0) daysRemaining = 0;
  }

  return {
    subscription,
    isLoading,
    isPro,
    isTrialing,
    trialExpired,
    trialDaysRemaining,
    plan,
    status,
    daysRemaining,
    refetch: fetchSubscription,
    userCreatedAt,
    needsTrialPayment,
  };
}
