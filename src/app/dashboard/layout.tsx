import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
