import { Metadata } from "next";

// Primary Keywords (from Ahrefs research)
// resume builder, ai resume, ats friendly resume, cover letter, resume template, 
// cv builder, ats checker, interview prep, linkedin resume, professional resume

export const homeMetadata: Metadata = {
  title: "AI Resume Builder | ATS-Friendly Templates | LinImpact.ai",
  description: "Create professional, ATS-optimized resumes in minutes with our AI resume builder. 14+ templates, AI cover letter generator, LinkedIn import & interview prep. Get started today!",
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
    url: "https://linimpact.ai",
    siteName: "LinImpact.ai",
    title: "AI Resume Builder | Create ATS-Optimized Resumes | LinImpact.ai",
    description: "Build professional, ATS-friendly resumes with AI. 14+ templates, cover letter generator, LinkedIn import & more. Land your dream job faster!",
    images: [
      {
        url: "https://linimpact.ai/og-image.png",
        width: 1200,
        height: 630,
        alt: "LinImpact.ai - AI Resume Builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder | ATS-Optimized Templates",
    description: "Create professional resumes with AI. ATS-friendly templates, cover letter generator & more.",
    images: ["https://linimpact.ai/og-image.png"],
    creator: "@linimpactai",
  },
  alternates: {
    canonical: "https://linimpact.ai",
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export const pricingMetadata: Metadata = {
  title: "Pricing | AI Resume Builder Plans | LinImpact.ai",
  description: "Choose the perfect plan for your job search. Free trial, Pro monthly, quarterly & semi-annual options. ATS-optimized resumes, AI cover letters & interview prep included.",
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
    title: "Resume Builder Pricing | LinImpact.ai",
    description: "Affordable AI resume builder plans. Professional resumes, cover letters & more. Upgrade anytime.",
    url: "https://linimpact.ai/pricing",
  },
  alternates: {
    canonical: "https://linimpact.ai/pricing",
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
    url: "https://linimpact.ai/blog",
  },
  alternates: {
    canonical: "https://linimpact.ai/blog",
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
        "text": "The reverse-chronological format is the most widely accepted and ATS-friendly resume format for 2024. It lists your most recent experience first and is preferred by 75% of recruiters."
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
    }
  ]
};

// Organization Schema for brand knowledge
export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "LinImpact.ai",
  "url": "https://linimpact.ai",
  "logo": "https://linimpact.ai/logo.png",
  "description": "AI-powered resume builder helping job seekers create professional, ATS-optimized resumes and cover letters.",
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
  "name": "LinImpact.ai Resume Builder",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free trial with all features"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "reviewCount": "10000"
  },
  "description": "AI-powered resume builder with ATS optimization, cover letter generator, LinkedIn import, and interview preparation tools."
};
