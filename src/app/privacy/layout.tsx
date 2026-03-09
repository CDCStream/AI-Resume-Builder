import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LinImpact.ai",
  description: "Learn how LinImpact.ai collects, uses, and protects your personal data. Read our privacy policy.",
  alternates: { canonical: "https://www.linimpact.ai/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
