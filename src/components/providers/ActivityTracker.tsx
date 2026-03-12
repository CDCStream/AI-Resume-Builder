"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { trackActivity } from "@/lib/activity-tracker";

export function ActivityTracker() {
  const pathname = usePathname();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !pathname) return;

    const pageName = getPageName(pathname);
    trackActivity(user.id, "page_view", pathname, pageName);
  }, [pathname, user?.id]);

  return null;
}

function getPageName(pathname: string): string {
  if (pathname === "/") return "Landing Page";
  if (pathname === "/pricing") return "Pricing Page";
  if (pathname === "/login") return "Login Page";
  if (pathname === "/register") return "Register Page";
  if (pathname === "/dashboard") return "Dashboard";
  if (pathname === "/resume") return "Resume Editor";
  if (pathname === "/cover-letter") return "Cover Letter";
  if (pathname === "/find-jobs") return "Find Jobs";
  if (pathname === "/interview-prep") return "Interview Prep";
  if (pathname === "/settings") return "Settings";
  if (pathname === "/billing") return "Billing";
  if (pathname === "/blog") return "Blog Index";
  if (pathname.startsWith("/blog/")) return "Blog Post";
  if (pathname.startsWith("/salary/")) return "Salary Page";
  if (pathname.startsWith("/admin")) return "Admin Panel";

  return pathname
    .split("/")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" > ") || "Unknown Page";
}
