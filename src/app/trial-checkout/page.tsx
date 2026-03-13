"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import {
  Loader2,
  CheckCircle2,
  Shield,
  Zap,
  FileText,
  MessageSquare,
  Search,
  BarChart3,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TrialCheckoutPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { isPro, isLoading: subLoading } = useSubscription();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/register");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!subLoading && isPro) {
      router.push("/resume");
    }
  }, [subLoading, isPro, router]);

  const handleCheckout = async () => {
    setIsCheckingOut(true);
    setError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "TRIAL" }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (response.status === 401) {
        router.push("/register");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const features = [
    { icon: FileText, label: "Unlimited resumes & cover letters" },
    { icon: Sparkles, label: "All 14+ premium templates" },
    { icon: BarChart3, label: "AI-powered ATS optimization" },
    { icon: Search, label: "LinkedIn job import" },
    { icon: MessageSquare, label: "Interview prep AI" },
    { icon: Shield, label: "No watermark on PDFs" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4 cursor-pointer" onClick={() => router.push("/")}>
            <img src="/logo.png" alt="LinImpact.ai" className="h-8 w-auto mr-2" />
            <span className="text-xl font-bold text-gray-900 font-[var(--font-poppins)]">
              LinImpact<span className="text-blue-600">.ai</span>
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Start Your 7-Day Pro Trial
          </h1>
          <p className="text-gray-600 text-lg">
            Full access to every feature for just <span className="font-bold text-blue-600">$1</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div>
                <p className="text-sm font-medium opacity-90">7-Day Pro Trial</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">$1</span>
                  <span className="text-sm opacity-75">one-time</span>
                </div>
              </div>
              <Zap className="w-10 h-10 opacity-80" />
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-3 mb-6">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-gray-700 text-sm">{f.label}</span>
                </div>
              ))}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-600/25"
            >
              {isCheckingOut ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Redirecting to payment...
                </>
              ) : (
                <>
                  Pay $1 & Start Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </Button>

            <p className="text-center text-xs text-gray-400 mt-4">
              One-time payment. No auto-renewal. Cancel anytime.
            </p>

            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5" />
                <span>Secure payment</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <img src="/gdpr-compliance-badge.webp" alt="GDPR" className="h-5 w-auto" />
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <img src="/ssl.avif" alt="SSL" className="h-5 w-auto" />
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have a subscription?{" "}
          <button onClick={() => router.push("/dashboard")} className="text-blue-600 hover:underline font-medium">
            Go to Dashboard
          </button>
        </p>
      </div>
    </div>
  );
}
