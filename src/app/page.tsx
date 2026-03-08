"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AnimatedGridBackground } from "@/components/ui/animated-grid-background";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Sparkles,
  Target,
  Download,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  ShieldCheck,
  Lock,
  Globe,
  Star,
  Brain,
  MousePointerClick,
  ChevronRight,
  Play,
  Menu,
  X,
  Eye,
  Plus,
  Minus,
  HelpCircle,
  Info,
  ClipboardList
} from "lucide-react";
import Script from "next/script";
import { faqSchema } from "./seo-metadata";
import { insertPlatformSurvey } from "@/lib/supabase/database";

const CompanyOrbit = dynamic(() => import("@/components/ui/company-logos").then(m => m.CompanyOrbit), { ssr: false });
const HowItWorksGuide = dynamic(() => import("@/components/landing/HowItWorksGuide").then(m => m.HowItWorksGuide), { ssr: false });

// FAQ Data for SEO/AEO - targeting low competition keywords
const faqs = [
  {
    question: "What is an ATS-friendly resume?",
    answer: "An ATS-friendly resume is designed to pass through Applicant Tracking Systems - software that 75% of employers use to filter job applications. It uses standard formatting, relevant keywords from the job description, and clean layouts that can be easily parsed. Our AI resume builder automatically optimizes your resume for ATS compatibility, increasing your chances of reaching human recruiters."
  },
  {
    question: "How do I write a cover letter for a job application?",
    answer: "To write an effective cover letter: 1) Address the hiring manager by name when possible, 2) Open with a compelling hook explaining why you're interested in this specific role, 3) Highlight 2-3 achievements that directly match the job requirements, 4) Show genuine enthusiasm for the company, and 5) End with a clear call to action. Our AI cover letter generator creates personalized, job-matched cover letters in seconds."
  },
  {
    question: "How long should a cover letter be?",
    answer: "A cover letter should be 250-400 words, fitting on one page with standard margins. Research shows hiring managers spend only 7 seconds scanning cover letters, so keep it concise and impactful. Focus on your 3 most relevant qualifications rather than repeating your entire resume. Our AI ensures optimal length while highlighting key points."
  },
  {
    question: "What is the best resume format for 2026?",
    answer: "The reverse-chronological format remains the most widely accepted and ATS-friendly resume format in 2026. It lists your most recent experience first, which recruiters prefer. For career changers, a combination/hybrid format highlighting transferable skills works well. Our resume builder offers 14 professionally designed templates, all optimized for modern ATS systems and hiring practices."
  },
  {
    question: "How can I make my resume stand out to recruiters?",
    answer: "To make your resume stand out: 1) Use strong action verbs and quantify achievements with numbers (e.g., 'Increased sales by 40%'), 2) Tailor it to each job description using matching keywords, 3) Include a compelling professional summary, 4) Keep formatting clean and scannable, 5) Use our 6-second resume scan feature to see exactly what recruiters notice in the critical first moments."
  },
  {
    question: "Is a cover letter necessary for job applications?",
    answer: "While not always explicitly required, submitting a cover letter significantly increases your chances of landing an interview. Studies show that 83% of hiring managers read cover letters when deciding whom to interview. It's especially important for competitive positions, career changes, or when you want to explain employment gaps. Our AI makes creating tailored cover letters quick and easy."
  },
  {
    question: "How do I address a cover letter without a name?",
    answer: "When you don't know the hiring manager's name, use professional alternatives: 'Dear Hiring Manager,' 'Dear [Department] Team' (e.g., 'Dear Marketing Team'), or 'Dear Recruitment Team.' Avoid outdated phrases like 'To Whom It May Concern' or 'Dear Sir/Madam.' Pro tip: Check LinkedIn or the company website to find the hiring manager's name for a more personal touch."
  },
  {
    question: "Can I import my LinkedIn profile to create a resume?",
    answer: "Yes! Our LinkedIn import feature lets you create a professional resume from your LinkedIn profile in one click. The AI automatically extracts your experience, education, skills, and achievements, then formats everything into an ATS-optimized resume. You can then customize the content, choose from 14 templates, and enhance it with AI-powered suggestions."
  },
  {
    question: "What should I include in a software engineer resume?",
    answer: "A software engineer resume should include: 1) Technical skills section with programming languages, frameworks, and tools, 2) Professional experience with quantified achievements (e.g., 'Reduced load time by 50%'), 3) Notable projects with technologies used, 4) Education and relevant certifications, 5) GitHub/portfolio links. Our AI specifically optimizes tech resumes with industry-relevant keywords that pass ATS filters."
  },
  {
    question: "How does the AI resume builder work?",
    answer: "Our AI resume builder uses advanced language models to analyze your experience and target job descriptions. It suggests powerful action verbs, quantifies your achievements, optimizes keywords for ATS systems, and generates professional summaries. Simply input your information or import from LinkedIn, and the AI enhances your content in real-time while maintaining a natural, human tone."
  },
  {
    question: "What's the difference between a CV and a resume?",
    answer: "A resume is a 1-2 page summary of your relevant experience tailored to a specific job, common in the US and Canada. A CV (Curriculum Vitae) is a comprehensive document listing your entire academic and professional history, typically used in academia, research, and some international job markets. For most corporate jobs, you'll want a concise resume, which our AI builder specializes in creating."
  },
  {
    question: "How do I prepare for a job interview?",
    answer: "Effective interview preparation includes: 1) Research the company's mission, recent news, and culture, 2) Practice answering common questions using the STAR method (Situation, Task, Action, Result), 3) Prepare thoughtful questions to ask the interviewer, 4) Review your resume and be ready to discuss every item. Our Interview Prep AI generates personalized practice questions based on your resume and target job role."
  },
  {
    question: "Is it worth paying for an AI resume builder?",
    answer: "Most free AI resume builders produce generic, template-based content that recruiters can spot instantly. A quality AI resume builder like LinImpact.ai uses humanized AI that narrates your unique professional story — not just fills in blanks. The result is indistinguishable from a $100 professional writer's work. Plus, features like ATS score analysis, 6-second recruiter heatmap simulation, and AI interview prep give you a measurable advantage. With a free 3-day trial (no credit card required), you can see the difference before committing."
  },
  {
    question: "What is the best AI resume builder for competitive job markets?",
    answer: "In competitive markets (tech, finance, healthcare), your resume needs to do more than look good — it must pass ATS filters and grab a recruiter's attention in 6 seconds. LinImpact.ai is built for this: 1) Humanized AI content that avoids the 'generic AI' red flag recruiters now watch for, 2) ATS optimization with real-time scoring, 3) AI-powered mock interviews with STAR method coaching, 4) Cover letter generator matched to specific job postings. We offer a 3-day free trial with no credit card required — try every feature before you decide."
  }
];

// FAQ Accordion Component
function FAQItem({ question, answer, isOpen, onClick }: { question: string; answer: string; isOpen: boolean; onClick: () => void }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden hover:border-blue-200 transition-colors">
      <button
        className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 bg-white hover:bg-gray-50 transition-colors"
        onClick={onClick}
        aria-expanded={isOpen}
      >
        <h3 className="font-semibold text-gray-900 pr-4 text-left">{question}</h3>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isOpen ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </div>
      </button>
      {isOpen && (
        <div className="px-6 pb-5 text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [surveyModalOpen, setSurveyModalOpen] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [otherPlatformText, setOtherPlatformText] = useState("");
  const [surveySubmitting, setSurveySubmitting] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const surveyPlatforms = [
    "Kaggle", "Hugging Face", "Stack Overflow", "Medium", "Quora",
    "Substack", "dev.to", "Behance", "Dribbble", "YouTube", "Loom", "Product Hunt"
  ];

  const togglePlatform = (p: string) => {
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleSurveySubmit = async () => {
    if (selectedPlatforms.length === 0 && !otherPlatformText.trim()) return;
    setSurveySubmitting(true);
    const allPlatforms = [...selectedPlatforms];
    if (otherPlatformText.trim()) allPlatforms.push(`Other: ${otherPlatformText.trim()}`);
    await insertPlatformSurvey(allPlatforms, otherPlatformText.trim() || undefined);
    setSurveySubmitted(true);
    setSurveySubmitting(false);
    setTimeout(() => { setSurveyModalOpen(false); setSurveySubmitted(false); setSelectedPlatforms([]); setOtherPlatformText(""); }, 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/95 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center flex-shrink-0">
              <Image
                src="/logo.png"
                alt="LinImpact.ai Logo"
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
                priority
              />
              <span className="text-3xl font-extrabold tracking-tight -ml-4" style={{ fontFamily: 'var(--font-poppins)' }}>
                <span className="text-cyan-500">Lin</span><span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-blue-600 bg-clip-text text-transparent">Impact</span><span className="text-slate-500 font-semibold">.ai</span>
              </span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Features
              </a>
              <a href="#templates" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Templates
              </a>
              <a href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                How It Works
              </a>
              <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Pricing
              </a>
              <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                FAQ
              </a>
              <Link href="/blog" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                Blog
              </Link>
            </nav>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="hidden lg:inline-flex" onClick={() => router.push("/login")}>
                Sign in
              </Button>
              <Button size="sm" className="hidden lg:inline-flex bg-blue-600 hover:bg-blue-700" onClick={() => router.push("/register")}>
                Get Started
              </Button>
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5 text-gray-700" /> : <Menu className="w-5 h-5 text-gray-700" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-100 bg-white pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col px-4 pt-3 gap-1">
                <a href="#features" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Features
                </a>
                <a href="#templates" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Templates
                </a>
                <a href="#how-it-works" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  How It Works
                </a>
                <a href="#pricing" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Pricing
                </a>
                <a href="#faq" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  FAQ
                </a>
                <Link href="/blog" className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" onClick={() => setMobileMenuOpen(false)}>
                  Blog
                </Link>
                <div className="border-t border-gray-100 mt-2 pt-3 flex flex-col gap-2 px-3">
                  <Button variant="outline" size="sm" className="w-full justify-center border-blue-200" onClick={() => { router.push("/login"); setMobileMenuOpen(false); }}>
                    Sign in
                  </Button>
                  <Button size="sm" className="w-full justify-center bg-blue-600 hover:bg-blue-700" onClick={() => { router.push("/register"); setMobileMenuOpen(false); }}>
                    Get Started
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <AnimatedGridBackground
        className="bg-gradient-to-b from-slate-50 via-blue-50/30 to-white"
        gridSize={50}
        revealRadius={400}
        baseOpacity={0.04}
        revealOpacity={0.25}
      >
        <section className="relative pt-16 pb-24 sm:pt-24 sm:pb-32">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute top-60 -left-40 w-80 h-80 bg-indigo-100 rounded-full blur-3xl opacity-50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {/* New Feature Banner */}
              <div className="mb-6 space-y-2">
                <div className="inline-flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-sm font-semibold text-green-700">
                    <Sparkles className="w-4 h-4" />
                    New Feature Launched!
                  </span>
                  <span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Digital Portfolio & Proof of Work Section</span>
                  <div className="relative group">
                    <Info className="w-4 h-4 text-gray-400 cursor-pointer hover:text-blue-500 transition-colors" />
                    <div className="absolute left-0 top-full mt-2 w-72 p-3 rounded-lg bg-gray-900 text-white text-xs leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-xl">
                      In 2026, recruiters care less about keyword-stuffed resumes and more about proof of real work. This section lets you link your GitHub profile directly to your resume, automatically pulling repo stats, stars, and languages — turning your code into credible career evidence.
                      <div className="absolute left-4 -top-1 w-2 h-2 bg-gray-900 rotate-45" />
                    </div>
                  </div>
                  <button onClick={() => setDemoModalOpen(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
                    <Play className="w-3 h-3 fill-white" />
                    Watch Demo
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">Digital Portfolio & Proof of Work — Currently supports <svg className="w-4 h-4 text-gray-800" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> <strong className="text-gray-700">GitHub</strong> only.</span>
                  <button onClick={() => setSurveyModalOpen(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 text-blue-600 font-medium hover:bg-blue-50 transition-colors">
                    <ClipboardList className="w-3 h-3" />
                    Vote for next platforms
                  </button>
                </div>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Build your resume, cover letter & prep interviews with Humanized AI —{" "}
                <span className="relative inline-block whitespace-nowrap">
                  <span className="bg-gradient-to-r from-blue-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    get hired faster
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                    <path d="M2 8C50 3 150 3 198 8" stroke="url(#gradient)" strokeWidth="3" strokeLinecap="round"/>
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                        <stop stopColor="#2563eb"/>
                        <stop offset="1" stopColor="#4f46e5"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Only 2% of applications win. Our AI doesn&apos;t generate generic text — it narrates your professional story, making it indistinguishable from a $100 professional writer&apos;s work.
                <span className="font-semibold text-gray-900"> Yours will be one of them.</span>
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Button
                  size="lg"
                  className="text-base px-8 py-6 h-14 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/25 transition-all hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
                  onClick={() => router.push("/register")}
                >
                  Create Resume
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button
                  size="lg"
                  className="text-base px-8 py-6 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg shadow-indigo-600/25 transition-all hover:shadow-xl hover:shadow-indigo-600/30 hover:-translate-y-0.5"
                  onClick={() => router.push("/register")}
                >
                  Upload CV & Generate Cover Letter
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap items-center gap-6 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>3-day free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <span>ATS-optimized templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  <span>Humanized AI, not generic</span>
                </div>
              </div>
              <p className="mt-3 text-xs text-gray-400 flex items-center gap-1.5 justify-center lg:justify-start">
                <Lock className="w-3 h-3" />
                Your data is encrypted and never shared with third parties.
              </p>

              {/* Social Proof */}
              <div className="mt-10 pt-8 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-8 justify-center lg:justify-start">
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold text-gray-900">39%</div>
                    <div className="text-sm text-gray-500">more likely to land the job</div>
                  </div>
                  <div className="h-10 w-px bg-gray-200 hidden sm:block" />
                  <div className="text-center lg:text-left">
                    <div className="flex items-center gap-1 justify-center lg:justify-start">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">4.9/5 from 10,000+ reviews</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Content - 4 Feature Cards */}
            <div className="relative lg:pl-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Feature 1: LinkedIn to Resume */}
                <div className="group relative bg-white rounded-2xl shadow-lg shadow-blue-500/5 border border-blue-100 p-5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    {/* Illustration */}
                    <div className="h-36 mb-4 flex items-center justify-center gap-1">
                      {/* LinkedIn Card */}
                      <div className="w-[38%] flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 p-2 group-hover:translate-x-[-4px] transition-transform duration-700">
                        <div className="w-full h-6 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-md mb-1.5" />
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="h-1.5 w-10 bg-gray-800 rounded" />
                            <div className="h-1 w-8 bg-blue-500 rounded mt-0.5" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="h-1 w-full bg-gray-200 rounded" />
                          <div className="h-1 w-4/5 bg-gray-200 rounded" />
                        </div>
                        <div className="flex items-center justify-center mt-1.5">
                          <svg viewBox="0 0 24 24" className="w-4 h-4 text-blue-600 fill-current">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                          </svg>
                        </div>
                      </div>

                      {/* Arrow Animation */}
                      <div className="flex-1 flex items-center justify-center min-w-[24px]">
                        <svg width="100%" height="20" viewBox="0 0 40 20" preserveAspectRatio="xMidYMid meet" className="text-blue-400 max-w-[50px]">
                          <path d="M2 10 L30 10" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3" className="animate-dash" />
                          <path d="M28 5 L35 10 L28 15" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      {/* Resume Card */}
                      <div className="w-[38%] flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 p-2 group-hover:translate-x-[4px] transition-transform duration-700">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center border-2 border-white shadow-sm flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-4 h-4 text-white fill-current">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="h-1.5 w-10 bg-gray-800 rounded" />
                            <div className="h-1 w-8 bg-gray-400 rounded mt-0.5" />
                          </div>
                        </div>
                        <div className="h-1 w-6 bg-gray-700 rounded mb-1" />
                        <div className="space-y-0.5 mb-1.5">
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                          <div className="h-0.5 w-4/5 bg-gray-300 rounded" />
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                        </div>
                        <div className="h-1 w-5 bg-gray-700 rounded mb-1" />
                        <div className="flex gap-1">
                          <div className="h-3 w-8 bg-blue-100 rounded-full" />
                          <div className="h-3 w-6 bg-blue-100 rounded-full" />
                        </div>
                        <div className="flex gap-1 mt-0.5">
                          <div className="h-3 w-7 bg-blue-100 rounded-full" />
                          <div className="h-3 w-9 bg-blue-100 rounded-full" />
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1">LinkedIn to Resume</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">Import your LinkedIn profile and convert it into a professional resume & cover letter</p>
                    <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>One-click import</span>
                    </div>
                  </div>
                </div>

                {/* Feature 2: ATS Score Optimizer */}
                <div className="group relative bg-white rounded-2xl shadow-lg shadow-green-500/5 border border-green-100 p-5 hover:shadow-xl hover:shadow-green-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    {/* Illustration */}
                    <div className="relative h-36 mb-4 flex items-center justify-center">
                      {/* Resume with ATS */}
                      <div className="relative w-[100px] bg-white rounded-lg shadow-md border border-gray-200 p-2.5">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-6 h-6 rounded-full bg-gray-200" />
                          <div>
                            <div className="h-1.5 w-10 bg-gray-800 rounded" />
                            <div className="h-1 w-7 bg-gray-400 rounded mt-0.5" />
                          </div>
                        </div>
                        <div className="space-y-1 mb-2">
                          <div className="h-1 w-full bg-gray-200 rounded" />
                          <div className="h-1 w-4/5 bg-gray-200 rounded" />
                          <div className="h-1 w-full bg-gray-200 rounded" />
                        </div>
                        <div className="h-1 w-6 bg-gray-700 rounded mb-1" />
                        <div className="flex flex-wrap gap-1">
                          <div className="h-3 w-8 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                          </div>
                          <div className="h-3 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                          </div>
                          <div className="h-3 w-7 bg-red-100 rounded-full flex items-center justify-center animate-pulse">
                            <div className="w-1 h-1 bg-red-400 rounded-full" />
                          </div>
                          <div className="h-3 w-9 bg-green-100 rounded-full flex items-center justify-center">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                          </div>
                        </div>
                      </div>

                      {/* ATS Score Circle */}
                      <div className="absolute -top-1 -right-1 w-14 h-14 bg-white rounded-full shadow-lg border border-green-200 flex items-center justify-center animate-float">
                        <svg viewBox="0 0 36 36" className="w-12 h-12">
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#22c55e" strokeWidth="3" strokeDasharray="92, 100" strokeLinecap="round" className="animate-score-fill" />
                          <text x="18" y="21" textAnchor="middle" className="text-[8px] font-bold fill-green-600">92%</text>
                        </svg>
                      </div>

                      {/* Suggestion Popup */}
                      <div className="absolute -bottom-1 -left-2 bg-white rounded-lg shadow-md border border-amber-200 p-1.5 animate-float-delayed">
                        <div className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          <span className="text-[9px] font-semibold text-gray-700">+5 skills</span>
                        </div>
                      </div>

                      {/* Humanized Content Badge */}
                      <div className="absolute bottom-0 right-0 bg-white rounded-lg shadow-md border border-blue-200 p-1.5 animate-float" style={{ animationDelay: '1s' }}>
                        <div className="flex items-center gap-1">
                          <Brain className="w-3 h-3 text-blue-500" />
                          <span className="text-[8px] font-semibold text-blue-700">Humanized</span>
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1">ATS Score Optimizer</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">Boost ATS score with smart skill matching & humanized AI content</p>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Skill matching</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Human tone</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Cover Letter Generator */}
                <div className="group relative bg-white rounded-2xl shadow-lg shadow-purple-500/5 border border-purple-100 p-5 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    {/* Illustration */}
                    <div className="relative h-36 mb-4 flex items-center justify-center gap-1">
                      {/* LinkedIn Job Post Card */}
                      <div className="w-[38%] flex-shrink-0 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden group-hover:translate-x-[-3px] transition-transform duration-700">
                        {/* LinkedIn Header Bar */}
                        <div className="bg-[#0a66c2] px-2 py-1 flex items-center gap-1">
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current flex-shrink-0">
                            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                          </svg>
                          <span className="text-[6px] text-white font-semibold">Jobs</span>
                        </div>
                        <div className="p-2">
                          <div className="flex items-start gap-1.5 mb-1.5">
                            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center flex-shrink-0">
                              <span className="text-[6px] text-white font-bold">G</span>
                            </div>
                            <div className="min-w-0">
                              <div className="h-1.5 w-11 bg-gray-800 rounded" />
                              <div className="h-1 w-9 bg-[#0a66c2] rounded mt-0.5" />
                              <div className="h-1 w-12 bg-gray-300 rounded mt-0.5" />
                            </div>
                          </div>
                          <div className="space-y-0.5 mb-1.5">
                            <div className="h-0.5 w-full bg-gray-200 rounded" />
                            <div className="h-0.5 w-4/5 bg-gray-200 rounded" />
                            <div className="h-0.5 w-full bg-gray-200 rounded" />
                          </div>
                          <div className="w-full h-4 bg-[#0a66c2] rounded-full flex items-center justify-center gap-0.5">
                            <svg viewBox="0 0 24 24" className="w-2.5 h-2.5 text-white fill-current"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
                            <span className="text-[7px] text-white font-bold tracking-wide">Easy Apply</span>
                          </div>
                        </div>
                      </div>

                      {/* Arrow with Sparkles */}
                      <div className="flex-1 flex flex-col items-center justify-center gap-0.5 min-w-[24px]">
                        <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                        <svg width="100%" height="16" viewBox="0 0 36 16" preserveAspectRatio="xMidYMid meet" className="text-purple-400 max-w-[50px]">
                          <path d="M2 8 L26 8" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" className="animate-dash" />
                          <path d="M24 4 L30 8 L24 12" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <Sparkles className="w-2.5 h-2.5 text-purple-300 animate-pulse" style={{ animationDelay: '0.5s' }} />
                      </div>

                      {/* Cover Letter */}
                      <div className="w-[38%] flex-shrink-0 bg-white rounded-lg shadow-md border border-purple-200 p-2.5 group-hover:translate-x-[3px] transition-transform duration-700">
                        <div className="flex items-center gap-1 mb-1.5">
                          <FileText className="w-3 h-3 text-purple-500 flex-shrink-0" />
                          <span className="text-[6px] font-semibold text-purple-700">Cover Letter</span>
                        </div>
                        <div className="text-[5px] text-gray-500 mb-1">Dear Hiring Manager,</div>
                        <div className="space-y-0.5 mb-1">
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                          <div className="h-0.5 w-11/12 bg-gray-300 rounded" />
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                          <div className="h-0.5 w-4/5 bg-gray-300 rounded" />
                          <div className="h-0.5 w-full bg-gray-300 rounded" />
                        </div>
                        <div className="text-[5px] text-gray-500 mb-0.5">Sincerely,</div>
                        <div className="h-1 w-12 bg-gradient-to-r from-purple-300 to-purple-400 rounded" />
                      </div>

                      {/* Match Badge */}
                      <div className="absolute -top-1 right-0 bg-purple-100 rounded-full px-2 py-0.5 border border-purple-200 animate-float">
                        <span className="text-[7px] font-bold text-purple-600">Job-Matched</span>
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1">AI Cover Letter</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">Generate personalized cover letters tailored to each LinkedIn job posting</p>
                    <div className="flex items-center gap-1 text-xs text-purple-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Job-specific content</span>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Interview Preparation */}
                <div className="group relative bg-white rounded-2xl shadow-lg shadow-orange-500/5 border border-orange-100 p-5 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 transition-all duration-500 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    {/* Illustration */}
                    <div className="relative h-36 mb-4 flex items-center justify-center">
                      {/* Interview Chat Simulation */}
                      <div className="w-[160px] space-y-2">
                        {/* Interviewer Question */}
                        <div className="flex items-start gap-1.5 animate-slide-in-1">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                          <div className="bg-orange-50 rounded-lg rounded-tl-none px-2 py-1.5 border border-orange-100">
                            <p className="text-[7px] text-gray-700">Tell me about a challenge you faced...</p>
                          </div>
                        </div>

                        {/* User Answer */}
                        <div className="flex items-start gap-1.5 flex-row-reverse animate-slide-in-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-white fill-current">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                            </svg>
                          </div>
                          <div className="bg-blue-50 rounded-lg rounded-tr-none px-2 py-1.5 border border-blue-100">
                            <p className="text-[7px] text-gray-700">In my previous role, I led a team...</p>
                          </div>
                        </div>

                        {/* AI Feedback */}
                        <div className="flex items-center gap-1 bg-green-50 rounded-lg px-2 py-1 border border-green-200 animate-slide-in-3">
                          <div className="flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <Star className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
                            <Star className="w-2.5 h-2.5 text-gray-300" />
                          </div>
                          <span className="text-[7px] font-semibold text-green-700">8/10 Great answer!</span>
                        </div>
                      </div>

                      {/* Score Badge */}
                      <div className="absolute -top-1 -right-1 bg-white rounded-full shadow-md border border-orange-200 w-10 h-10 flex items-center justify-center animate-float">
                        <div className="text-center">
                          <div className="text-[8px] font-bold text-orange-600">85%</div>
                          <div className="text-[5px] text-gray-400">Ready</div>
                        </div>
                      </div>
                    </div>

                    {/* Text */}
                    <h3 className="text-sm font-bold text-gray-900 mb-1">Interview Prep</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-2">Practice with AI-powered mock interviews based on your resume & target job</p>
                    <div className="flex items-center gap-1 text-xs text-orange-600 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Real-time AI feedback</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </section>
      </AnimatedGridBackground>

      {/* How It Works */}
      <HowItWorksGuide />

      {/* Logos Section - Orbiting Companies */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white border-t border-gray-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <CompanyOrbit />
        </div>
      </section>

      {/* Trust Bar - GDPR & Security */}
      <section className="py-8 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-green-600" />
              </div>
              <span className="font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Lock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="font-medium">AES-256 Encryption</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-600" />
              </div>
              <span className="font-medium">No AI Training with Your Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Way beyond a resume & cover letter builder
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              AI-powered tools to create resumes, generate cover letters, prepare for interviews, and manage your job applications — all in one place.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "Humanized AI Writing",
                description: "No generic templates. Our AI narrates your unique professional story with human-like tone — indistinguishable from a $100 professional resume writer's work.",
                color: "blue"
              },
              {
                icon: Target,
                title: "ATS Score Analysis",
                description: "Check your resume's compatibility with Applicant Tracking Systems and get actionable improvements.",
                color: "green"
              },
              {
                icon: FileText,
                title: "Cover Letter Generator",
                description: "Create tailored cover letters for each job application with AI that understands job requirements.",
                color: "purple"
              },
              {
                icon: Sparkles,
                title: "AI Interview Prep",
                description: "Practice with AI-powered mock interviews tailored to your resume and target role. Get real-time feedback and confidence scores before the real thing.",
                color: "orange"
              },
              {
                icon: MousePointerClick,
                title: "One-Click Tailoring",
                description: "Paste any job description and instantly tailor your resume to match the role you're targeting.",
                color: "rose"
              },
              {
                icon: Globe,
                title: "LinkedIn Import",
                description: "Import your LinkedIn profile and job postings to quickly create targeted applications.",
                color: "cyan"
              },
              {
                icon: Eye,
                title: "6-Second Resume Scan",
                description: "See exactly what recruiters see in the first 6 seconds with AI-powered eye-tracking simulation.",
                color: "amber"
              },
              {
                icon: Download,
                title: "PDF Export",
                description: "Download your resume or cover letter as a perfectly formatted PDF, ready to submit to any employer.",
                color: "pink"
              },
              {
                icon: ShieldCheck,
                title: "Your Privacy First",
                description: "Your data is never used to train AI models. All processes are protected under European standards (GDPR) with end-to-end encryption.",
                color: "emerald"
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="group p-6 rounded-2xl border border-gray-200 bg-white hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates Section */}
      <section id="templates" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pick a template, get hired faster
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              14 professionally designed, ATS-tested resume & cover letter templates to help you stand out and land more interviews.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Professional White */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 p-3 overflow-hidden">
                  {/* Professional White - Clean minimal header */}
                  <div className="border-b border-gray-200 pb-2 mb-2">
                    <div className="h-3 w-24 bg-gray-800 rounded mb-1" />
                    <div className="h-1.5 w-16 bg-blue-500 rounded mb-1" />
                    <div className="flex gap-2">
                      <div className="h-1 w-12 bg-gray-300 rounded" />
                      <div className="h-1 w-14 bg-gray-300 rounded" />
            </div>
          </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-12 bg-gray-700 rounded" />
                    <div className="h-1 w-full bg-gray-200 rounded" />
                    <div className="h-1 w-11/12 bg-gray-200 rounded" />
                    <div className="h-1.5 w-14 bg-gray-700 rounded mt-2" />
                    <div className="h-1 w-full bg-gray-200 rounded" />
                    <div className="h-1 w-10/12 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Professional White</h3>
              <p className="text-sm text-gray-500">Clean & minimal design</p>
        </div>

            {/* Modern Sidebar */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 overflow-hidden flex">
                  {/* Dark sidebar */}
                  <div className="w-1/3 bg-slate-700 p-2">
                    <div className="w-6 h-6 rounded-full bg-slate-500 mx-auto mb-2" />
                    <div className="h-1.5 w-full bg-slate-500 rounded mb-1" />
                    <div className="h-1 w-10/12 bg-slate-600 rounded mb-2" />
                    <div className="h-1 w-full bg-slate-600 rounded mb-1" />
                    <div className="h-1 w-8/12 bg-slate-600 rounded" />
                  </div>
                  {/* Main content */}
                  <div className="flex-1 p-2">
                    <div className="h-2 w-16 bg-gray-800 rounded mb-1" />
                    <div className="h-1 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-1 w-11/12 bg-gray-200 rounded mb-2" />
                    <div className="h-1.5 w-12 bg-gray-700 rounded mb-1" />
                    <div className="h-1 w-full bg-gray-200 rounded mb-1" />
                    <div className="h-1 w-10/12 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Modern Sidebar</h3>
              <p className="text-sm text-gray-500">Two-column dark sidebar</p>
            </div>

            {/* Creative Timeline */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 p-3 overflow-hidden">
                  {/* Purple header */}
                  <div className="bg-violet-600 -mx-3 -mt-3 p-2 mb-2">
                    <div className="h-2.5 w-20 bg-white/90 rounded mb-1" />
                    <div className="h-1.5 w-14 bg-white/60 rounded" />
            </div>
                  {/* Timeline style content */}
                  <div className="relative pl-3">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-violet-200" />
                    <div className="space-y-2">
                      <div className="relative">
                        <div className="absolute -left-3 top-0.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                        <div className="h-1.5 w-14 bg-gray-700 rounded mb-0.5" />
                        <div className="h-1 w-full bg-gray-200 rounded" />
                      </div>
                      <div className="relative">
                        <div className="absolute -left-3 top-0.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
                        <div className="h-1.5 w-12 bg-gray-700 rounded mb-0.5" />
                        <div className="h-1 w-10/12 bg-gray-200 rounded" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Creative Timeline</h3>
              <p className="text-sm text-gray-500">Purple timeline design</p>
            </div>

            {/* Executive Dark */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-zinc-900 rounded-lg p-3 overflow-hidden">
                  {/* Dark luxury header */}
                  <div className="border-b border-amber-500/30 pb-2 mb-2">
                    <div className="h-2.5 w-20 bg-white rounded mb-1" />
                    <div className="h-1.5 w-14 bg-amber-500 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-12 bg-amber-500/80 rounded" />
                    <div className="h-1 w-full bg-zinc-700 rounded" />
                    <div className="h-1 w-11/12 bg-zinc-700 rounded" />
                    <div className="h-1.5 w-10 bg-amber-500/80 rounded mt-2" />
                    <div className="h-1 w-full bg-zinc-700 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Executive Dark</h3>
              <p className="text-sm text-gray-500">Dark luxury with gold</p>
            </div>

            {/* Professional Teal */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 p-3 overflow-hidden">
                  {/* Teal header */}
                  <div className="bg-teal-600 -mx-3 -mt-3 p-2 mb-2">
                    <div className="h-2.5 w-20 bg-white rounded mb-1" />
                    <div className="h-1.5 w-16 bg-teal-200 rounded" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-14 bg-teal-700 rounded" />
                    <div className="h-1 w-full bg-gray-200 rounded" />
                    <div className="h-1 w-11/12 bg-gray-200 rounded" />
                    <div className="flex gap-1 mt-2">
                      <div className="h-3 w-8 bg-teal-100 rounded" />
                      <div className="h-3 w-10 bg-teal-100 rounded" />
                      <div className="h-3 w-7 bg-teal-100 rounded" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Professional Teal</h3>
              <p className="text-sm text-gray-500">Teal header accent</p>
            </div>

            {/* Modern Grid */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-gray-50 rounded-lg border border-gray-100 p-2 overflow-hidden">
                  {/* Card-based grid layout */}
                  <div className="bg-indigo-600 rounded p-1.5 mb-2">
                    <div className="h-2 w-16 bg-white rounded mb-0.5" />
                    <div className="h-1 w-12 bg-indigo-200 rounded" />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <div className="bg-white rounded p-1.5 border border-gray-100">
                      <div className="h-1 w-8 bg-indigo-500 rounded mb-1" />
                      <div className="h-0.5 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="bg-white rounded p-1.5 border border-gray-100">
                      <div className="h-1 w-6 bg-indigo-500 rounded mb-1" />
                      <div className="h-0.5 w-full bg-gray-200 rounded" />
                    </div>
                    <div className="bg-white rounded p-1.5 border border-gray-100 col-span-2">
                      <div className="h-1 w-10 bg-indigo-500 rounded mb-1" />
                      <div className="h-0.5 w-full bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Modern Grid</h3>
              <p className="text-sm text-gray-500">Card-based grid layout</p>
        </div>

            {/* Classic Traditional */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 p-3 overflow-hidden">
                  {/* Traditional centered header */}
                  <div className="text-center border-b border-gray-300 pb-2 mb-2">
                    <div className="h-3 w-20 bg-gray-800 rounded mx-auto mb-1" />
                    <div className="h-1 w-24 bg-gray-400 rounded mx-auto" />
          </div>
                  <div className="space-y-2">
                    <div className="h-1.5 w-16 bg-gray-700 rounded border-b border-gray-300 pb-1" />
                    <div className="h-1 w-full bg-gray-200 rounded" />
                    <div className="h-1 w-11/12 bg-gray-200 rounded" />
                    <div className="h-1.5 w-12 bg-gray-700 rounded mt-2" />
                    <div className="h-1 w-full bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Classic Traditional</h3>
              <p className="text-sm text-gray-500">Traditional ATS-friendly</p>
            </div>

            {/* Minimalist Clean */}
            <div
              className="group cursor-pointer"
              onClick={() => router.push("/register")}
            >
              <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white aspect-[3/4] mb-4 group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300">
                <div className="absolute inset-3 bg-white rounded-lg border border-gray-100 p-3 overflow-hidden">
                  {/* Ultra minimal design */}
                  <div className="mb-3">
                    <div className="h-2.5 w-24 bg-gray-900 rounded mb-1" />
                    <div className="h-1 w-32 bg-gray-300 rounded" />
          </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-0.5 h-3 bg-gray-400" />
                      <div className="h-1.5 w-14 bg-gray-600 rounded" />
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded" />
                    <div className="h-1 w-10/12 bg-gray-100 rounded" />
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-0.5 h-3 bg-gray-400" />
                      <div className="h-1.5 w-10 bg-gray-600 rounded" />
                    </div>
                    <div className="h-1 w-full bg-gray-100 rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-blue-600/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white font-semibold">Use This Template</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900">Minimalist Clean</h3>
              <p className="text-sm text-gray-500">Ultra-clean design</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Button variant="outline" size="lg" onClick={() => router.push("/register")}>
              Browse All 14 Templates
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Loved by job seekers worldwide
            </h2>
            <div className="flex items-center justify-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <span className="text-gray-600">4.9/5 based on 10,000+ reviews</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I landed my dream job at Google within 2 weeks of using LinimpactAI. The ATS optimization feature is a game-changer!",
                author: "Sarah M.",
                role: "Software Engineer at Google",
                avatarUrl: "https://randomuser.me/api/portraits/women/44.jpg"
              },
              {
                quote: "The AI suggestions helped me highlight achievements I would have never thought to include. Got 3x more interviews!",
                author: "Michael T.",
                role: "Product Manager at Microsoft",
                avatarUrl: "https://randomuser.me/api/portraits/men/32.jpg"
              },
              {
                quote: "Easy to use and the templates are beautiful. My resume went from boring to professional in minutes.",
                author: "Emily R.",
                role: "Marketing Director at Amazon",
                avatarUrl: "https://randomuser.me/api/portraits/women/68.jpg"
              }
            ].map((testimonial, index) => (
              <div key={index} className="p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <img
                    src={testimonial.avatarUrl}
                    alt={testimonial.author}
                    className="w-12 h-12 rounded-full bg-gray-100 border-2 border-white shadow-md object-cover"
                    loading="lazy"
                    width={48}
                    height={48}
                  />
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-500">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-4">
              <Zap className="w-4 h-4" />
              Simple Pricing
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Choose your plan
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Simple pricing, powerful features. All plans include our core AI tools.
            </p>
          </div>

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
                  "6-second resume scan"
                ].map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600 min-h-[24px]">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
              </li>
                ))}
              </ul>

              <Button
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                onClick={() => router.push("/register")}
              >
                Start Trial
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
                  onClick={() => router.push("/register")}
                >
                  Get Pro Monthly
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
                  onClick={() => router.push("/register")}
                >
                  Get Pro Quarterly
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
                  onClick={() => router.push("/register")}
                >
                  Get Best Value
                </Button>
          </div>
      </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-sm text-gray-500">
              All Pro plans include a 7-day money-back guarantee. No questions asked.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section - SEO/AEO optimized */}
      <section id="faq" className="py-24 bg-white">
        {/* FAQ Schema for rich results */}
        <Script
          id="faq-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium mb-4">
              <HelpCircle className="w-4 h-4" />
              Frequently Asked Questions
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything you need to know about resumes, cover letters & interview prep
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Get expert answers to common questions about creating ATS-friendly resumes, writing cover letters, preparing for interviews, and landing your dream job.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFaqIndex === index}
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
              />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Still have questions about our AI resume, cover letter & interview prep platform?</p>
            <Button variant="outline" onClick={() => router.push("/contact")}>
              Contact Support
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
            Your resume, cover letter & interview performance are extensions of yourself
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Build the perfect resume, craft a tailored cover letter, and prep for interviews with AI. Join thousands who have landed their dream jobs with LinImpact.ai.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="text-base px-10 py-6 h-14 bg-white text-blue-600 hover:bg-gray-100 shadow-xl"
              onClick={() => router.push("/register")}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
          <p className="text-sm text-blue-200 mt-6">
            No credit card required • Start building in seconds
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 sm:py-16 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Logo & Description - full width on mobile */}
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center mb-3">
              <Image
                src="/logo.png"
                alt="LinImpact.ai Logo"
                width={48}
                height={48}
                className="w-12 h-12 object-contain"
                loading="lazy"
              />
              <span className="text-lg font-extrabold tracking-tight -ml-1" style={{ fontFamily: 'var(--font-poppins)' }}>
                <span className="text-cyan-400">Lin</span><span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-blue-500 bg-clip-text text-transparent">Impact</span><span className="text-slate-400 font-semibold">.ai</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered resume builder, cover letter generator & interview prep platform helping job seekers land their dream jobs.
            </p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 mb-12">
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Product</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="/register" className="hover:text-white transition-colors">Resume & Cover Letter Builder</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Cover Letter Generator</Link></li>
                <li><Link href="/interview-prep" className="hover:text-white transition-colors">AI Interview Prep</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">Templates</Link></li>
                <li><Link href="/register" className="hover:text-white transition-colors">ATS Checker</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4 text-sm">Resources</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">Resume Examples</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Career Guide</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Interview Tips</Link></li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <h4 className="font-semibold text-white mb-4 text-sm">Company</h4>
              <ul className="space-y-2.5 text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          {/* Security Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-gray-300">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <Lock className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-medium text-gray-300">SSL Encrypted</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50">
              <Shield className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-medium text-gray-300">Privacy Protected</span>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-center sm:text-left">
              © 2026 LinImpact.ai. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
              <Link href="#" className="hover:text-white transition-colors">LinkedIn</Link>
              <Link href="#" className="hover:text-white transition-colors">Instagram</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Global Styles for animations */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite;
          animation-delay: 1s;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Demo Video Modal */}
      {demoModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setDemoModalOpen(false); if (videoRef.current) videoRef.current.pause(); }} />
          <div className="relative w-full max-w-4xl mx-4">
            <button onClick={() => { setDemoModalOpen(false); if (videoRef.current) videoRef.current.pause(); }} className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors">
              <X className="w-8 h-8" />
            </button>
            <video ref={videoRef} src="/videos/Digital Portfolio & Proof of work.mp4" controls autoPlay className="w-full rounded-xl shadow-2xl" />
          </div>
        </div>
      )}

      {/* Platform Survey Modal */}
      {surveyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSurveyModalOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            {!surveySubmitted ? (
              <>
                <button onClick={() => setSurveyModalOpen(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
                <div className="px-6 pt-6 pb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3">
                    <ClipboardList className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Which platforms should we add next?</h3>
                  <p className="text-sm text-gray-500 mt-1">Select all that you&apos;d like to see in Digital Portfolio.</p>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-2 gap-2">
                    {surveyPlatforms.map((p) => (
                      <button key={p} onClick={() => togglePlatform(p)} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors text-left ${selectedPlatforms.includes(p) ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-300 text-gray-700"}`}>
                        <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${selectedPlatforms.includes(p) ? "border-blue-500 bg-blue-500" : "border-gray-300"}`}>
                          {selectedPlatforms.includes(p) && <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                        </span>
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="mt-3">
                    <label className="text-xs font-medium text-gray-600">Others</label>
                    <input type="text" value={otherPlatformText} onChange={(e) => setOtherPlatformText(e.target.value)} placeholder="Type platform name..." className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none" />
                  </div>
                </div>
                <div className="px-6 pb-6 flex gap-3">
                  <button onClick={() => setSurveyModalOpen(false)} className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                  <button onClick={handleSurveySubmit} disabled={surveySubmitting || (selectedPlatforms.length === 0 && !otherPlatformText.trim())} className={`flex-1 h-10 rounded-xl font-medium text-sm transition-all ${selectedPlatforms.length > 0 || otherPlatformText.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                    {surveySubmitting ? "Submitting..." : "Submit Vote"}
                  </button>
                </div>
              </>
            ) : (
              <div className="px-8 py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Thank you!</h3>
                <p className="text-gray-500 mt-2 text-sm">Your vote has been recorded.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
