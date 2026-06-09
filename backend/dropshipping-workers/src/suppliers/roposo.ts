// ========================================
// Roposo Clout API Integration
// ========================================

interface RopozoProduct {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  rating: number;
  reviews: number;
  description?: string;
}

/**
 * Fetch products from Roposo Clout with caching
 */
export async function fetchRopososProducts(
  env: any,
  options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<RopozoProduct[]> {
  const cacheKey = `roposo:products:${JSON.stringify(options)}`;

  // Try to get from cache first
  if (env.SUPPLIER_CACHE) {
    const cached = await env.SUPPLIER_CACHE.get(cacheKey, 'json');
    if (cached) {
      return cached;
    }
  }

  try {
    const url = new URL('https://api.roposo.com/v2/products');

    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('query', options.search);
    url.searchParams.append('limit', String(options.limit || 50));
    url.searchParams.append('offset', String(options.offset || 0));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.ROPOSO_CLOUT_API_KEY}`,
        'X-Seller-Id': env.ROPOSO_CLOUT_SELLER_ID,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Roposo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const products = (data.data || data.products || []).map((p: any) => ({
      id: `roposo:${p.id}`,
      supplier: 'roposo',
      name: p.name || p.title,
      price: parseFloat(p.wholesale_price || p.cost_price || p.price || 0),
      originalPrice: parseFloat(p.price || 0),
      image: p.image || p.thumbnail,
      images: p.images || [p.image],
      category: p.category || 'uncategorized',
      rating: parseFloat(p.rating || 0),
      reviews: parseInt(p.reviews_count || 0, 10),
      description: p.description,
      colors: p.color_options || [],
      providerProductId: p.id,
    }));

    // Cache for 4 hours
    if (env.SUPPLIER_CACHE) {
      await env.SUPPLIER_CACHE.put(cacheKey, JSON.stringify(products), {
        expirationTtl: 14400,
      });
    }

    return products;
  } catch (error: any) {
    console.error('Roposo fetch error:', error);
    return [];
  }
}

/**
 * Submit order to Roposo Clout
 */
export async function submitOrderToRoposo(
  env: any,
  items: any[],
  shipping: any,
  orderPayload: any
): Promise<{ orderId: string; status: string }> {
  const rozoItems = items.map(item => ({
    product_id: item.productId.split(':')[1],
    quantity: item.quantity,
    variant_id: item.variantId,
  }));

  const payload = {
    customer_name: shipping.fullName,
    customer_phone: shipping.phone,
    customer_email: shipping.email,
    shipping_address: {
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      postal_code: shipping.pincode,
      country: shipping.country || 'IN',
    },
    items: rozoItems,
    payment_mode: mapPaymentMethod(orderPayload.paymentMethod),
    order_reference: orderPayload.referenceOrderId,
  };

  try {
    const response = await fetch('https://api.roposo.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ROPOSO_CLOUT_API_KEY}`,
        'X-Seller-Id': env.ROPOSO_CLOUT_SELLER_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Roposo order error: ${error}`);
    }

    const result = await response.json();

    return {
      orderId: result.order_id || result.data?.order_id,
      status: 'submitted',
    };
  } catch (error: any) {
    console.error('Roposo order submission error:', error);
    throw new Error(`Failed to submit order to Roposo: ${error.message}`);
  }
}

/**
 * Get order status from Roposo
 */
export async function getRopozoOrderStatus(env: any, orderId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.roposo.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.ROPOSO_CLOUT_API_KEY}`,
        'X-Seller-Id': env.ROPOSO_CLOUT_SELLER_ID,
      },
    });

    if (!response.ok) {
      throw new Error(`Roposo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const order = data.data || data;

    return {
      orderId: order.order_id,
      status: order.status, // confirmed, processing, shipped, delivered
      tracking: order.tracking_number,
      carrier: order.shipping_carrier,
      items: order.items,
      total: order.order_total,
      createdAt: order.created_at,
    };
  } catch (error: any) {
    console.error('Roposo status fetch error:', error);
    throw error;
  }
}

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    COD: 'cod',
    PREPAID: 'paid',
    WALLET: 'wallet',
  };
  return mapping[method] || 'cod';
}
