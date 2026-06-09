// ========================================
// Secure Dropshipping API Integration
// Calls Cloudflare Workers backend (secure)
// ========================================

import type { Product } from "../data/products";

// Base URL for Cloudflare Workers backend
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8787/api';
const API_TOKEN = import.meta.env.VITE_API_TOKEN || '';

// ========================================
// Dropshipping Product Sync
// ========================================

/**
 * Fetch products from all dropshipping suppliers
 * API calls go through secure Cloudflare Workers backend
 */
export async function fetchDropshipperProducts(options: {
  supplier?: 'glowroad' | 'roposo' | 'cj' | 'all';
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
  margin?: number;
}): Promise<Product[]> {
  try {
    const url = new URL(`${BACKEND_URL}/products/search`);

    if (options.supplier) url.searchParams.append('supplier', options.supplier);
    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('search', options.search);
    url.searchParams.append('limit', String(options.limit || 50));
    url.searchParams.append('offset', String(options.offset || 0));
    if (options.margin) url.searchParams.append('margin', String(options.margin));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Failed to fetch dropshipper products:', error);
    return [];
  }
}

/**
 * Fetch single product details
 */
export async function fetchDropshipperProduct(
  productId: string,
  margin?: number
): Promise<Product | null> {
  try {
    const url = new URL(`${BACKEND_URL}/products/${productId}`);
    if (margin) url.searchParams.append('margin', String(margin));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error: any) {
    console.error('Failed to fetch product details:', error);
    return null;
  }
}

// ========================================
// Secure Order Routing
// ========================================

export interface OrderItem {
  productId: string;
  supplier: string;
  quantity: number;
  variantId?: string;
  customization?: Record<string, string>;
}

export interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country?: string;
}

export interface CheckoutPayload {
  items: OrderItem[];
  shipping: ShippingDetails;
  paymentMethod: 'COD' | 'PREPAID' | 'WALLET';
  paymentReference?: string;
  referenceOrderId: string;
}

/**
 * Submit order securely through Cloudflare Workers
 * API keys are NOT exposed to frontend
 */
export async function submitDropshipperOrder(
  payload: CheckoutPayload
): Promise<{
  success: boolean;
  referenceOrderId: string;
  supplierOrders: Array<{
    supplier: string;
    supplierId?: string;
    status: string;
    error?: string;
  }>;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error('Failed to submit order:', error);
    return {
      success: false,
      referenceOrderId: payload.referenceOrderId,
      supplierOrders: [
        {
          supplier: 'all',
          status: 'failed',
          error: error.message,
        },
      ],
    };
  }
}

/**
 * Check order status from supplier
 */
export async function checkDropshipperOrderStatus(
  orderId: string,
  supplier: 'glowroad' | 'roposo' | 'cj'
): Promise<{
  orderId: string;
  status: string;
  tracking?: string;
  carrier?: string;
  items?: any[];
  total?: number;
  createdAt?: string;
} | null> {
  try {
    const url = new URL(`${BACKEND_URL}/orders/${orderId}/status`);
    url.searchParams.append('supplier', supplier);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || null;
  } catch (error: any) {
    console.error('Failed to fetch order status:', error);
    return null;
  }
}

// ========================================
// Supplier Management (Admin)
// ========================================

/**
 * Get list of configured suppliers with status
 */
export async function getDropshippersHealth(): Promise<
  Array<{
    id: string;
    name: string;
    isActive: boolean;
    baseUrl: string;
    lastSync: string | null;
  }>
> {
  try {
    const response = await fetch(`${BACKEND_URL}/suppliers`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || [];
  } catch (error: any) {
    console.error('Failed to fetch supplier health:', error);
    return [];
  }
}

/**
 * Manually trigger product sync for a supplier
 */
export async function triggerSupplierSync(supplier: string): Promise<{
  syncStarted: string;
  expectedDuration: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/suppliers/${supplier}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || {};
  } catch (error: any) {
    console.error('Failed to trigger supplier sync:', error);
    throw error;
  }
}

/**
 * Check supplier API health
 */
export async function checkSupplierHealth(supplier: string): Promise<{
  status: 'ok' | 'unconfigured' | 'error';
  apiConfigured: boolean;
  lastCheck: string;
}> {
  try {
    const response = await fetch(`${BACKEND_URL}/suppliers/${supplier}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(API_TOKEN && { 'Authorization': `Bearer ${API_TOKEN}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data || {};
  } catch (error: any) {
    console.error('Failed to check supplier health:', error);
    throw error;
  }
}
