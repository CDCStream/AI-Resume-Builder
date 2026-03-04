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
  metadataBase: new URL("https://linimpact.ai"),
  title: {
    default: "Free AI Resume Builder | ATS-Friendly Templates | LinImpact.ai",
    template: "%s | LinImpact.ai"
  },
  description: "Create professional, ATS-optimized resumes in minutes with our free AI resume builder. 14+ templates, AI cover letter generator, LinkedIn import & interview prep. Start free today!",
  keywords: [
    "resume builder", "ai resume builder", "free resume builder", "ats friendly resume",
    "ats resume template", "cover letter generator", "cv builder", "resume maker",
    "professional resume", "linkedin resume builder", "ats checker", "cover letter template",
    "interview prep", "resume examples", "software engineer resume", "best resume builder"
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
    url: "https://linimpact.ai",
    siteName: "LinImpact.ai",
    title: "Free AI Resume Builder | Create ATS-Optimized Resumes",
    description: "Build professional, ATS-friendly resumes with AI. Free templates, cover letter generator, LinkedIn import & more.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "LinImpact.ai - AI Resume Builder" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI Resume Builder | ATS-Optimized Templates",
    description: "Create professional resumes with AI. ATS-friendly templates, cover letter generator & more.",
    images: ["/og-image.png"],
    creator: "@linimpactai",
  },
  alternates: {
    canonical: "https://linimpact.ai",
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
