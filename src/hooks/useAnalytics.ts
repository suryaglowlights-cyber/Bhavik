/**
 * Google Analytics 4 hook for tracking events
 */

import { useEffect } from "react";

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
  }
}

export const useAnalytics = () => {
  /**
   * Initialize GA4 (call once on app mount)
   */
  const initGA = (measurementId: string) => {
    if (!window.gtag) {
      console.warn("GA4 not loaded. Ensure gtag script is in index.html");
      return;
    }
    window.gtag("config", measurementId);
  };

  /**
   * Track page view
   */
  const trackPageView = (pagePath: string, pageTitle?: string) => {
    if (!window.gtag) return;
    window.gtag("event", "page_view", {
      page_path: pagePath,
      page_title: pageTitle || document.title,
    });
  };

  /**
   * Track custom event (e.g., button clicks, form submissions)
   */
  const trackEvent = (
    eventName: string,
    eventParams?: Record<string, any>
  ) => {
    if (!window.gtag) return;
    window.gtag("event", eventName, eventParams || {});
  };

  /**
   * Track product view
   */
  const trackProductView = (productId: string, productName: string) => {
    trackEvent("view_item", {
      items: [
        {
          item_id: productId,
          item_name: productName,
        },
      ],
    });
  };

  /**
   * Track add to cart
   */
  const trackAddToCart = (
    productId: string,
    productName: string,
    price: number,
    quantity: number
  ) => {
    trackEvent("add_to_cart", {
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
          quantity,
        },
      ],
    });
  };

  /**
   * Track checkout
   */
  const trackCheckout = (
    cartValue: number,
    itemCount: number
  ) => {
    trackEvent("begin_checkout", {
      value: cartValue,
      currency: "INR",
      items: itemCount,
    });
  };

  return {
    initGA,
    trackPageView,
    trackEvent,
    trackProductView,
    trackAddToCart,
    trackCheckout,
  };
};

/**
 * Hook to auto-track page views on route changes
 */
export const usePageViewTracking = () => {
  useEffect(() => {
    const { trackPageView } = useAnalytics();
    trackPageView(window.location.pathname);

    // Optional: Track on hash changes for SPA
    const handleHashChange = () => {
      trackPageView(window.location.pathname + window.location.hash);
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
};
