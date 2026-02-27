"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowLeft, 
  CreditCard,
  Crown,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Calendar,
  DollarSign,
  XCircle
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BillingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    isPro, 
    isTrialing, 
    trialExpired,
    trialDaysRemaining, 
    plan, 
    daysRemaining,
    subscription,
    refetch,
  } = useSubscription();
  
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const getPlanDetails = () => {
    switch (plan) {
      case "PRO_MONTHLY":
        return { name: "Pro Monthly", price: "$13.98", period: "month" };
      case "PRO_QUARTERLY":
        return { name: "Pro Quarterly", price: "$27.75", period: "3 months" };
      case "PRO_SEMI_ANNUAL":
        return { name: "Pro Semi-Annual", price: "$47.10", period: "6 months" };
      default:
        return { name: "Free", price: "$0", period: "forever" };
    }
  };

  const planDetails = getPlanDetails();

  const handleCancelSubscription = async () => {
    setCanceling(true);
    try {
      const response = await fetch("/api/subscription/cancel", {
        method: "POST",
      });

      if (response.ok) {
        setCancelDialogOpen(false);
        await refetch();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to cancel subscription. Please try again.");
      }
    } catch (error) {
      console.error("Cancel error:", error);
      alert("Failed to cancel subscription. Please try again.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/settings")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Settings
            </Button>
          </div>
          <Link href="/" className="flex items-center">
            <img 
              src="/logo.png" 
              alt="LinImpact.ai Logo" 
              className="w-10 h-10 object-contain"
            />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billing & Subscription</h1>

        <div className="space-y-6">
          {/* Current Subscription */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Crown className="w-5 h-5" />
                Current Subscription
              </CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Plan Info */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{planDetails.name}</h3>
                      {isPro && !isTrialing && subscription?.status !== "canceled" && (
                        <span className="inline-flex items-center text-sm text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      )}
                      {subscription?.status === "canceled" && (
                        <span className="inline-flex items-center text-sm text-orange-600">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          Canceled
                        </span>
                      )}
                      {isTrialing && (
                        <span className="inline-flex items-center text-sm text-amber-600">
                          <Calendar className="w-4 h-4 mr-1" />
                          Trial - {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
                        </span>
                      )}
                      {trialExpired && !isPro && (
                        <span className="inline-flex items-center text-sm text-red-600">
                          <XCircle className="w-4 h-4 mr-1" />
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center gap-2">
                        <DollarSign className="w-4 h-4" />
                        Price
                      </span>
                      <span className="font-medium text-gray-900">
                        {planDetails.price}/{planDetails.period}
                      </span>
                    </div>

                    {subscription?.current_period_end && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500 flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {subscription.status === "canceled" ? "Access until" : "Next billing date"}
                        </span>
                        <span className="font-medium text-gray-900">
                          {new Date(subscription.current_period_end).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                  {subscription?.status === "canceled" ? (
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4">
                      <h4 className="font-medium text-orange-800 mb-2">
                        Subscription Canceled
                      </h4>
                      <p className="text-sm text-orange-700 mb-4">
                        {subscription?.current_period_end 
                          ? `Your access continues until ${new Date(subscription.current_period_end).toLocaleDateString()}. Resubscribe anytime to keep your premium features.`
                          : "Your subscription has been canceled. Resubscribe to regain access to premium features."}
                      </p>
                      <Button 
                        onClick={() => router.push("/pricing")}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Resubscribe
                      </Button>
                    </div>
                  ) : !isPro || isTrialing ? (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                      <h4 className="font-medium text-amber-800 mb-2">
                        {isTrialing ? "Your trial is ending soon!" : "Upgrade to Pro"}
                      </h4>
                      <p className="text-sm text-amber-700 mb-4">
                        {isTrialing 
                          ? `You have ${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} left. Upgrade now to keep all your premium features.`
                          : "Get unlimited access to all premium features."}
                      </p>
                      <Button 
                        onClick={() => router.push("/pricing")}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button 
                        onClick={() => router.push("/pricing")}
                        variant="outline"
                        className="w-full border-blue-200 hover:bg-blue-50"
                      >
                        Change Plan
                      </Button>
                      
                      <Button 
                        onClick={() => setCancelDialogOpen(true)}
                        variant="outline"
                        className="w-full border-red-200 text-red-600 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Cancel Subscription
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="text-blue-900">Plan Features</CardTitle>
              <CardDescription>What's included in your plan</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Unlimited resumes & cover letters",
                  "All premium templates",
                  "AI-powered optimization",
                  "ATS score analysis",
                  "LinkedIn import",
                  "Interview prep AI",
                  "6-second resume scan",
                  "Priority support",
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className={`w-4 h-4 ${isPro ? 'text-green-500' : 'text-gray-300'}`} />
                    <span className={isPro ? 'text-gray-700' : 'text-gray-400'}>{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="w-5 h-5" />
                Payment History
              </CardTitle>
              <CardDescription>Your recent payments</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {isPro && !isTrialing ? (
                <p className="text-sm text-gray-500">
                  Payment history is managed through Polar.sh. 
                  <a href="https://polar.sh" target="_blank" className="text-blue-600 hover:underline ml-1">
                    View on Polar.sh →
                  </a>
                </p>
              ) : (
                <p className="text-sm text-gray-500">No payment history yet.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Cancel Subscription
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your subscription? You'll lose access to all premium features at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
            <h4 className="font-medium text-amber-800 mb-2">You'll lose access to:</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Unlimited resumes & cover letters</li>
              <li>• AI-powered optimization</li>
              <li>• ATS score analysis</li>
              <li>• Interview prep AI</li>
              <li>• And more...</li>
            </ul>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Keep Subscription
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleCancelSubscription}
              disabled={canceling}
            >
              {canceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Yes, Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
