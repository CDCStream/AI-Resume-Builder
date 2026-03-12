"use client";

import { createClient } from "@/lib/supabase/client";

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  const stored = sessionStorage.getItem("activity_session_id");
  if (stored) {
    sessionId = stored;
    return stored;
  }
  const newId = crypto.randomUUID();
  sessionStorage.setItem("activity_session_id", newId);
  sessionId = newId;
  return newId;
}

let lastTrackedPath: string | null = null;
let pendingEvents: Array<{
  user_id: string;
  event_type: string;
  path: string;
  page_name: string;
  referrer_path: string | null;
  session_id: string;
  metadata: Record<string, unknown>;
}> = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (pendingEvents.length === 0) return;
  const batch = [...pendingEvents];
  pendingEvents = [];

  try {
    const supabase = createClient();
    await supabase.from("user_activity").insert(batch);
  } catch {
    // silently fail — don't break user experience
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, 2000);
}

export function trackActivity(
  userId: string,
  eventType: string,
  path: string,
  pageName: string,
  metadata: Record<string, unknown> = {}
) {
  if (eventType === "page_view" && path === lastTrackedPath) return;
  if (eventType === "page_view") lastTrackedPath = path;

  pendingEvents.push({
    user_id: userId,
    event_type: eventType,
    path,
    page_name: pageName,
    referrer_path: typeof document !== "undefined" ? document.referrer || null : null,
    session_id: getSessionId(),
    metadata,
  });

  scheduleFlush();
}

export function trackAction(
  userId: string,
  action: string,
  path: string,
  metadata: Record<string, unknown> = {}
) {
  trackActivity(userId, action, path, "", metadata);
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (pendingEvents.length > 0) {
      flushEvents();
    }
  });
}
