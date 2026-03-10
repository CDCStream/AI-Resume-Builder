"use client";

import { useEffect } from "react";
import { trackBlogPostViewed } from "@/lib/analytics";

interface BlogPostTrackerProps {
  slug: string;
  title: string;
  author?: string;
}

export function BlogPostTracker({ slug, title, author }: BlogPostTrackerProps) {
  useEffect(() => {
    trackBlogPostViewed(slug, title, author);
  }, [slug, title, author]);

  return null;
}
