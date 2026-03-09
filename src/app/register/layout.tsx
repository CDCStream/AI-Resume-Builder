import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up Free | LinImpact.ai - AI Resume Builder",
  description: "Create your free account and start building ATS-optimized resumes with humanized AI. No credit card required.",
  alternates: { canonical: "https://www.linimpact.ai/register" },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
