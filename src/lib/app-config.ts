export const APP_MODE = process.env.APP_MODE || "premium";
export const isFreeMode = APP_MODE === "free";
export const isPremiumMode = APP_MODE === "premium";

export const features = {
  linkedinProfileImport: isPremiumMode,
  linkedinJobSearch: true,
  salaryPages: isPremiumMode,
  interviewPrep: true,
  digitalPortfolio: true,
  paidTrial: false,
};
