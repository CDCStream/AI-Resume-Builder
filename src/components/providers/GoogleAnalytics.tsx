"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { GA_MEASUREMENT_ID, GA_ADS_MEASUREMENT_ID, GOOGLE_ADS_ID, pageview, captureUTMParams } from "@/lib/gtag";
import { hasConsented } from "@/lib/cookie-consent";

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    setConsent(hasConsented());
    const handler = (e: Event) => setConsent((e as CustomEvent).detail === "accepted");
    window.addEventListener("cookie-consent-changed", handler);
    return () => window.removeEventListener("cookie-consent-changed", handler);
  }, []);

  useEffect(() => {
    if (consent && pathname) {
      const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      pageview(url);
      captureUTMParams();
    }
  }, [pathname, searchParams, consent]);

  if (!GA_MEASUREMENT_ID || !consent) {
    return null;
  }

  const adsConfigLine = GOOGLE_ADS_ID
    ? `gtag('config', '${GOOGLE_ADS_ID}');`
    : "";

  const adsGAConfigLine = GA_ADS_MEASUREMENT_ID
    ? `gtag('config', '${GA_ADS_MEASUREMENT_ID}');`
    : "";

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
            ${adsGAConfigLine}
            ${adsConfigLine}
          `,
        }}
      />
    </>
  );
}
