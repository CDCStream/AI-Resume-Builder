import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cover Letter | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function CoverLetterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
