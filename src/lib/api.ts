// ===============================================
// API Integration Layer for POD Providers
// ===============================================
// Replace the BASE URLs & API KEYS with real ones
// from your provider dashboard before going live.
// ===============================================

import type { Product } from "../data/products";

// Provider configuration — fill these from .env in production
const API_CONFIG = {
  printrove: {
    baseUrl: "https://api.printrove.com/api/external/v1",
    apiKey: import.meta.env.VITE_PRINTROVE_API_KEY || "",
  },
  qikink: {
    baseUrl: "https://api.qikink.com/api/v1",
    clientId: import.meta.env.VITE_QIKINK_CLIENT_ID || "",
    accessToken: import.meta.env.VITE_QIKINK_TOKEN || "",
  },
  blinkstore: {
    baseUrl: "https://api.blinkstore.in/v1",
    apiKey: import.meta.env.VITE_BLINKSTORE_API_KEY || "",
  },
  vendorgo: {
    baseUrl: "https://api.vendorgo.in/v1",
    apiKey: import.meta.env.VITE_VENDORGO_API_KEY || "",
  },
};

// Fetch trending products from Printrove
export async function fetchPrintroveProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_CONFIG.printrove.baseUrl}/products`, {
      headers: { Authorization: `Bearer ${API_CONFIG.printrove.apiKey}` },
    });
    if (!res.ok) throw new Error("Printrove API failed");
    return await res.json();
  } catch (e) {
    console.warn("Printrove fallback to demo data", e);
    return [];
  }
}

// Fetch from Qikink
export async function fetchQikinkProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_CONFIG.qikink.baseUrl}/products`, {
      headers: {
        ClientId: API_CONFIG.qikink.clientId,
        Accesstoken: API_CONFIG.qikink.accessToken,
      },
    });
    if (!res.ok) throw new Error("Qikink API failed");
    return await res.json();
  } catch (e) {
    console.warn("Qikink fallback to demo data", e);
    return [];
  }
}

export async function fetchBlinkstoreProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_CONFIG.blinkstore.baseUrl}/products`, {
      headers: {
        "X-API-KEY": API_CONFIG.blinkstore.apiKey,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("Blinkstore API failed");
    return await res.json();
  } catch (e) {
    console.warn("Blinkstore fallback to demo data", e);
    return [];
  }
}

export async function fetchVendorGoProducts(): Promise<Product[]> {
  try {
    const res = await fetch(`${API_CONFIG.vendorgo.baseUrl}/products`, {
      headers: {
        Authorization: `Bearer ${API_CONFIG.vendorgo.apiKey}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) throw new Error("VendorGo API failed");
    return await res.json();
  } catch (e) {
    console.warn("VendorGo fallback to demo data", e);
    return [];
  }
}

// Place order via provider
export async function placeOrder(
  provider: Product["provider"],
  orderData: any
) {
  // Routes order to correct provider's API endpoint
  const map: Record<string, string> = {
    Printrove: `${API_CONFIG.printrove.baseUrl}/orders`,
    Qikink: `${API_CONFIG.qikink.baseUrl}/order/create`,
    Blinkstore: `${API_CONFIG.blinkstore.baseUrl}/orders`,
    VendorGo: `${API_CONFIG.vendorgo.baseUrl}/orders/create`,
  };
  console.log(`Order routed to ${provider}:`, map[provider], orderData);
  // In production: actual fetch POST request here
  return { success: true, orderId: "ORD" + Date.now() };
}

// Aggregator — auto-fetch from ALL providers + sort by trending
export async function getAllTrendingProducts(): Promise<Product[]> {
  const [printrove, qikink, blinkstore, vendorgo] = await Promise.all([
    fetchPrintroveProducts(),
    fetchQikinkProducts(),
    fetchBlinkstoreProducts(),
    fetchVendorGoProducts(),
  ]);
  const all = [...printrove, ...qikink, ...blinkstore, ...vendorgo];
  // Sort by trending score (rating × reviews)
  return all.sort((a, b) => b.rating * b.reviews - a.rating * a.reviews);
}
