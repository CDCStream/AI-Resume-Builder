import { Metadata } from "next";

// Primary Keywords (from Ahrefs research)
// resume builder, ai resume, ats friendly resume, cover letter, resume template,
// cv builder, ats checker, interview prep, linkedin resume, professional resume

export const homeMetadata: Metadata = {
  title: "Humanized AI Resume & Cover Letter Builder + Interview Prep | LinImpact.ai",
  description: "Not generic AI. Create ATS-optimized resumes, tailored cover letters & prep for interviews with humanized AI that sounds like a professional writer. 14+ templates, 7-day Pro trial for $1.",
  keywords: [
    "resume builder",
    "ai resume builder",
    "best resume builder",
    "ats friendly resume",
    "ats resume template",
    "cover letter generator",
    "cv builder",
    "resume maker",
    "professional resume",
    "resume template google docs",
    "linkedin resume builder",
    "ats checker",
    "cover letter template",
    "interview prep",
    "ai interview practice",
    "mock interview ai",
    "interview preparation tool",
    "job interview questions",
    "humanized ai resume",
    "ai resume writer",
    "best ai resume builder 2026",
    "resume builder not generic",
    "resume examples",
    "software engineer resume",
    "entry level resume",
    "student resume",
    "best resume builder",
    "online resume builder"
  ],
  authors: [{ name: "LinImpact.ai" }],
  creator: "LinImpact.ai",
  publisher: "LinImpact.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.linimpact.ai",
    siteName: "LinImpact.ai",
    title: "Humanized AI Resume, Cover Letter & Interview Prep | LinImpact.ai",
    description: "Not generic AI. Build resumes, cover letters & prep for interviews with humanized AI that reads like a professional writer. 14+ templates, ATS optimization & more.",
    images: [
      {
        url: "https://www.linimpact.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinImpact.ai - AI Resume, Cover Letter & Interview Prep Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Humanized AI Resume & Cover Letter Builder + Interview Prep",
    description: "Not generic AI. Create resumes, cover letters & practice interviews with humanized AI. ATS-friendly templates, mock interviews & more.",
    images: ["https://www.linimpact.ai/og-image.png"],
    creator: "@linimpactai",
  },
  alternates: {
    canonical: "https://www.linimpact.ai",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export const pricingMetadata: Metadata = {
  title: "Pricing | AI Resume & Cover Letter Builder Plans | LinImpact.ai",
  description: "Choose the perfect plan for your job search. 7-day Pro trial for $1, Pro monthly, quarterly & semi-annual options. ATS-optimized resumes, tailored cover letters & interview prep included.",
  keywords: [
    "resume builder pricing",
    "ai resume builder cost",
    "best resume builder",
    "professional resume service",
    "resume writing service",
    "cv builder pricing",
    "cheap resume builder",
    "resume builder subscription"
  ],
  openGraph: {
    title: "Resume & Cover Letter Builder Pricing | LinImpact.ai",
    description: "Affordable AI resume & cover letter builder plans. Professional resumes, tailored cover letters & more. Upgrade anytime.",
    url: "https://www.linimpact.ai/pricing",
  },
  alternates: {
    canonical: "https://www.linimpact.ai/pricing",
  },
};

export const blogMetadata: Metadata = {
  title: "Career Insights & Resume Tips | LinImpact.ai Blog",
  description: "Expert advice on resume writing, cover letters, job interviews & career growth. Learn how to write ATS-friendly resumes and land your dream job.",
  keywords: [
    "resume tips",
    "cover letter tips",
    "how to write a resume",
    "how to write a cover letter",
    "job interview tips",
    "career advice",
    "ats resume tips",
    "resume examples"
  ],
  openGraph: {
    title: "Career Tips & Resume Writing Guide | LinImpact.ai Blog",
    description: "Expert career advice, resume writing tips, and job search strategies.",
    url: "https://www.linimpact.ai/blog",
  },
  alternates: {
    canonical: "https://www.linimpact.ai/blog",
  },
};

// FAQ Schema for Google Rich Results (AEO - Answer Engine Optimization)
export const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is an ATS-friendly resume?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "An ATS-friendly resume is designed to pass through Applicant Tracking Systems - software that employers use to filter job applications. It uses standard formatting, relevant keywords, and clean layouts that can be easily parsed by these systems. LinImpact.ai automatically optimizes your resume for ATS compatibility."
      }
    },
    {
      "@type": "Question",
      "name": "How do I write a cover letter for a job application?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A great cover letter should: 1) Address the hiring manager by name, 2) Open with a compelling hook, 3) Highlight 2-3 relevant achievements, 4) Show enthusiasm for the company, and 5) End with a clear call to action. LinImpact.ai's AI cover letter generator creates personalized cover letters in seconds."
      }
    },
    {
      "@type": "Question",
      "name": "How long should a cover letter be?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "A cover letter should be between 250-400 words, fitting on one page. Hiring managers spend only 7 seconds scanning cover letters, so keep it concise and focused on your key qualifications."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best resume format?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "The reverse-chronological format is the most widely accepted and ATS-friendly resume format for 2026. It lists your most recent experience first and is preferred by 75% of recruiters."
      }
    },
    {
      "@type": "Question",
      "name": "Is a cover letter necessary?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "While not always required, a cover letter significantly increases your chances of landing an interview. 83% of hiring managers read cover letters when deciding whom to interview."
      }
    },
    {
      "@type": "Question",
      "name": "How do I address a cover letter without a name?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "If you don't know the hiring manager's name, use 'Dear Hiring Manager' or 'Dear [Department] Team'. Avoid outdated phrases like 'To Whom It May Concern.'"
      }
    },
    {
      "@type": "Question",
      "name": "Can I import my LinkedIn profile to create a resume?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! LinImpact.ai's LinkedIn import feature allows you to create a professional resume from your LinkedIn profile in one click. The AI automatically formats your experience into an ATS-optimized resume."
      }
    },
    {
      "@type": "Question",
      "name": "What resume templates work best for software engineers?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Software engineers should use clean, minimal templates that highlight technical skills and projects. Include a skills section with programming languages, frameworks, and tools. LinImpact.ai offers specialized templates for tech professionals."
      }
    },
    {
      "@type": "Question",
      "name": "Is it worth paying for an AI resume builder?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Most free AI resume builders produce generic, template-based content that recruiters can spot instantly. A quality AI resume builder like LinImpact.ai uses humanized AI that narrates your unique professional story. The result reads like a professional writer's work. Features like ATS scoring, recruiter heatmap simulation, and AI interview prep provide a measurable advantage. LinImpact.ai offers a 7-day Pro trial for just $1."
      }
    },
    {
      "@type": "Question",
      "name": "What is the best AI resume builder for competitive job markets?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "In competitive markets, your resume must pass ATS filters and grab attention in 6 seconds. LinImpact.ai offers humanized AI content that avoids the generic AI red flag, ATS optimization with real-time scoring, AI mock interviews with STAR method coaching, and job-matched cover letters. Start your 7-day Pro trial for just $1."
      }
    }
  ]
};

// Organization Schema for brand knowledge
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LinImpact.ai",
  "url": "https://www.linimpact.ai",
  "logo": "https://www.linimpact.ai/logo.png",
  "description": "AI-powered resume builder, cover letter generator & interview prep platform helping job seekers create professional, ATS-optimized applications and ace their interviews.",
  "sameAs": [
    "https://twitter.com/linimpactai",
    "https://linkedin.com/company/linimpactai",
    "https://instagram.com/linimpactai"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "customer service",
    "email": "support@linimpact.ai"
  }
};

// SoftwareApplication Schema for the product
export const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "LinImpact.ai Resume, Cover Letter & Interview Prep Platform",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "1",
    "priceCurrency": "USD",
    "description": "7-day Pro trial with all features"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "10000"
  },
  "description": "AI-powered resume builder, cover letter generator & interview prep platform with ATS optimization, LinkedIn import, mock interviews with real-time feedback, and more."
};
