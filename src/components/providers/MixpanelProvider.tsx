"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { initMixpanel, trackPageView } from "@/lib/mixpanel";

export function MixpanelProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Mixpanel on mount
  useEffect(() => {
    initMixpanel();
    setIsInitialized(true);
    console.log("[Mixpanel] Initialized");
  }, []);

  // Track page views on route change (only after init)
  useEffect(() => {
    if (isInitialized && pathname) {
      const pageName = getPageName(pathname);
      trackPageView(pageName, { path: pathname });
      console.log("[Mixpanel] Page View:", pageName);
    }
  }, [pathname, isInitialized]);

  return <>{children}</>;
}

// Helper to get readable page names
function getPageName(pathname: string): string {
  if (pathname === "/") return "Landing Page";
  if (pathname === "/pricing") return "Pricing Page";
  if (pathname === "/login") return "Login Page";
  if (pathname === "/register") return "Register Page";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/blog") return "Blog Index";
  if (pathname.startsWith("/blog/")) return "Blog Post";
  if (pathname.startsWith("/editor")) return "Resume Editor";
  if (pathname.startsWith("/admin")) return "Admin Panel";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/billing") return "Billing";
  
  // Default: capitalize the path
  return pathname
    .split("/")
    .filter(Boolean)
    .map(s => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" > ") || "Unknown Page";
}
