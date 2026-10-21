"use client";

import { track } from "@vercel/analytics";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    clarity?: (...args: unknown[]) => void;
  }
}

export function isAutomatedOrInternalSession(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  try {
    if (navigator.webdriver === true) return true;
    const ua = navigator.userAgent || "";
    if (/HeadlessChrome|Playwright|Puppeteer|PhantomJS|Cypress|Lighthouse/i.test(ua)) {
      return true;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("e2e") === "1" || params.get("internal") === "1" || params.get("no_track") === "1") {
      try {
        window.localStorage.setItem("ignore_analytics", "1");
      } catch {
        // ignore
      }
      return true;
    }
    try {
      if (window.localStorage.getItem("ignore_analytics") === "1") {
        return true;
      }
    } catch {
      // ignore
    }
  } catch {
    return false;
  }
  return false;
}

export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
) {
  if (isAutomatedOrInternalSession()) return;
  try {
    track(eventName, params);
  } catch {
    // ignore
  }
  try {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", eventName, params ?? {});
    }
  } catch {
    // ignore
  }
  try {
    if (typeof window !== "undefined" && typeof window.clarity === "function") {
      window.clarity("event", eventName);
    }
  } catch {
    // ignore
  }
}

export const trackToolEvent = trackEvent;
