import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | AI Resume Builder Plans - $1 Trial & Pro",
  description: "Affordable AI resume builder pricing. Start your 7-day Pro trial for just $1. Pro plans from $7.85/mo. ATS-friendly templates, cover letter generator, LinkedIn import & interview prep included.",
  keywords: [
    "resume builder pricing",
    "ai resume builder cost",
    "best resume builder",
    "professional resume service",
    "resume writing service pricing",
    "cv builder pricing",
    "cheap resume builder",
    "resume builder subscription",
    "free resume builder trial",
    "resume maker pricing"
  ],
  openGraph: {
    title: "AI Resume Builder Pricing | $1 Trial & Pro Plans | LinImpact.ai",
    description: "7-day Pro trial for $1. Pro plans from $7.85/mo. Create ATS-optimized resumes with AI.",
    url: "https://www.linimpact.ai/pricing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Resume Builder Pricing | LinImpact.ai",
    description: "Start free. Pro from $7.85/mo. ATS-optimized resumes with AI.",
  },
  alternates: {
    canonical: "https://www.linimpact.ai/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
