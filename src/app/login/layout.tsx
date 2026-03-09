import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In | LinImpact.ai",
  description: "Sign in to your LinImpact.ai account to access your resumes, cover letters, and interview prep tools.",
  alternates: { canonical: "https://www.linimpact.ai/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
