import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing | AI Resume Builder Plans - Free Trial & Pro",
  description: "Affordable AI resume builder pricing. Start free with our 3-day trial. Pro plans from $7.85/mo. ATS-friendly templates, cover letter generator, LinkedIn import & interview prep included.",
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
    title: "AI Resume Builder Pricing | Free Trial & Pro Plans | LinImpact.ai",
    description: "Start free. Pro plans from $7.85/mo. Create ATS-optimized resumes with AI.",
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
