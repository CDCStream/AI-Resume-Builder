"use client";

import { useState, useRef } from "react";
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
  CheckCircle,
  Camera,
  Trash2
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { updateProfile, uploadAvatar } from "@/lib/supabase/database";

export default function SettingsPage() {
  const router = useRouter();
  const { user, avatarUrl, refreshProfile } = useAuth();
  const { isPro, isTrialing, trialDaysRemaining, plan, subscription } = useSubscription();
  
  const [fullName, setFullName] = useState(user?.user_metadata?.full_name || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    setAvatarPreview(URL.createObjectURL(file));
    setUploadingAvatar(true);
    try {
      const url = await uploadAvatar(user.id, file);
      if (url) await refreshProfile();
    } catch (err) {
      console.error("Avatar upload failed:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarPreview(null);
    await updateProfile({ avatar_url: null });
    await refreshProfile();
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.charAt(0).toUpperCase() || "U";

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({ full_name: fullName });
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
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
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden !py-0 !gap-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 pt-5 pb-5">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <User className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="py-6 bg-gradient-to-br from-blue-50/50 via-white/80 to-cyan-50/50 space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-semibold text-xl">{initials}</span>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:bg-blue-700 transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5" />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-700">Profile Photo</p>
                  <p className="text-xs text-gray-500">JPG, PNG or WebP. Max 2MB.</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={uploadingAvatar}>
                      Upload
                    </Button>
                    {displayAvatar && (
                      <Button variant="ghost" size="sm" onClick={handleRemoveAvatar} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

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
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden !py-0 !gap-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 pt-5 pb-5">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <CreditCard className="w-5 h-5" />
                Subscription & Billing
              </CardTitle>
              <CardDescription>Manage your subscription plan</CardDescription>
            </CardHeader>
            <CardContent className="py-6 bg-gradient-to-br from-blue-50/50 via-white/80 to-cyan-50/50">
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
          <Card className="border-blue-100 shadow-lg shadow-blue-500/5 overflow-hidden !py-0 !gap-0">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b border-blue-100 pt-5 pb-5">
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Lock className="w-5 h-5" />
                Security
              </CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </CardHeader>
            <CardContent className="py-6 bg-gradient-to-br from-blue-50/50 via-white/80 to-cyan-50/50">
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
