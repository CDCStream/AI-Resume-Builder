import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | LinImpact.ai",
  description: "Read the terms of service for LinImpact.ai. Understand your rights and responsibilities when using our platform.",
  alternates: { canonical: "https://www.linimpact.ai/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
