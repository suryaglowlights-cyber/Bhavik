// ========================================
// GlowRoad API Integration
// ========================================

interface GlowroadProduct {
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

interface GlowroadOrderItem {
  productId: string;
  quantity: number;
  variantId?: string;
}

/**
 * Fetch products from GlowRoad with caching
 */
export async function fetchGlowroadProducts(
  env: any,
  options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<GlowroadProduct[]> {
  const cacheKey = `glowroad:products:${JSON.stringify(options)}`;

  // Try to get from cache first
  if (env.SUPPLIER_CACHE) {
    const cached = await env.SUPPLIER_CACHE.get(cacheKey, 'json');
    if (cached) {
      return cached;
    }
  }

  try {
    const url = new URL('https://api.glowroad.com/v2/products');

    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('search', options.search);
    url.searchParams.append('limit', String(options.limit || 50));
    url.searchParams.append('offset', String(options.offset || 0));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.GLOWROAD_API_KEY}`,
        'X-Client-Id': env.GLOWROAD_API_SECRET,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GlowRoad API error: ${response.statusText}`);
    }

    const data = await response.json();
    const products = (data.products || []).map((p: any) => ({
      id: `glowroad:${p.id}`,
      supplier: 'glowroad',
      name: p.title || p.name,
      price: parseFloat(p.wholesale_price || p.price || 0),
      originalPrice: parseFloat(p.price || 0),
      image: p.image || p.thumbnail,
      images: p.images || [p.image],
      category: p.category || 'uncategorized',
      rating: parseFloat(p.rating || 0),
      reviews: parseInt(p.reviews || 0, 10),
      description: p.description,
      colors: p.colors || [],
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
    console.error('GlowRoad fetch error:', error);
    return [];
  }
}

/**
 * Submit order to GlowRoad
 */
export async function submitOrderToGlowroad(
  env: any,
  items: any[],
  shipping: any,
  orderPayload: any
): Promise<{ orderId: string; status: string }> {
  const glowroadItems = items.map(item => ({
    product_id: item.productId.split(':')[1], // Remove 'glowroad:' prefix
    quantity: item.quantity,
    variant_id: item.variantId,
  }));

  const payload = {
    recipient_name: shipping.fullName,
    recipient_phone: shipping.phone,
    recipient_email: shipping.email,
    recipient_address: `${shipping.address}, ${shipping.city}, ${shipping.state} ${shipping.pincode}`,
    recipient_country: shipping.country || 'IN',
    recipient_postal_code: shipping.pincode,
    items: glowroadItems,
    payment_method: mapPaymentMethod(orderPayload.paymentMethod),
    shipping_method: 'standard',
    remarks: `Order ID: ${orderPayload.referenceOrderId}`,
  };

  try {
    const response = await fetch('https://api.glowroad.com/v2/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.GLOWROAD_API_KEY}`,
        'X-Client-Id': env.GLOWROAD_API_SECRET,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`GlowRoad order error: ${error}`);
    }

    const result = await response.json();

    return {
      orderId: result.order_id || result.id,
      status: 'submitted',
    };
  } catch (error: any) {
    console.error('GlowRoad order submission error:', error);
    throw new Error(`Failed to submit order to GlowRoad: ${error.message}`);
  }
}

/**
 * Get order status from GlowRoad
 */
export async function getGlowroadOrderStatus(env: any, orderId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.glowroad.com/v2/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.GLOWROAD_API_KEY}`,
        'X-Client-Id': env.GLOWROAD_API_SECRET,
      },
    });

    if (!response.ok) {
      throw new Error(`GlowRoad API error: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      orderId: data.order_id,
      status: data.status, // pending, processing, shipped, delivered
      tracking: data.tracking_number,
      carrier: data.carrier,
      items: data.items,
      total: data.total,
      createdAt: data.created_at,
    };
  } catch (error: any) {
    console.error('GlowRoad status fetch error:', error);
    throw error;
  }
}

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    COD: 'cod',
    PREPAID: 'prepaid',
    WALLET: 'wallet',
  };
  return mapping[method] || 'cod';
}
