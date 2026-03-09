import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Interview Prep | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function InterviewPrepLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
