"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { hasConsented } from "@/lib/cookie-consent";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasConsented());
    const handler = (e: Event) => {
      const accepted = (e as CustomEvent).detail === "accepted";
      setConsent(accepted);
      if (accepted && !isInitialized) {
        initAnalytics();
        setIsInitialized(true);
      }
    };
    window.addEventListener("cookie-consent-changed", handler);
    return () => window.removeEventListener("cookie-consent-changed", handler);
  }, [isInitialized]);

  useEffect(() => {
    if (consent && !isInitialized) {
      initAnalytics();
      setIsInitialized(true);
    }
  }, [consent, isInitialized]);

  useEffect(() => {
    if (isInitialized && consent && pathname) {
      const pageName = getPageName(pathname);
      trackPageView(pageName, { path: pathname });
    }
  }, [pathname, isInitialized, consent]);

  return <>{children}</>;
}

function getPageName(pathname: string): string {
  if (pathname === "/") return "Landing Page";
  if (pathname === "/login") return "Login Page";
  if (pathname === "/register") return "Register Page";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/blog") return "Blog Index";
  if (pathname.startsWith("/blog/")) return "Blog Post";
  if (pathname.startsWith("/editor")) return "Resume Editor";
  if (pathname.startsWith("/admin")) return "Admin Panel";
  if (pathname === "/settings") return "Settings";

  return pathname
    .split("/")
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" > ") || "Unknown Page";
}
