"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Lock, 
  Save, 
  Loader2,
  CreditCard,
  Crown,
  CheckCircle
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isPro, isTrialing, trialDaysRemaining, plan, subscription } = useSubscription();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // TODO: Implement profile update
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              onClick={() => router.push("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Settings</h1>

        <div className="space-y-6">
          {/* Account Settings */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  Email
                </Label>
                <Input 
                  id="email"
                  type="email" 
                  value={user?.email || ""} 
                  disabled 
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  Full Name
                </Label>
                <Input 
                  id="fullName"
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
              </div>

              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saved ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Subscription / Billing */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="w-5 h-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {/* Current Plan Status */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Current Plan</p>
                    <div className="flex items-center gap-2">
                      {subscription?.status === "canceled" ? (
                        <>
                          <Crown className="w-5 h-5 text-gray-400" />
                          <span className="text-xl font-bold text-gray-900">
                            {plan === "PRO_MONTHLY" && "Pro Monthly"}
                            {plan === "PRO_QUARTERLY" && "Pro Quarterly"}
                            {plan === "PRO_SEMI_ANNUAL" && "Pro Semi-Annual"}
                            {plan === "FREE" && "Free Plan"}
                          </span>
                        </>
                      ) : isPro ? (
                        <>
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="text-xl font-bold text-gray-900">
                            {plan === "PRO_MONTHLY" && "Pro Monthly"}
                            {plan === "PRO_QUARTERLY" && "Pro Quarterly"}
                            {plan === "PRO_SEMI_ANNUAL" && "Pro Semi-Annual"}
                            {plan === "FREE" && isTrialing && "Free Trial"}
                          </span>
                        </>
                      ) : isTrialing ? (
                        <>
                          <Crown className="w-5 h-5 text-amber-500" />
                          <span className="text-xl font-bold text-gray-900">Free Trial</span>
                          <span className="text-sm bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                            {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} left
                          </span>
                        </>
                      ) : (
                        <span className="text-xl font-bold text-gray-900">Free Plan</span>
                      )}
                    </div>
                  </div>
                  {subscription?.status === "canceled" ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-700">
                      Canceled
                    </span>
                  ) : isPro && !isTrialing ? (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Active
                    </span>
                  ) : null}
                </div>

                {subscription?.status === "canceled" ? (
                  <p className="text-sm text-gray-500">
                    Your subscription has been canceled.{" "}
                    {subscription.current_period_end && (
                      <>Access continues until {new Date(subscription.current_period_end).toLocaleDateString()}.</>
                    )}
                  </p>
                ) : isPro && !isTrialing ? (
                  <p className="text-sm text-gray-500">
                    Your subscription will automatically renew.
                  </p>
                ) : null}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3">
                {subscription?.status === "canceled" ? (
                  <Button 
                    onClick={() => router.push("/pricing")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Resubscribe
                  </Button>
                ) : !isPro || isTrialing ? (
                  <Button 
                    onClick={() => router.push("/pricing")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                ) : (
                  <Button 
                    onClick={() => router.push("/billing")}
                    variant="outline"
                    className="border-blue-200 hover:bg-blue-50"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Button 
                variant="outline"
                onClick={() => {
                  // TODO: Implement password reset
                  alert("Password reset email will be sent to your email address.");
                }}
              >
                <Lock className="w-4 h-4 mr-2" />
                Change Password
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
