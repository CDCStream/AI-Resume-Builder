"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type SubscriptionStatus = "trialing" | "active" | "canceled" | "expired" | "none";
export type PlanType = "FREE" | "PRO_MONTHLY" | "PRO_QUARTERLY" | "PRO_SEMI_ANNUAL";

const FREE_TRIAL_DAYS = 3;
const CACHE_KEY = "linimpact_sub_cache";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cached: CachedData = JSON.parse(raw);
    if (Date.now() - cached.timestamp < CACHE_TTL) return cached;
  } catch { /* ignore */ }
  return null;
}

function writeCache(subscription: Subscription | null, userCreatedAt: string | null) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ subscription, userCreatedAt, timestamp: Date.now() }));
  } catch { /* ignore */ }
}

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
}

export function useSubscription(): UseSubscriptionReturn {
  const [cachedData] = useState(() => readCache());
  const [subscription, setSubscription] = useState<Subscription | null>(cachedData?.subscription ?? null);
  const [userCreatedAt, setUserCreatedAt] = useState<string | null>(cachedData?.userCreatedAt ?? null);
  const [isLoading, setIsLoading] = useState(!cachedData);
  const supabaseRef = useRef(createClient());
  const fetchedRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    try {
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

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchSubscription();
  }, [fetchSubscription]);

  const hasPaidPlan = subscription?.status === "active" && subscription.plan !== "FREE";
  
  // Calculate trial status based on user creation date
  let isTrialing = false;
  let trialExpired = false;
  let trialDaysRemaining: number | null = null;

  if (userCreatedAt && !hasPaidPlan) {
    const createdDate = new Date(userCreatedAt);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysSinceCreation < FREE_TRIAL_DAYS) {
      isTrialing = true;
      trialDaysRemaining = FREE_TRIAL_DAYS - daysSinceCreation;
    } else {
      trialExpired = true;
      trialDaysRemaining = 0;
    }
  }

  // isPro is true if user has paid plan OR is in trial period
  const isPro = hasPaidPlan || isTrialing;
  const plan = subscription?.plan || "FREE";
  const status = subscription?.status || "none";

  let daysRemaining: number | null = null;
  if (subscription?.current_period_end) {
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
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
  };
}
