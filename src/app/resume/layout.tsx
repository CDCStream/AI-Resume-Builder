import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Resume Editor | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function ResumeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
