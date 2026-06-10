// Cloudflare Pages Function for Order Management
// Handles POST /api/orders/create and GET /api/orders/:orderId/status

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

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const payload: OrderPayload = await request.json();

    // Validate payload
    const validation = validateOrderPayload(payload);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ error: validation.error }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
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
          case 'printrove':
            result = await submitOrderToPrintrove(env, items, payload.shipping, payload);
            break;
          case 'glowroad':
            result = await submitOrderToGlowroad(env, items, payload.shipping, payload);
            break;
          case 'roposo':
            result = await submitOrderToRoposo(env, items, payload.shipping, payload);
            break;
          case 'qikink':
            result = await submitOrderToQikink(env, items, payload.shipping, payload);
            break;
          case 'blinkstore':
            result = await submitOrderToBlinkstore(env, items, payload.shipping, payload);
            break;
          case 'vendorgo':
            result = await submitOrderToVendorGo(env, items, payload.shipping, payload);
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
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Order creation error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to create order' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestGet(context: { request: Request; env: any }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const orderId = pathParts[pathParts.length - 1];
  const supplier = url.searchParams.get('supplier');

  try {
    if (!supplier) {
      return new Response(
        JSON.stringify({ error: 'supplier query parameter is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    let status;

    switch (supplier) {
      case 'printrove':
        status = await getPrintroveOrderStatus(env, orderId);
        break;
      case 'glowroad':
        status = await getGlowroadOrderStatus(env, orderId);
        break;
      case 'roposo':
        status = await getRoposoOrderStatus(env, orderId);
        break;
      case 'qikink':
        status = await getQikinkOrderStatus(env, orderId);
        break;
      case 'blinkstore':
        status = await getBlinkstoreOrderStatus(env, orderId);
        break;
      case 'vendorgo':
        status = await getVendorGoOrderStatus(env, orderId);
        break;
      default:
        throw new Error('Unknown supplier');
    }

    return new Response(
      JSON.stringify({ success: true, data: status }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

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

  if (env.BHAVIK_STORE) {
    await env.BHAVIK_STORE.put(logKey, JSON.stringify(logData), {
      expirationTtl: 604800, // 7 days
    });
  }
}

// Placeholder order submission functions - to be implemented with actual API calls
async function submitOrderToPrintrove(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
  if (!keysData) throw new Error('Printrove API keys not configured');
  
  const keys = JSON.parse(keysData);
  const { apiKey } = keys.printrove || {};
  if (!apiKey) throw new Error('Printrove API key not configured');

  // TODO: Implement actual Printrove API call
  return { orderId: `printrove-${Date.now()}` };
}

async function submitOrderToGlowroad(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  // TODO: Implement actual GlowRoad API call
  return { orderId: `glowroad-${Date.now()}` };
}

async function submitOrderToRoposo(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  // TODO: Implement actual Roposo API call
  return { orderId: `roposo-${Date.now()}` };
}

async function submitOrderToQikink(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
  if (!keysData) throw new Error('Qikink API keys not configured');
  
  const keys = JSON.parse(keysData);
  const { clientId, accessToken } = keys.qikink || {};
  if (!clientId || !accessToken) throw new Error('Qikink API keys not configured');

  // TODO: Implement actual Qikink API call
  return { orderId: `qikink-${Date.now()}` };
}

async function submitOrderToBlinkstore(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
  if (!keysData) throw new Error('Blinkstore API keys not configured');
  
  const keys = JSON.parse(keysData);
  const { apiKey, secretKey } = keys.blinkstore || {};
  if (!apiKey || !secretKey) throw new Error('Blinkstore API keys not configured');

  // TODO: Implement actual Blinkstore API call
  return { orderId: `blinkstore-${Date.now()}` };
}

async function submitOrderToVendorGo(env: any, items: OrderItem[], shipping: ShippingDetails, payload: OrderPayload): Promise<any> {
  const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
  if (!keysData) throw new Error('VendorGo API keys not configured');
  
  const keys = JSON.parse(keysData);
  const { apiKey, secretKey } = keys.vendorgo || {};
  if (!apiKey || !secretKey) throw new Error('VendorGo API keys not configured');

  // TODO: Implement actual VendorGo API call
  return { orderId: `vendorgo-${Date.now()}` };
}

// Placeholder status functions
async function getPrintroveOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'printrove' };
}

async function getGlowroadOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'glowroad' };
}

async function getRoposoOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'roposo' };
}

async function getQikinkOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'qikink' };
}

async function getBlinkstoreOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'blinkstore' };
}

async function getVendorGoOrderStatus(env: any, orderId: string): Promise<any> {
  return { status: 'pending', orderId, supplier: 'vendorgo' };
}
