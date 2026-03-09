import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin | LinImpact.ai",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
