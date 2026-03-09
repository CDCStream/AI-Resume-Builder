import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function BillingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
