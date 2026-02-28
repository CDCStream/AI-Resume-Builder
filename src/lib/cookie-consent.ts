const CONSENT_KEY = "linimpact_cookie_consent";

export type ConsentStatus = "accepted" | "rejected" | null;

export function getConsentStatus(): ConsentStatus {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(CONSENT_KEY);
  if (value === "accepted" || value === "rejected") return value;
  return null;
}

export function setConsentStatus(status: "accepted" | "rejected") {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, status);
}

export function hasConsented(): boolean {
  return getConsentStatus() === "accepted";
}
