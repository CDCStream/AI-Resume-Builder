import mixpanel from "mixpanel-browser";

const MIXPANEL_TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;

// Initialize Mixpanel
let isInitialized = false;

export const initMixpanel = () => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN && !isInitialized) {
    mixpanel.init(MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === "development",
      track_pageview: false,
      persistence: "localStorage",
      ignore_dnt: false,
      api_host: "https://api-eu.mixpanel.com", // EU data residency
    });
    isInitialized = true;
    console.log("[Mixpanel] SDK initialized with EU host");
  }
};

// Track Events
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    if (!isInitialized) initMixpanel();
    try {
      mixpanel.track(eventName, {
        ...properties,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // Mixpanel not ready yet
    }
  }
};

// Identify User
export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    if (!isInitialized) initMixpanel();
    try {
      mixpanel.identify(userId);
      if (properties) {
        mixpanel.people.set(properties);
      }
    } catch { /* Mixpanel not ready */ }
  }
};

// Set User Properties
export const setUserProperties = (properties: Record<string, any>) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    if (!isInitialized) initMixpanel();
    try { mixpanel.people.set(properties); } catch { /* Mixpanel not ready */ }
  }
};

// Increment User Property
export const incrementUserProperty = (property: string, value: number = 1) => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    if (!isInitialized) initMixpanel();
    try { mixpanel.people.increment(property, value); } catch { /* Mixpanel not ready */ }
  }
};

// Reset (on logout)
export const resetMixpanel = () => {
  if (typeof window !== "undefined" && MIXPANEL_TOKEN) {
    try { mixpanel.reset(); } catch { /* Mixpanel not ready */ }
  }
};

// ============================================
// PREDEFINED EVENT TRACKING FUNCTIONS
// ============================================

// Page Views
export const trackPageView = (pageName: string, properties?: Record<string, any>) => {
  trackEvent("Page Viewed", { page: pageName, ...properties });
};

// Auth Events
export const trackSignUpStarted = (method: string = "email") => {
  trackEvent("Sign Up Started", { method });
};

export const trackSignUpCompleted = (userId: string, email: string, method: string = "email") => {
  identifyUser(userId, {
    $email: email,
    $created: new Date().toISOString(),
    sign_up_method: method,
    plan: "free_trial",
  });
  trackEvent("Sign Up Completed", { method });
};

export const trackLogin = (userId: string, email: string, method: string = "email") => {
  identifyUser(userId, { $email: email, last_login: new Date().toISOString() });
  trackEvent("Login", { method });
};

export const trackLogout = () => {
  trackEvent("Logout");
  resetMixpanel();
};

// Resume Events
export const trackResumeCreated = (templateId?: string) => {
  incrementUserProperty("total_resumes_created");
  trackEvent("Resume Created", { template_id: templateId });
};

export const trackResumeUpdated = (resumeId: string, section?: string) => {
  trackEvent("Resume Updated", { resume_id: resumeId, section });
};

export const trackResumeDownloaded = (resumeId: string, format: string = "pdf") => {
  incrementUserProperty("total_downloads");
  trackEvent("Resume Downloaded", { resume_id: resumeId, format });
};

export const trackTemplateSelected = (templateId: string, templateName: string) => {
  trackEvent("Template Selected", { template_id: templateId, template_name: templateName });
};

// Cover Letter Events
export const trackCoverLetterGenerated = (jobTitle?: string) => {
  incrementUserProperty("total_cover_letters");
  trackEvent("Cover Letter Generated", { job_title: jobTitle });
};

// AI Features
export const trackAIFeatureUsed = (feature: string, properties?: Record<string, any>) => {
  incrementUserProperty("total_ai_uses");
  trackEvent("AI Feature Used", { feature, ...properties });
};

export const trackATSScoreChecked = (score: number, resumeId?: string) => {
  trackEvent("ATS Score Checked", { score, resume_id: resumeId });
};

export const trackLinkedInImport = (success: boolean) => {
  trackEvent("LinkedIn Import", { success });
};

// Pricing & Subscription Events
export const trackPricingPageViewed = (source?: string) => {
  trackEvent("Pricing Page Viewed", { source });
};

export const trackPlanSelected = (planId: string, planName: string, price: number) => {
  trackEvent("Plan Selected", { plan_id: planId, plan_name: planName, price });
};

export const trackCheckoutStarted = (planId: string, planName: string, price: number) => {
  trackEvent("Checkout Started", { plan_id: planId, plan_name: planName, price });
};

export const trackSubscriptionActivated = (plan: string, price: number, billingPeriod: string) => {
  setUserProperties({
    plan,
    subscription_price: price,
    billing_period: billingPeriod,
    subscription_date: new Date().toISOString(),
  });
  trackEvent("Subscription Activated", { plan, price, billing_period: billingPeriod });
};

export const trackSubscriptionCancelled = (plan: string, reason?: string) => {
  setUserProperties({ plan: "cancelled", cancellation_date: new Date().toISOString() });
  trackEvent("Subscription Cancelled", { plan, reason });
};

// Blog Events
export const trackBlogPostViewed = (slug: string, title: string, author?: string) => {
  trackEvent("Blog Post Viewed", { slug, title, author });
};

// Interview Prep Events
export const trackInterviewPrepStarted = (jobTitle?: string) => {
  trackEvent("Interview Prep Started", { job_title: jobTitle });
};

export const trackInterviewPrepCompleted = (score?: number) => {
  incrementUserProperty("total_interview_preps");
  trackEvent("Interview Prep Completed", { score });
};

// 6-Second Scan
export const trackResumeScanUsed = (resumeId?: string) => {
  incrementUserProperty("total_scans");
  trackEvent("Resume Scan Used", { resume_id: resumeId });
};

// Error Tracking
export const trackError = (errorType: string, errorMessage: string, context?: Record<string, any>) => {
  trackEvent("Error Occurred", { error_type: errorType, error_message: errorMessage, ...context });
};
