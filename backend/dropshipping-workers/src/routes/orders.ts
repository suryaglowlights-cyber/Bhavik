import { Router } from 'itty-router';
import { submitOrderToGlowroad } from '../suppliers/glowroad';
import { submitOrderToRoposo } from '../suppliers/roposo';
import { submitOrderToCJ } from '../suppliers/cj-dropshipping';

export const orderRoutes = Router();

// ========================================
// Order Routes - Secure Order Routing
// ========================================

interface OrderItem {
  productId: string;
  supplier: string;
  quantity: number;
  variantId?: string;
  customization?: Record<string, string>;
}

interface ShippingDetails {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface OrderPayload {
  items: OrderItem[];
  shipping: ShippingDetails;
  paymentMethod: string;
  paymentReference?: string;
  referenceOrderId: string;
}

/**
 * POST /api/orders/create
 * Create and submit order to appropriate supplier
 * 
 * Request body must include:
 * - items: Array of OrderItem
 * - shipping: ShippingDetails
 * - paymentMethod: 'COD' | 'PREPAID' | 'WALLET'
 * - referenceOrderId: Your internal order ID for tracking
 */
orderRoutes.post('/create', async (request: Request) => {
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const payload: OrderPayload = await request.json();

    // Validate payload
    const validation = validateOrderPayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Group items by supplier
    const itemsBySupplier = groupBySupplier(payload.items);
    const orders: any[] = [];

    // Submit order to each supplier
    for (const [supplier, items] of Object.entries(itemsBySupplier)) {
      try {
        let result;

        switch (supplier) {
          case 'glowroad':
            result = await submitOrderToGlowroad(env, items, payload.shipping, payload);
            break;
          case 'roposo':
            result = await submitOrderToRoposo(env, items, payload.shipping, payload);
            break;
          case 'cj':
            result = await submitOrderToCJ(env, items, payload.shipping, payload);
            break;
          default:
            throw new Error(`Unknown supplier: ${supplier}`);
        }

        orders.push({
          supplier,
          itemCount: items.length,
          supplierId: result.orderId,
          status: 'submitted',
          timestamp: new Date().toISOString(),
        });

        // Log order for audit trail
        await logOrder(env, payload.referenceOrderId, supplier, result.orderId, 'submitted');
      } catch (error: any) {
        console.error(`Failed to submit order to ${supplier}:`, error);
        orders.push({
          supplier,
          itemCount: items.length,
          status: 'failed',
          error: error.message,
          timestamp: new Date().toISOString(),
        });

        await logOrder(env, payload.referenceOrderId, supplier, null, 'failed', error.message);
      }
    }

    const allSuccessful = orders.every(o => o.status === 'submitted');

    return new Response(
      JSON.stringify({
        success: allSuccessful,
        referenceOrderId: payload.referenceOrderId,
        supplierOrders: orders,
        message: allSuccessful
          ? 'Order successfully routed to suppliers'
          : 'Some orders failed. Check details above.',
      }),
      {
        status: allSuccessful ? 200 : 207,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create order' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * GET /api/orders/:orderId/status
 * Check order status from supplier
 */
orderRoutes.get('/:orderId/status', async (request: Request) => {
  const { orderId } = request.params as any;
  const supplier = new URL(request.url).searchParams.get('supplier');
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    if (!supplier) {
      return new Response(
        JSON.stringify({ error: 'supplier query parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    let status;

    switch (supplier) {
      case 'glowroad':
        status = await getGlowroadOrderStatus(env, orderId);
        break;
      case 'roposo':
        status = await getRopozoOrderStatus(env, orderId);
        break;
      case 'cj':
        status = await getCJOrderStatus(env, orderId);
        break;
      default:
        throw new Error('Unknown supplier');
    }

    return new Response(
      JSON.stringify({ success: true, data: status }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// ========================================
// Helper Functions
// ========================================

function validateOrderPayload(payload: any): { valid: boolean; error?: string } {
  if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
    return { valid: false, error: 'items must be a non-empty array' };
  }

  if (!payload.shipping) {
    return { valid: false, error: 'shipping details are required' };
  }

  const required = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
  for (const field of required) {
    if (!payload.shipping[field]) {
      return { valid: false, error: `shipping.${field} is required` };
    }
  }

  if (!payload.referenceOrderId) {
    return { valid: false, error: 'referenceOrderId is required' };
  }

  return { valid: true };
}

function groupBySupplier(items: OrderItem[]): Record<string, OrderItem[]> {
  return items.reduce((acc, item) => {
    const supplier = item.supplier || 'unknown';
    if (!acc[supplier]) acc[supplier] = [];
    acc[supplier].push(item);
    return acc;
  }, {} as Record<string, OrderItem[]>);
}

async function logOrder(
  env: any,
  referenceOrderId: string,
  supplier: string,
  supplierId: string | null,
  status: string,
  error?: string
): Promise<void> {
  const logKey = `order:${referenceOrderId}:${supplier}`;
  const logData = {
    referenceOrderId,
    supplier,
    supplierId,
    status,
    error,
    timestamp: new Date().toISOString(),
  };

  if (env.SUPPLIER_CACHE) {
    await env.SUPPLIER_CACHE.put(logKey, JSON.stringify(logData), {
      expirationTtl: 604800, // 7 days
    });
  }
}

// Placeholder status functions
async function getGlowroadOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'glowroad' };
}

async function getRopozoOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'roposo' };
}

async function getCJOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'cj' };
}
