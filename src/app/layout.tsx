import type { Metadata } from "next";
import { Geist, Geist_Mono, Poppins } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { MixpanelProvider } from "@/components/providers/MixpanelProvider";
import { GoogleAnalytics } from "@/components/providers/GoogleAnalytics";
import { CookieBanner } from "@/components/ui/cookie-banner";
import Script from "next/script";
import { Suspense } from "react";
import "./globals.css";
import { organizationSchema, softwareSchema } from "./seo-metadata";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.linimpact.ai"),
  title: {
    default: "Humanized AI Resume Builder + Interview Prep | LinImpact.ai",
    template: "%s | LinImpact.ai"
  },
  description: "Not generic AI. Create ATS-optimized resumes, tailored cover letters & prep for interviews with humanized AI that sounds like a professional writer. 14+ templates, no credit card required.",
  keywords: [
    "resume builder", "ai resume builder", "best resume builder", "ats friendly resume",
    "ats resume template", "cover letter generator", "cv builder", "resume maker",
    "professional resume", "linkedin resume builder", "ats checker", "cover letter template",
    "interview prep", "ai interview practice", "mock interview ai", "interview preparation tool",
    "humanized ai resume", "ai resume writer", "best ai resume builder 2026", "resume builder not generic",
    "resume examples", "software engineer resume", "best resume builder"
  ],
  authors: [{ name: "LinImpact.ai" }],
  creator: "LinImpact.ai",
  publisher: "LinImpact.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
    apple: "/favicon.ico",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.linimpact.ai",
    siteName: "LinImpact.ai",
    title: "Humanized AI Resume, Cover Letter & Interview Prep | LinImpact.ai",
    description: "Not generic AI. Build resumes, cover letters & prep for interviews with humanized AI that reads like a professional writer. 14+ templates & more.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "LinImpact.ai - AI Resume, Cover Letter & Interview Prep Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Humanized AI Resume & Cover Letter Builder + Interview Prep",
    description: "Not generic AI. Create resumes, cover letters & practice interviews with humanized AI. ATS-friendly templates, mock interviews & more.",
    images: ["/og-image.png"],
    creator: "@linimpactai",
  },
  alternates: {
    canonical: "https://www.linimpact.ai",
  },
  verification: {
    google: "LHeyt4LnhoU9oIGu22RxrZaqY6OMxtb036g0ctmt8k8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Schema.org structured data for SEO/AEO */}
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="software-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        {/* Ahrefs Web Analytics */}
        <Script
          src="https://analytics.ahrefs.com/analytics.js"
          data-key="wbGYng8gzWDJQHAsZKprxg"
          strategy="lazyOnload"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased`}
      >
        <AuthProvider>
          <Suspense fallback={null}>
            <GoogleAnalytics />
            <MixpanelProvider>
              {children}
              <CookieBanner />
            </MixpanelProvider>
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
