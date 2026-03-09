"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Script from "next/script";
import {
  CheckCircle2,
  ArrowRight,
  Zap,
  Menu,
  X,
  ArrowLeft,
  Loader2,
  Plus,
  Minus,
  HelpCircle,
  Shield,
  Clock,
  FileText,
  Star,
  Info
} from "lucide-react";
import { useState, useEffect } from "react";
import { trackPricingPageViewed, trackCheckoutStarted, trackPlanSelected } from "@/lib/mixpanel";

// Pricing FAQ data for SEO/AEO
const pricingFaqs = [
  {
    question: "Is the resume builder really free to try?",
    answer: "Yes! We offer a full-featured 3-day free trial with no credit card required. You get access to all premium features including AI resume optimization, 14+ templates, cover letter generator, and ATS checker during the trial."
  },
  {
    question: "What's included in the Pro plans?",
    answer: "All Pro plans include: unlimited resume and cover letter creation, all 14+ premium ATS-friendly templates, AI-powered content suggestions, ATS score optimization, LinkedIn profile import, job-specific cover letters, interview prep AI, 6-second resume scan, and priority support."
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer: "Absolutely! You can cancel your subscription at any time with just one click. Your access will continue until the end of your billing period, and you won't be charged again."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, MasterCard, American Express), debit cards, and PayPal through our secure payment partner Polar. All transactions are encrypted and secure."
  },
  {
    question: "Is there a money-back guarantee?",
    answer: "Yes! We offer a 7-day money-back guarantee on all paid plans. If you're not satisfied with our AI resume builder for any reason, contact us within 7 days for a full refund. No questions asked."
  },
  {
    question: "Can I switch between plans?",
    answer: "Yes, you can upgrade or downgrade your plan at any time. When upgrading, the price difference will be prorated. When downgrading, the change takes effect at your next billing date."
  },
  {
    question: "What happens when my free trial ends?",
    answer: "After the 3-day free trial, you'll need to subscribe to a paid plan to continue accessing premium features. Don't worry - we'll send you a reminder before the trial ends, and your resume drafts will be saved."
  },
  {
    question: "Which plan is best for job seekers?",
    answer: "For active job seekers, we recommend the Pro Quarterly plan - it's our most popular option and gives you 3 months of full access, perfect for a focused job search. If you're planning a longer career transition, the Pro Semi-Annual plan offers the best value with 44% savings."
  },
  {
    question: "Do you offer discounts for students?",
    answer: "Yes! Students can access special discounts. Contact our support team with your valid student ID for exclusive student pricing on all Pro plans."
  },
  {
    question: "Is my data secure?",
    answer: "Absolutely. We use bank-level encryption for all data transmission and storage. Your personal information and resumes are never shared or sold. You can also delete your data at any time from your account settings."
  }
];

// Pricing Schema for rich results
const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "LinImpact.ai Resume Builder Pro",
  "description": "AI-powered resume builder with ATS optimization, cover letter generator, and interview prep",
  "brand": {
    "@type": "Brand",
    "name": "LinImpact.ai"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free Trial",
      "price": "0",
      "priceCurrency": "USD",
      "description": "3-day free trial with all features",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "Pro Monthly",
      "price": "13.98",
      "priceCurrency": "USD",
      "billingIncrement": "P1M",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "Pro Quarterly",
      "price": "27.75",
      "priceCurrency": "USD",
      "billingIncrement": "P3M",
      "availability": "https://schema.org/InStock"
    },
    {
      "@type": "Offer",
      "name": "Pro Semi-Annual",
      "price": "47.10",
      "priceCurrency": "USD",
      "billingIncrement": "P6M",
      "availability": "https://schema.org/InStock"
    }
  ],
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "10000"
  }
};

const pricingFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": pricingFaqs.map(faq => ({
    "@type": "Question",
    "name": faq.question,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.answer
    }
  }))
};

export default function PricingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Track pricing page view
  useEffect(() => {
    trackPricingPageViewed();
  }, []);

  const planDetails: Record<string, { name: string; price: number }> = {
    FREE: { name: "Free Trial", price: 0 },
    PRO_MONTHLY: { name: "Pro Monthly", price: 13.98 },
    PRO_QUARTERLY: { name: "Pro Quarterly", price: 27.75 },
    PRO_SEMI_ANNUAL: { name: "Pro Semi-Annual", price: 47.10 },
  };

  const handleCheckout = async (plan: string) => {
    const details = planDetails[plan];
    trackPlanSelected(plan, details.name, details.price);

    if (plan === "FREE") {
      router.push("/register");
      return;
    }

    setLoadingPlan(plan);
    trackCheckoutStarted(plan, details.name, details.price);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (response.status === 401) {
        router.push("/register?redirect=/pricing");
      } else {
        console.error("Checkout error:", data.error);
      }
    } catch (error) {
      console.error("Checkout error:", error);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Schema.org structured data */}
      <Script
        id="pricing-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      <Script
        id="pricing-faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingFaqSchema) }}
      />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <img
                src="/logo.png"
                alt="LinImpact.ai Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-extrabold tracking-tight -ml-2" style={{ fontFamily: 'var(--font-poppins)' }}>
                <span className="text-cyan-500">Lin</span><span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span><span className="text-slate-500 font-semibold">.ai</span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-8">
              <Link href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Home
              </Link>
              <Link href="/#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </Link>
              <Link href="/#templates" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Templates
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                Pricing
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <Button variant="ghost" onClick={() => router.push("/login")}>
                Log in
              </Button>
              <Button onClick={() => router.push("/register")} className="bg-blue-600 hover:bg-blue-700">
                Get Started Free
              </Button>
            </div>

            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-1">
                <Link href="/" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Home
                </Link>
                <Link href="/#features" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </Link>
                <Link href="/#templates" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Templates
                </Link>
                <Link href="/pricing" className="px-3 py-2.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </Link>
                <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-gray-100">
                  <Button variant="outline" className="w-full justify-center" onClick={() => router.push("/login")}>
                    Log in
                  </Button>
                  <Button className="w-full justify-center bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/register")}>
                    Get Started Free
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header - SEO optimized */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Best Resume Builder Pricing
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              AI Resume Builder Plans & Pricing
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Create professional, ATS-friendly resumes with our AI-powered resume builder. Start with a free trial and upgrade when you need unlimited access to all features.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>7-Day Money Back</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span>4.9/5 Rating</span>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto items-stretch">
            {/* Free Trial */}
            <div className="relative bg-white rounded-2xl border-2 border-amber-300 p-6 hover:shadow-lg transition-shadow">
              <div className="mb-6">
                <span className="inline-block px-3 py-1 text-xs font-semibold text-amber-700 bg-amber-100 rounded-full mb-4">
                  3-DAY FREE TRIAL
                </span>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">$0</span>
                </div>
                <p className="text-gray-500 mt-2">Full access for 3 days</p>
              </div>

              <ul className="space-y-2 mb-8">
                {[
                  "Unlimited resumes & covers",
                  "All premium templates",
                  "AI-powered optimization",
                  "ATS score analysis",
                  "LinkedIn import",
                  "Interview prep AI",
                  "6-second resume scan",
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 min-h-[24px]">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                <li className="flex items-start gap-2 text-sm text-gray-400 min-h-[24px]">
                  <Info className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <span>PDF downloads with watermark</span>
                </li>
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => handleCheckout("FREE")}
              >
                Start Free Trial
              </Button>
            </div>

            {/* Pro Monthly */}
            <div className="relative bg-white rounded-2xl border-2 border-gray-200 p-6 hover:shadow-lg transition-shadow flex flex-col">
              <div className="mb-6 min-h-[140px]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🥉</span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Pro Monthly</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">$13</span>
                  <span className="text-xl text-gray-500">.98</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-gray-500 mt-2">Billed monthly</p>
                <div className="mt-2 h-6"></div>
              </div>

              <ul className="space-y-2 mb-8">
                {[
                  "Unlimited resumes & covers",
                  "All premium templates",
                  "No watermark",
                  "AI-powered suggestions",
                  "ATS score optimization",
                  "6-second resume scan",
                  "LinkedIn profile import",
                  "Job-specific cover letters",
                  "Interview prep AI",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 min-h-[24px]">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  onClick={() => handleCheckout("PRO_MONTHLY")}
                  disabled={loadingPlan === "PRO_MONTHLY"}
                >
                  {loadingPlan === "PRO_MONTHLY" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Get Pro Monthly"
                  )}
                </Button>
              </div>
            </div>

            {/* Pro Quarterly - Most Popular */}
            <div className="relative bg-white rounded-2xl border-2 border-green-500 p-6 shadow-xl shadow-green-500/10 flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full">
                MOST POPULAR
              </div>
              <div className="mb-6 min-h-[140px]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🥈</span>
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Pro Quarterly</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">$9</span>
                  <span className="text-xl text-gray-500">.25</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-gray-500 mt-2">$27.75 billed every 3 months</p>
                <div className="mt-2 inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded">
                  Save 34%
                </div>
              </div>

              <ul className="space-y-2 mb-8">
                {[
                  "Unlimited resumes & covers",
                  "All premium templates",
                  "No watermark",
                  "AI-powered suggestions",
                  "ATS score optimization",
                  "6-second resume scan",
                  "LinkedIn profile import",
                  "Job-specific cover letters",
                  "Interview prep AI",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 min-h-[24px]">
                    <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/25"
                  onClick={() => handleCheckout("PRO_QUARTERLY")}
                  disabled={loadingPlan === "PRO_QUARTERLY"}
                >
                  {loadingPlan === "PRO_QUARTERLY" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Get Pro Quarterly"
                  )}
                </Button>
              </div>
            </div>

            {/* Pro Semi-Annual - Best Value */}
            <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-400 p-6 shadow-lg flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full">
                BEST VALUE
              </div>
              <div className="mb-6 min-h-[140px]">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xl">🥇</span>
                  <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Pro Semi-Annual</span>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold text-gray-900">$7</span>
                  <span className="text-xl text-gray-500">.85</span>
                  <span className="text-gray-500">/mo</span>
                </div>
                <p className="text-gray-500 mt-2">$47.10 billed every 6 months</p>
                <div className="mt-2 inline-block px-2 py-1 bg-amber-100 text-amber-700 text-xs font-semibold rounded">
                  Save 44%
                </div>
              </div>

              <ul className="space-y-2 mb-8">
                {[
                  "Unlimited resumes & covers",
                  "All premium templates",
                  "No watermark",
                  "AI-powered suggestions",
                  "ATS score optimization",
                  "6-second resume scan",
                  "LinkedIn profile import",
                  "Job-specific cover letters",
                  "Interview prep AI",
                  "Priority support"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 min-h-[24px]">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span className="leading-tight">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Button
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/25"
                  onClick={() => handleCheckout("PRO_SEMI_ANNUAL")}
                  disabled={loadingPlan === "PRO_SEMI_ANNUAL"}
                >
                  {loadingPlan === "PRO_SEMI_ANNUAL" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Get Best Value"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* FAQ Section - SEO/AEO optimized */}
          <div className="mt-24 max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-4">
                <HelpCircle className="w-4 h-4" />
                Pricing FAQ
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Resume Builder Pricing Questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about our AI resume builder plans and pricing
              </p>
            </div>

            <div className="space-y-4">
              {pricingFaqs.map((faq, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:border-blue-200 transition-colors"
                >
                  <button
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaqIndex(openFaqIndex === i ? null : i)}
                    aria-expanded={openFaqIndex === i}
                  >
                    <h3 className="font-semibold text-gray-900 pr-4 text-left">{faq.question}</h3>
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${openFaqIndex === i ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {openFaqIndex === i ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  </button>
                  {openFaqIndex === i && (
                    <div className="px-6 pb-5 text-gray-600 leading-relaxed">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Money Back Guarantee */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 rounded-full">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-green-700 font-medium">7-day money-back guarantee on all paid plans</span>
            </div>
          </div>

          {/* How to Get Started */}
          <div className="mt-20 max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">How to Get Started</h2>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">1</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sign up for free</h3>
                  <p className="text-sm text-gray-600 mt-1">Create your account in seconds. No credit card required. You get full access to all features during your 3-day free trial.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">2</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Build your resume with AI</h3>
                  <p className="text-sm text-gray-600 mt-1">Choose from 14+ professional templates, import your LinkedIn profile, or upload an existing resume. Our humanized AI writes content that sounds like a professional writer, not a robot.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-sm">3</div>
                <div>
                  <h3 className="font-semibold text-gray-900">Optimize and download</h3>
                  <p className="text-sm text-gray-600 mt-1">Check your ATS score, generate a matching cover letter, and practice for interviews with AI mock sessions. Download as PDF and start applying with confidence.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Button variant="ghost" onClick={() => router.push("/")} className="text-gray-600">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="LinImpact.ai" className="w-8 h-8" />
              <span className="text-sm text-gray-500">© 2024 LinImpact.ai. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/blog" className="hover:text-gray-900 transition-colors">Blog</Link>
              <Link href="/terms" className="hover:text-gray-900 transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-gray-900 transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
