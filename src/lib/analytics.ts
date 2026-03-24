const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";

let isInitialized = false;
let posthog: any = null;

export const initAnalytics = () => {
  if (typeof window !== "undefined" && POSTHOG_KEY && !isInitialized) {
    try {
      posthog = require("posthog-js");
      if (posthog.default) posthog = posthog.default;
      posthog.init(POSTHOG_KEY, {
        api_host: POSTHOG_HOST,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
        autocapture: true,
        loaded: () => {
          if (process.env.NODE_ENV === "development") {
            console.log("[PostHog] SDK initialized");
          }
        },
      });
      isInitialized = true;
    } catch {
      console.warn("[PostHog] Failed to initialize");
    }
  }
};

export const getPostHog = () => {
  if (typeof window !== "undefined" && isInitialized) return posthog;
  return null;
};

export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  if (!isInitialized) initAnalytics();
  try {
    posthog.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  } catch { /* PostHog not ready */ }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  if (!isInitialized) initAnalytics();
  try {
    posthog.identify(userId, properties);
  } catch { /* PostHog not ready */ }
};

export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  if (!isInitialized) initAnalytics();
  try {
    posthog.people.set(properties);
  } catch { /* PostHog not ready */ }
};

export const incrementUserProperty = (property: string, value: number = 1) => {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  if (!isInitialized) initAnalytics();
  try {
    posthog.people.set_once({ [property]: 0 });
    posthog.people.set({ [property]: value });
  } catch { /* PostHog not ready */ }
};

export const resetAnalytics = () => {
  if (typeof window === "undefined" || !POSTHOG_KEY) return;
  try { posthog.reset(); } catch { /* PostHog not ready */ }
};

// ============================================
// PREDEFINED EVENT TRACKING FUNCTIONS
// ============================================

export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent("$pageview", { page: pageName, ...properties });
};

export const trackSignUpStarted = (method: string = "email") => {
  trackEvent("Sign Up Started", { method });
};

export const trackSignUpCompleted = (userId: string, email: string, method: string = "email") => {
  identifyUser(userId, {
    email,
    created_at: new Date().toISOString(),
    sign_up_method: method,
    plan: "free_trial",
  });
  trackEvent("Sign Up Completed", { method });
};

export const trackLogin = (userId: string, email: string, method: string = "email") => {
  identifyUser(userId, { email, last_login: new Date().toISOString() });
  trackEvent("Login", { method });
};

export const trackLogout = () => {
  trackEvent("Logout");
  resetAnalytics();
};

export const trackResumeCreated = (templateId?: string) => {
  trackEvent("Resume Created", { template_id: templateId });
};

export const trackResumeUpdated = (resumeId: string, section?: string) => {
  trackEvent("Resume Updated", { resume_id: resumeId, section });
};

export const trackResumeDownloaded = (resumeId: string, format: string = "pdf") => {
  trackEvent("Resume Downloaded", { resume_id: resumeId, format });
};

export const trackTemplateSelected = (templateId: string, templateName: string) => {
  trackEvent("Template Selected", { template_id: templateId, template_name: templateName });
};

export const trackCoverLetterGenerated = (jobTitle?: string) => {
  trackEvent("Cover Letter Generated", { job_title: jobTitle });
};

export const trackAIFeatureUsed = (feature: string, properties?: Record<string, any>) => {
  trackEvent("AI Feature Used", { feature, ...properties });
};

export const trackATSScoreChecked = (score: number, resumeId?: string) => {
  trackEvent("ATS Score Checked", { score, resume_id: resumeId });
};

export const trackLinkedInImport = (success: boolean) => {
  trackEvent("LinkedIn Import", { success });
};

export const trackBlogPostViewed = (slug: string, title: string, author?: string) => {
  trackEvent("Blog Post Viewed", { slug, title, author });
};

export const trackInterviewPrepStarted = (jobTitle?: string) => {
  trackEvent("Interview Prep Started", { job_title: jobTitle });
};

export const trackInterviewPrepCompleted = (score?: number) => {
  trackEvent("Interview Prep Completed", { score });
};

export const trackResumeScanUsed = (resumeId?: string) => {
  trackEvent("Resume Scan Used", { resume_id: resumeId });
};

export const trackError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
  trackEvent("Error Occurred", { error_type: errorType, error_message: errorMessage, ...context });
};
