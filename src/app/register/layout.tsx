import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
