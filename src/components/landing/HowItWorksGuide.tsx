"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  FileText,
  Linkedin,
  Upload,
  PenTool,
  Mail,
  Target,
  Zap,
  Eye,
  Search,
  MessageSquare,
  Play,
  ChevronRight,
} from "lucide-react";
import { motion, useInView } from "framer-motion";

interface SubFeature {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gifSrc?: string;
  gifAlt?: string;
}

interface GuideSection {
  id: string;
  number: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  gifSrc?: string;
  gifAlt: string;
  subFeatures: SubFeature[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "create-resume",
    number: "01",
    title: "Create Resume",
    description:
      "Build a professional, ATS-optimized resume in minutes. Choose the method that works best for you.",
    icon: FileText,
    gifAlt: "Creating a resume with LinImpact.ai",
    subFeatures: [
      {
        title: "Import from LinkedIn",
        description:
          "Paste your LinkedIn URL and watch your resume auto-populate with your experience, education, and skills.",
        icon: Linkedin,
        gifAlt: "Importing resume from LinkedIn profile",
      },
      {
        title: "Upload Existing CV",
        description:
          "Upload your current resume (PDF/DOCX) and our AI will parse and enhance it with better formatting.",
        icon: Upload,
        gifAlt: "Uploading and parsing an existing CV",
      },
      {
        title: "Start from Scratch",
        description:
          "Begin with a blank canvas. Our AI writing assistant helps you craft compelling bullet points.",
        icon: PenTool,
        gifAlt: "Creating a resume from scratch with AI assistance",
      },
    ],
  },
  {
    id: "cover-letter",
    number: "02",
    title: "Create Cover Letter",
    description:
      "Generate a tailored cover letter that complements your resume and matches the job description perfectly.",
    icon: Mail,
    gifAlt: "AI-powered cover letter generation",
    subFeatures: [
      {
        title: "Job-Specific Tailoring",
        description:
          "Paste the job posting and get a cover letter that mirrors the employer's language and requirements.",
        icon: Target,
        gifAlt: "Tailoring cover letter to job description",
      },
    ],
  },
  {
    id: "ats-optimizer",
    number: "03",
    title: "ATS Checker & Optimizer",
    description:
      "Get your resume past the bots. Our AI analyzes and optimizes your resume for Applicant Tracking Systems.",
    icon: Target,
    gifAlt: "ATS score optimization in action",
    subFeatures: [
      {
        title: "Tailored Mode",
        description:
          "Paste a job description and get section-by-section optimization suggestions matched to that role.",
        icon: Target,
        gifAlt: "ATS optimization with job description tailoring",
      },
      {
        title: "Quick Mode",
        description:
          "Get instant ATS feedback without a job description — perfect for general resume improvements.",
        icon: Zap,
        gifAlt: "Quick ATS score check without job description",
      },
    ],
  },
  {
    id: "six-second-scan",
    number: "04",
    title: "6-Second Resume Scan",
    description:
      "See your resume through a recruiter's eyes. Our heatmap simulation shows exactly where they look in the first 6 seconds.",
    icon: Eye,
    gifAlt: "6-second recruiter scan heatmap simulation",
    subFeatures: [
      {
        title: "Heatmap Simulation",
        description:
          "Watch a realistic eye-tracking heatmap animate across your resume, showing recruiter attention patterns.",
        icon: Eye,
        gifAlt: "Eye-tracking heatmap animation on resume",
      },
      {
        title: "Readability Score",
        description:
          "Receive a readability analysis ensuring your resume is scannable and easy to parse quickly.",
        icon: FileText,
        gifAlt: "Resume readability score analysis",
      },
    ],
  },
  {
    id: "find-jobs",
    number: "05",
    title: "Find Jobs",
    description:
      "Discover relevant job openings and apply with your optimized resume — all from one platform.",
    icon: Search,
    gifAlt: "Job search and discovery feature",
    subFeatures: [
      {
        title: "Smart Job Search",
        description:
          "Search across multiple platforms and filter by role, location, experience level, and more.",
        icon: Search,
        gifAlt: "Searching and filtering job listings",
      },
    ],
  },
  {
    id: "interview-prep",
    number: "06",
    title: "Interview Preparation",
    description:
      "Go beyond the resume. Prepare for interviews with AI-generated questions specific to your target role.",
    icon: MessageSquare,
    gifAlt: "AI interview preparation feature",
    subFeatures: [
      {
        title: "AI-Generated Questions",
        description:
          "Get realistic interview questions based on the job description and your resume content.",
        icon: MessageSquare,
        gifAlt: "AI generating interview questions",
      },
      {
        title: "Practice & Feedback",
        description:
          "Rehearse your answers and receive AI feedback on clarity, structure, and impact.",
        icon: Target,
        gifAlt: "Practicing answers with AI feedback",
      },
    ],
  },
];

function GifPlaceholder({
  src,
  alt,
  compact = false,
}: {
  src?: string;
  alt: string;
  compact?: boolean;
}) {
  const frameClasses = compact
    ? "relative rounded-lg overflow-hidden shadow-md border border-gray-200/80 bg-white"
    : "relative rounded-xl overflow-hidden shadow-2xl border border-gray-200/80 bg-white";

  const toolbarHeight = compact ? "h-8" : "h-10";
  const dotSize = compact ? "w-[9px] h-[9px]" : "w-3 h-3";
  const dotGap = compact ? "gap-[5px]" : "gap-[6px]";

  const safariToolbar = (
    <div className={`${toolbarHeight} flex items-center px-3 bg-gradient-to-b from-[#e8e6e8] to-[#d4d2d4] border-b border-[#b5b3b5] relative`}>
      {/* Traffic lights */}
      <div className={`flex ${dotGap} flex-shrink-0`}>
        <div className={`${dotSize} rounded-full bg-[#ff5f57] border border-[#e0443e]`} />
        <div className={`${dotSize} rounded-full bg-[#febc2e] border border-[#dea123]`} />
        <div className={`${dotSize} rounded-full bg-[#28c840] border border-[#1aab29]`} />
      </div>

      {/* Center address bar */}
      <div className="flex-1 flex justify-center px-4">
        <div className={`${compact ? "max-w-[200px] h-5" : "max-w-[320px] h-[26px]"} w-full bg-white/80 rounded-md border border-[#c0bec0] flex items-center justify-center px-3`}>
          <svg className={`${compact ? "w-2.5 h-2.5" : "w-3 h-3"} text-[#9b999b] mr-1 flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className={`${compact ? "text-[9px]" : "text-[11px]"} text-[#4d4d4d] truncate`}>
            linimpact.ai
          </span>
        </div>
      </div>

      {/* Right side spacer to balance */}
      <div className={`flex ${dotGap} flex-shrink-0 invisible`}>
        <div className={dotSize} />
        <div className={dotSize} />
        <div className={dotSize} />
      </div>
    </div>
  );

  if (src) {
    return (
      <div className={frameClasses}>
        {safariToolbar}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto"
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div className={frameClasses}>
      {safariToolbar}
      <div className={`${compact ? "aspect-[16/9]" : "aspect-[16/10]"} bg-gradient-to-br from-[#fafafa] via-[#f5f5f5] to-[#fafafa] flex flex-col items-center justify-center gap-2`}>
        <div className={`${compact ? "w-10 h-10" : "w-16 h-16"} rounded-full bg-blue-50 flex items-center justify-center`}>
          <Play className={`${compact ? "w-4 h-4" : "w-7 h-7"} text-blue-400 ml-0.5`} />
        </div>
        <p className={`${compact ? "text-xs" : "text-sm"} text-gray-400 font-medium`}>
          Screen recording coming soon
        </p>
      </div>
    </div>
  );
}

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function HowItWorksGuide() {
  const [activeSection, setActiveSection] = useState(0);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const pillNavRef = useRef<HTMLDivElement>(null);

  const scrollToSection = useCallback((index: number) => {
    const el = sectionRefs.current[index];
    if (el) {
      const yOffset = -100;
      const y = el.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionRefs.current.forEach((ref, index) => {
      if (!ref) return;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(index);
            }
          });
        },
        { threshold: 0.3, rootMargin: "-100px 0px -40% 0px" }
      );
      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  useEffect(() => {
    if (!pillNavRef.current) return;
    const activeBtn = pillNavRef.current.querySelector(
      `[data-pill-index="${activeSection}"]`
    );
    if (activeBtn) {
      (activeBtn as HTMLElement).scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeSection]);

  return (
    <section
      id="how-it-works"
      className="py-16 sm:py-24 bg-gradient-to-b from-gray-50 to-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From creating your resume to landing the interview — everything you
            need in one platform.
          </p>
        </div>

        {/* Mobile: Horizontal pill navigation */}
        <div
          ref={pillNavRef}
          className="lg:hidden flex gap-2 overflow-x-auto pb-4 mb-8 scrollbar-hide -mx-4 px-4 snap-x"
        >
          {GUIDE_SECTIONS.map((section, index) => (
            <button
              key={section.id}
              data-pill-index={index}
              onClick={() => scrollToSection(index)}
              className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                activeSection === index
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600"
              }`}
            >
              {section.number}. {section.title}
            </button>
          ))}
        </div>

        <div ref={containerRef} className="flex gap-10 lg:gap-14">
          {/* Desktop: Sticky sidebar */}
          <nav className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28">
              <ul className="space-y-1">
                {GUIDE_SECTIONS.map((section, index) => {
                  const isActive = activeSection === index;
                  return (
                    <li key={section.id}>
                      <button
                        onClick={() => scrollToSection(index)}
                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 flex items-center gap-3 group ${
                          isActive
                            ? "bg-blue-50 border-l-[3px] border-blue-600"
                            : "hover:bg-gray-50 border-l-[3px] border-transparent"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold w-6 h-6 rounded-md flex items-center justify-center transition-all duration-300 ${
                            isActive
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                          }`}
                        >
                          {section.number}
                        </span>
                        <span
                          className={`text-sm transition-all duration-300 ${
                            isActive
                              ? "font-semibold text-blue-700"
                              : "font-medium text-gray-600 group-hover:text-gray-900"
                          }`}
                        >
                          {section.title}
                        </span>
                        <ChevronRight
                          className={`w-4 h-4 ml-auto transition-all duration-300 ${
                            isActive
                              ? "opacity-100 text-blue-500 translate-x-0"
                              : "opacity-0 -translate-x-2"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Progress indicator */}
              <div className="mt-6 px-4">
                <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500 ease-out"
                    style={{
                      width: `${((activeSection + 1) / GUIDE_SECTIONS.length) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-2">
                  {activeSection + 1} of {GUIDE_SECTIONS.length}
                </p>
              </div>
            </div>
          </nav>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <div className="space-y-20 sm:space-y-28">
              {GUIDE_SECTIONS.map((section, index) => (
                <div
                  key={section.id}
                  ref={(el) => {
                    sectionRefs.current[index] = el;
                  }}
                  data-section={section.id}
                >
                  <AnimatedSection>
                    {/* Section header */}
                    <div className="flex items-start gap-4 mb-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/25">
                        <section.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-blue-600 mb-1">
                          Step {section.number}
                        </p>
                        <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                          {section.title}
                        </h3>
                      </div>
                    </div>

                    <p className="text-gray-600 text-lg mb-8 max-w-2xl">
                      {section.description}
                    </p>

                    {/* Sub-features with individual GIFs */}
                    <div className="space-y-6">
                      {section.subFeatures.map((sub, subIndex) => (
                        <div
                          key={subIndex}
                          className="rounded-xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 overflow-hidden"
                        >
                          <div className="flex items-start gap-3 p-5 pb-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mt-0.5">
                              <sub.icon className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-1">
                                {sub.title}
                              </h4>
                              <p className="text-gray-500 text-sm leading-relaxed">
                                {sub.description}
                              </p>
                            </div>
                          </div>
                          <div className="px-5 pb-5">
                            <GifPlaceholder
                              src={sub.gifSrc}
                              alt={sub.gifAlt || sub.title}
                              compact
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </AnimatedSection>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
