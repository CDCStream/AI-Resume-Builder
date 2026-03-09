import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find Jobs | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function FindJobsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
