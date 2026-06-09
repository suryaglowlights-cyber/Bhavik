// ========================================
// Quick Reference Guide - API Endpoints
// ========================================

/**
 * BASE URL: https://api.yourdomain.com/api (production)
 *           http://localhost:8787/api (development)
 */

export const API_ENDPOINTS = {
  // ========================================
  // PRODUCTS
  // ========================================
  
  SEARCH_PRODUCTS: {
    method: 'GET',
    path: '/products/search',
    description: 'Search and filter products from all suppliers with margin applied',
    params: {
      supplier: 'glowroad | roposo | cj | all (default: all)',
      category: 'string (optional)',
      search: 'string (optional search keyword)',
      limit: 'number (default: 50, max: 200)',
      offset: 'number (default: 0, for pagination)',
      margin: 'number (override default margin %)',
    },
    example: `
GET /api/products/search?supplier=glowroad&category=tshirts&limit=20&margin=30
    `,
    response: {
      success: true,
      data: [
        {
          id: 'glowroad:12345',
          supplier: 'glowroad',
          name: 'Cotton T-Shirt',
          originalPrice: 100,
          price: 130, // With 30% margin
          margin: 30,
          marginAmount: 30,
          image: 'https://...',
          rating: 4.5,
          reviews: 120,
          colors: ['red', 'blue'],
        },
      ],
      total: 1250,
      limit: 20,
      offset: 0,
    },
  },

  GET_PRODUCT: {
    method: 'GET',
    path: '/products/:id',
    description: 'Get single product details',
    params: {
      id: 'supplier:productId (e.g., glowroad:12345)',
      margin: 'number (optional)',
    },
    example: `
GET /api/products/glowroad:12345?margin=25
    `,
    response: {
      success: true,
      data: {
        id: 'glowroad:12345',
        supplier: 'glowroad',
        name: 'Cotton T-Shirt',
        description: '...',
        originalPrice: 100,
        price: 125,
        margin: 25,
        marginAmount: 25,
        images: ['https://...', 'https://...'],
        rating: 4.5,
        reviews: 120,
        colors: ['red', 'blue', 'green'],
        providerProductId: '12345',
      },
    },
  },

  // ========================================
  // ORDERS
  // ========================================

  CREATE_ORDER: {
    method: 'POST',
    path: '/orders/create',
    description: 'Submit order to suppliers',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_TOKEN (optional)',
    },
    body: {
      items: [
        {
          productId: 'glowroad:12345',
          supplier: 'glowroad',
          quantity: 2,
          variantId: 'red-xl', // optional
          customization: { personalization: 'John' }, // optional
        },
      ],
      shipping: {
        fullName: 'John Doe',
        email: 'john@example.com',
        phone: '+91-9876543210',
        address: '123 Main Street',
        city: 'Mumbai',
        state: 'MH',
        pincode: '400001',
        country: 'IN', // optional, default: IN
      },
      paymentMethod: 'COD | PREPAID | WALLET',
      paymentReference: 'TXN-12345', // optional, required if PREPAID
      referenceOrderId: 'ORD-1234567890', // Your internal order ID
    },
    example: `
POST /api/orders/create
Content-Type: application/json

{
  "items": [
    {"productId": "glowroad:12345", "supplier": "glowroad", "quantity": 1}
  ],
  "shipping": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+91-9876543210",
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "MH",
    "pincode": "400001"
  },
  "paymentMethod": "COD",
  "referenceOrderId": "ORD-1234567890"
}
    `,
    response: {
      success: true,
      referenceOrderId: 'ORD-1234567890',
      supplierOrders: [
        {
          supplier: 'glowroad',
          itemCount: 1,
          supplierId: 'GR-98765432',
          status: 'submitted',
          timestamp: '2024-01-15T10:30:00Z',
        },
      ],
      message: 'Order successfully routed to suppliers',
    },
  },

  GET_ORDER_STATUS: {
    method: 'GET',
    path: '/orders/:orderId/status',
    description: 'Check order status from supplier',
    params: {
      orderId: 'supplier order ID',
      supplier: 'glowroad | roposo | cj',
    },
    example: `
GET /api/orders/GR-98765432/status?supplier=glowroad
    `,
    response: {
      success: true,
      data: {
        orderId: 'GR-98765432',
        status: 'shipped', // pending, processing, shipped, delivered
        tracking: 'TRK-123456789',
        carrier: 'DHL',
        items: [{ productId: '12345', quantity: 1 }],
        total: 130,
        createdAt: '2024-01-15T10:30:00Z',
      },
    },
  },

  // ========================================
  // SUPPLIERS (Admin Only - Requires Bearer Token)
  // ========================================

  LIST_SUPPLIERS: {
    method: 'GET',
    path: '/suppliers',
    description: 'Get list of all configured suppliers and their status',
    auth: 'Bearer token required',
    example: `
GET /api/suppliers
Authorization: Bearer YOUR_API_TOKEN
    `,
    response: {
      success: true,
      data: [
        {
          id: 'glowroad',
          name: 'GlowRoad',
          isActive: true,
          baseUrl: 'https://api.glowroad.com',
          lastSync: '2024-01-15T08:30:00Z',
        },
        {
          id: 'roposo',
          name: 'Roposo Clout',
          isActive: true,
          baseUrl: 'https://api.roposo.com',
          lastSync: '2024-01-15T08:15:00Z',
        },
      ],
    },
  },

  TRIGGER_SYNC: {
    method: 'POST',
    path: '/suppliers/:id/sync',
    description: 'Manually trigger product sync for a supplier',
    auth: 'Bearer token required',
    params: {
      id: 'glowroad | roposo | cj',
    },
    example: `
POST /api/suppliers/glowroad/sync
Authorization: Bearer YOUR_API_TOKEN
    `,
    response: {
      success: true,
      data: {
        supplier: 'glowroad',
        syncStarted: '2024-01-15T10:35:00Z',
        expectedDuration: '5-15 minutes',
      },
    },
  },

  CHECK_HEALTH: {
    method: 'GET',
    path: '/suppliers/:id/health',
    description: 'Check supplier API connectivity and configuration',
    auth: 'Bearer token required',
    params: {
      id: 'glowroad | roposo | cj',
    },
    example: `
GET /api/suppliers/glowroad/health
Authorization: Bearer YOUR_API_TOKEN
    `,
    response: {
      success: true,
      data: {
        status: 'ok', // ok, unconfigured, error
        apiConfigured: true,
        lastCheck: '2024-01-15T10:35:00Z',
      },
    },
  },

  HEALTH_CHECK: {
    method: 'GET',
    path: '/health',
    description: 'Check if backend is running (no auth required)',
    example: `
GET /api/health
    `,
    response: {
      status: 'ok',
      timestamp: '2024-01-15T10:35:00Z',
    },
  },
};

// ========================================
// HTTP Status Codes
// ========================================

export const STATUS_CODES = {
  200: 'OK - Request successful',
  201: 'Created - Resource created',
  204: 'No Content - Success but no response body',
  207: 'Multi-Status - Partial success (some orders failed)',
  400: 'Bad Request - Invalid parameters or payload',
  401: 'Unauthorized - Missing or invalid authentication',
  403: 'Forbidden - Insufficient permissions',
  404: 'Not Found - Resource not found',
  429: 'Too Many Requests - Rate limit exceeded',
  500: 'Internal Server Error - Backend error',
  503: 'Service Unavailable - Backend temporarily down',
};

// ========================================
// Error Handling Examples
// ========================================

export const ERROR_EXAMPLES = {
  cors_preflight_error: {
    status: 403,
    error: 'CORS policy violation',
    solution: 'Add your domain to ALLOWED_ORIGINS in wrangler.toml',
  },

  missing_auth_token: {
    status: 401,
    error: 'Missing Authorization header',
    solution: `Add header: Authorization: Bearer YOUR_API_TOKEN`,
  },

  invalid_product_id: {
    status: 404,
    error: 'Product not found',
    solution: 'Use format: supplier:productId (e.g., glowroad:12345)',
  },

  incomplete_order: {
    status: 400,
    error: 'Incomplete order data',
    details: 'referenceOrderId is required',
    solution: 'Include all required fields in order payload',
  },

  supplier_api_error: {
    status: 500,
    error: 'Failed to submit order to GlowRoad',
    details: 'Invalid payment method for supplier',
    solution: 'Check supplier API docs for supported payment methods',
  },

  rate_limit: {
    status: 429,
    error: 'Too many requests',
    retryAfter: 60,
    solution: 'Wait before retrying. Implement exponential backoff.',
  },
};

// ========================================
// Frontend Integration Examples
// ========================================

export const CODE_EXAMPLES = {
  // Fetch products
  searchProducts: `
import { fetchDropshipperProducts } from '@/lib/dropshippingApi';

const products = await fetchDropshipperProducts({
  supplier: 'glowroad',
  category: 'tshirts',
  limit: 20,
  margin: 30, // Override default margin
});
  `,

  // Submit order
  submitOrder: `
import { submitDropshipperOrder } from '@/lib/dropshippingApi';

const result = await submitDropshipperOrder({
  items: [
    {
      productId: 'glowroad:12345',
      supplier: 'glowroad',
      quantity: 2,
    },
  ],
  shipping: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '+91-9876543210',
    address: '123 Main St',
    city: 'Mumbai',
    state: 'MH',
    pincode: '400001',
  },
  paymentMethod: 'COD',
  referenceOrderId: 'ORD-' + Date.now(),
});

if (result.success) {
  console.log('Order submitted successfully');
  console.log('Supplier orders:', result.supplierOrders);
}
  `,

  // Check order status
  checkStatus: `
import { checkDropshipperOrderStatus } from '@/lib/dropshippingApi';

const status = await checkDropshipperOrderStatus('GR-98765432', 'glowroad');
console.log('Order status:', status.status);
console.log('Tracking:', status.tracking);
  `,

  // Calculate margin
  calculateMargin: `
import { calculateRetailPrice, getMarginConfig } from '@/utils/marginCalculator';

const margin = getMarginConfig();
const retailPrice = calculateRetailPrice(100, margin);
console.log('Cost: 100, Retail: ' + retailPrice); // 130 (with 30% margin)
  `,
};

// ========================================
// Rate Limits & Quotas
// ========================================

export const RATE_LIMITS = {
  productSearch: {
    limit: '100 requests per minute',
    note: 'Applies per API key',
  },
  orderSubmission: {
    limit: '30 requests per minute',
    note: 'Total across all suppliers',
  },
  statusCheck: {
    limit: '60 requests per minute',
    note: 'Per supplier',
  },
  adminOperations: {
    limit: '10 requests per minute',
    note: 'Supplier sync, health checks',
  },
};

// ========================================
// Environment Variables Reference
// ========================================

export const ENV_VARS = {
  VITE_BACKEND_URL: 'Backend API base URL',
  VITE_API_TOKEN: 'Authentication token for admin endpoints',
  VITE_DEFAULT_MARGIN_PERCENTAGE: 'Default profit margin %',
  GLOWROAD_API_KEY: 'GlowRoad authentication',
  GLOWROAD_API_SECRET: 'GlowRoad secret',
  ROPOSO_CLOUT_API_KEY: 'Roposo authentication',
  ROPOSO_CLOUT_SELLER_ID: 'Roposo seller ID',
  CJ_DROPSHIPPING_API_KEY: 'CJ Dropshipping authentication',
  CJ_DROPSHIPPING_ACCESS_TOKEN: 'CJ access token',
  JWT_SECRET: 'JWT signing secret (Cloudflare Workers)',
  ALLOWED_ORIGINS: 'CORS allowed domains',
};
