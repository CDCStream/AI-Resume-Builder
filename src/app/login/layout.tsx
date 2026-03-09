import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign In | LinImpact.ai",
  description: "Sign in to your LinImpact.ai account to access your resumes, cover letters, and interview prep tools.",
  alternates: { canonical: "https://www.linimpact.ai/login" },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <footer className="bg-gray-900 text-gray-400 py-6">
        <div className="max-w-md mx-auto px-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/register" className="hover:text-white transition-colors">Sign Up</Link>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
        <p className="text-center text-xs text-gray-500 mt-3">&copy; {new Date().getFullYear()} LinImpact.ai</p>
      </footer>
    </>
  );
}
