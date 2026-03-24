"use client";

export type SubscriptionStatus = "active" | "none";
export type PlanType = "FREE";

interface UseSubscriptionReturn {
  subscription: null;
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
  return {
    subscription: null,
    isLoading: false,
    isPro: true,
    isTrialing: false,
    trialExpired: false,
    trialDaysRemaining: null,
    plan: "FREE",
    status: "active",
    daysRemaining: null,
    refetch: async () => {},
    userCreatedAt: null,
    needsTrialPayment: false,
  };
}
