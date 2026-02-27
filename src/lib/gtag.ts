export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Check if GA is available
export const isGAEnabled = () => {
  return typeof window !== "undefined" && GA_MEASUREMENT_ID;
};

// Page view tracking
export const pageview = (url: string) => {
  if (!isGAEnabled()) return;
  window.gtag("config", GA_MEASUREMENT_ID!, {
    page_path: url,
  });
};

// Generic event tracking
export const event = (action: string, params?: Record<string, any>) => {
  if (!isGAEnabled()) return;
  window.gtag("event", action, params);
};

// ============================================
// PREDEFINED GA4 EVENTS
// ============================================

// Auth Events
export const gaSignUp = (method: string = "email") => {
  event("sign_up", { method });
};

export const gaLogin = (method: string = "email") => {
  event("login", { method });
};

// E-commerce / Subscription Events
export const gaBeginCheckout = (plan: string, price: number, currency: string = "USD") => {
  event("begin_checkout", {
    currency,
    value: price,
    items: [
      {
        item_id: plan,
        item_name: `LinImpact Pro ${plan}`,
        price,
        quantity: 1,
      },
    ],
  });
};

export const gaPurchase = (
  transactionId: string,
  plan: string,
  price: number,
  currency: string = "USD"
) => {
  event("purchase", {
    transaction_id: transactionId,
    currency,
    value: price,
    items: [
      {
        item_id: plan,
        item_name: `LinImpact Pro ${plan}`,
        price,
        quantity: 1,
      },
    ],
  });
};

// Resume Events
export const gaResumeCreated = (templateId?: string) => {
  event("resume_created", {
    template_id: templateId,
  });
};

export const gaResumeDownloaded = (resumeId: string, format: string = "pdf") => {
  event("resume_downloaded", {
    resume_id: resumeId,
    format,
  });
};

export const gaTemplateSelected = (templateId: string, templateName: string) => {
  event("select_item", {
    item_list_name: "Resume Templates",
    items: [
      {
        item_id: templateId,
        item_name: templateName,
      },
    ],
  });
};

// Cover Letter Events
export const gaCoverLetterGenerated = (jobTitle?: string) => {
  event("cover_letter_generated", {
    job_title: jobTitle,
  });
};

// AI Feature Events
export const gaAIFeatureUsed = (featureName: string) => {
  event("ai_feature_used", {
    feature_name: featureName,
  });
};

export const gaATSScoreChecked = (score: number) => {
  event("ats_score_checked", {
    score,
  });
};

export const gaLinkedInImport = (success: boolean) => {
  event("linkedin_import", {
    success,
  });
};

// Engagement Events
export const gaViewPromotion = (promotionName: string) => {
  event("view_promotion", {
    promotion_name: promotionName,
  });
};

export const gaShare = (method: string, contentType: string, itemId: string) => {
  event("share", {
    method,
    content_type: contentType,
    item_id: itemId,
  });
};

// Blog Events
export const gaBlogPostViewed = (slug: string, title: string, author?: string) => {
  event("blog_post_viewed", {
    article_id: slug,
    article_title: title,
    article_author: author,
  });
};

// Search Events
export const gaSearch = (searchTerm: string) => {
  event("search", {
    search_term: searchTerm,
  });
};

// Error Events
export const gaException = (description: string, fatal: boolean = false) => {
  event("exception", {
    description,
    fatal,
  });
};

// Custom conversion events
export const gaGenerateLead = (source?: string) => {
  event("generate_lead", {
    source,
  });
};

// Declare gtag on window
declare global {
  interface Window {
    gtag: (
      command: "config" | "event" | "js",
      targetId: string | Date,
      params?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}
