import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Password | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
