// ========================================
// CJ Dropshipping API Integration
// ========================================

interface CJProduct {
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
 * Fetch products from CJ Dropshipping with caching
 */
export async function fetchCJProducts(
  env: any,
  options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CJProduct[]> {
  const cacheKey = `cj:products:${JSON.stringify(options)}`;

  // Try to get from cache first
  if (env.SUPPLIER_CACHE) {
    const cached = await env.SUPPLIER_CACHE.get(cacheKey, 'json');
    if (cached) {
      return cached;
    }
  }

  try {
    const url = new URL('https://api.cjdropshipping.com/v1/products');

    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('keywords', options.search);
    url.searchParams.append('pageSize', String(options.limit || 50));
    url.searchParams.append('pageNum', String(Math.ceil((options.offset || 0) / (options.limit || 50)) + 1));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CJ_DROPSHIPPING_API_KEY}`,
        'X-Access-Token': env.CJ_DROPSHIPPING_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CJ API error: ${response.statusText}`);
    }

    const data = await response.json();
    const products = (data.data?.items || data.items || []).map((p: any) => ({
      id: `cj:${p.productId}`,
      supplier: 'cj',
      name: p.productName || p.title,
      price: parseFloat(p.costPrice || p.wholesale_price || 0),
      originalPrice: parseFloat(p.salePrice || p.retailPrice || 0),
      image: p.mainImage || p.thumbnail,
      images: p.productImages || [p.mainImage],
      category: p.category || 'uncategorized',
      rating: parseFloat(p.rating || 0),
      reviews: parseInt(p.reviewsCount || 0, 10),
      description: p.description,
      colors: p.colorArray || [],
      providerProductId: p.productId,
    }));

    // Cache for 4 hours
    if (env.SUPPLIER_CACHE) {
      await env.SUPPLIER_CACHE.put(cacheKey, JSON.stringify(products), {
        expirationTtl: 14400,
      });
    }

    return products;
  } catch (error: any) {
    console.error('CJ Dropshipping fetch error:', error);
    return [];
  }
}

/**
 * Submit order to CJ Dropshipping
 */
export async function submitOrderToCJ(
  env: any,
  items: any[],
  shipping: any,
  orderPayload: any
): Promise<{ orderId: string; status: string }> {
  const cjItems = items.map(item => ({
    productId: item.productId.split(':')[1],
    quantity: item.quantity,
    variantId: item.variantId,
  }));

  const payload = {
    buyerName: shipping.fullName,
    buyerPhone: shipping.phone,
    buyerEmail: shipping.email,
    shippingAddress: {
      street: shipping.address,
      city: shipping.city,
      state: shipping.state,
      zipCode: shipping.pincode,
      country: shipping.country || 'IN',
    },
    products: cjItems,
    shippingMethod: 'standard',
    paymentMethod: mapPaymentMethod(orderPayload.paymentMethod),
    remarks: `Order ID: ${orderPayload.referenceOrderId}`,
  };

  try {
    const response = await fetch('https://api.cjdropshipping.com/v1/orders/place', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.CJ_DROPSHIPPING_API_KEY}`,
        'X-Access-Token': env.CJ_DROPSHIPPING_ACCESS_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`CJ order error: ${error}`);
    }

    const result = await response.json();

    return {
      orderId: result.data?.orderId || result.orderId,
      status: 'submitted',
    };
  } catch (error: any) {
    console.error('CJ Dropshipping order submission error:', error);
    throw new Error(`Failed to submit order to CJ Dropshipping: ${error.message}`);
  }
}

/**
 * Get order status from CJ Dropshipping
 */
export async function getCJOrderStatus(env: any, orderId: string): Promise<any> {
  try {
    const response = await fetch(`https://api.cjdropshipping.com/v1/orders/${orderId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${env.CJ_DROPSHIPPING_API_KEY}`,
        'X-Access-Token': env.CJ_DROPSHIPPING_ACCESS_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`CJ API error: ${response.statusText}`);
    }

    const data = await response.json();
    const order = data.data || data;

    return {
      orderId: order.orderId,
      status: order.orderStatus, // pending, confirmed, processing, shipped, delivered
      tracking: order.trackingNumber,
      carrier: order.shippingMethod,
      items: order.products,
      total: order.totalAmount,
      createdAt: order.createTime,
    };
  } catch (error: any) {
    console.error('CJ status fetch error:', error);
    throw error;
  }
}

function mapPaymentMethod(method: string): string {
  const mapping: Record<string, string> = {
    COD: 'cod',
    PREPAID: 'prepaid',
    WALLET: 'prepaid',
  };
  return mapping[method] || 'cod';
}
