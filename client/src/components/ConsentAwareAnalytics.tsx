import { useEffect } from "react";
import { readCookieConsent, type CookieConsent } from "@/lib/cookieConsent";

const ANALYTICS_SCRIPT_ID = "nabdh-consent-aware-analytics";

function loadAnalytics() {
  if (document.getElementById(ANALYTICS_SCRIPT_ID)) return;
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT as string | undefined;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID as string | undefined;
  if (!endpoint || !websiteId) return;

  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.defer = true;
  script.src = `${endpoint.replace(/\/$/, "")}/umami`;
  script.dataset.websiteId = websiteId;
  document.body.appendChild(script);
}

export default function ConsentAwareAnalytics() {
  useEffect(() => {
    const applyConsent = (value: CookieConsent | null) => {
      if (value === "accepted") loadAnalytics();
    };
    applyConsent(readCookieConsent(window.localStorage));
    const handleConsentChange = (event: Event) => {
      applyConsent((event as CustomEvent<CookieConsent>).detail);
    };
    window.addEventListener("nabdh-consent-changed", handleConsentChange);
    return () => window.removeEventListener("nabdh-consent-changed", handleConsentChange);
  }, []);

  return null;
}
