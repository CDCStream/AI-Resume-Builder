import { Polar } from "@polar-sh/sdk";

// Initialize Polar client
export const polar = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
});

// Product IDs - these will be set after creating products in Polar dashboard
export const POLAR_PRODUCTS = {
  TRIAL: process.env.POLAR_PRODUCT_TRIAL_ID || "",
  PRO_MONTHLY: process.env.POLAR_PRODUCT_MONTHLY_ID || "",
  PRO_QUARTERLY: process.env.POLAR_PRODUCT_QUARTERLY_ID || "",
  PRO_SEMI_ANNUAL: process.env.POLAR_PRODUCT_SEMI_ANNUAL_ID || "",
};

// Price configurations
export const PRICING = {
  TRIAL: {
    name: "7-Day Pro Trial",
    price: 1,
    period: "7 days",
    polarProductId: POLAR_PRODUCTS.TRIAL,
    features: [
      "Full Pro access for 7 days",
      "Unlimited resumes & cover letters",
      "All 14+ premium templates",
      "No watermark",
      "AI-powered optimization",
      "ATS score analysis",
      "LinkedIn import",
      "Interview prep AI",
      "6-second resume scan",
    ],
  },
  PRO_MONTHLY: {
    name: "Pro Monthly",
    price: 13.98,
    period: "month",
    polarProductId: POLAR_PRODUCTS.PRO_MONTHLY,
    features: [
      "Unlimited resumes & cover letters",
      "All premium templates",
      "No watermark",
      "AI-powered suggestions",
      "ATS score optimization",
      "LinkedIn profile import",
      "Job-specific cover letters",
      "Interview prep AI",
      "Priority support",
    ],
  },
  PRO_QUARTERLY: {
    name: "Pro Quarterly",
    price: 9.25,
    totalPrice: 27.75,
    period: "quarter",
    savings: "34%",
    polarProductId: POLAR_PRODUCTS.PRO_QUARTERLY,
    features: [
      "Unlimited resumes & cover letters",
      "All premium templates",
      "No watermark",
      "AI-powered suggestions",
      "ATS score optimization",
      "LinkedIn profile import",
      "Job-specific cover letters",
      "Interview prep AI",
      "Priority support",
    ],
  },
  PRO_SEMI_ANNUAL: {
    name: "Pro Semi-Annual",
    price: 7.85,
    totalPrice: 47.10,
    period: "6 months",
    savings: "44%",
    polarProductId: POLAR_PRODUCTS.PRO_SEMI_ANNUAL,
    features: [
      "Unlimited resumes & cover letters",
      "All premium templates",
      "No watermark",
      "AI-powered suggestions",
      "ATS score optimization",
      "LinkedIn profile import",
      "Job-specific cover letters",
      "Interview prep AI",
      "Priority support",
    ],
  },
};

export type PlanType = keyof typeof PRICING;
