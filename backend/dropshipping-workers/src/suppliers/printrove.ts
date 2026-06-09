// ========================================
// Printrove API Integration
// ========================================

interface PrintroveProduct {
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
 * Fetch products from Printrove with caching
 */
export async function fetchPrintroveProducts(
  env: any,
  options: {
    category?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }
): Promise<PrintroveProduct[]> {
  const cacheKey = `printrove:products:${JSON.stringify(options)}`;

  // Try to get from cache first
  if (env.SUPPLIER_CACHE) {
    const cached = await env.SUPPLIER_CACHE.get(cacheKey, 'json');
    if (cached) {
      return cached;
    }
  }

  try {
    const apiKey = await env.API_KEYS_KV.get('printrove:api_key');
    if (!apiKey) {
      throw new Error('Printrove API key not configured');
    }

    const url = new URL('https://api.printrove.com/api/external/v1/products');

    if (options.category) url.searchParams.append('category', options.category);
    if (options.search) url.searchParams.append('search', options.search);
    url.searchParams.append('limit', String(options.limit || 50));
    url.searchParams.append('offset', String(options.offset || 0));

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Printrove API error: ${response.statusText}`);
    }

    const data = await response.json();
    const products = extractProductBlocks(data).map((p: any) => ({
      id: `printrove:${p.id || p.product_id || p.sku}`,
      supplier: 'printrove',
      name: p.name || p.title || p.product_name || 'Untitled Product',
      price: parseFloat(p.cost_price || p.price || 0),
      originalPrice: parseFloat(p.price || p.mrp || p.selling_price || 0),
      image: p.images?.[0] || p.image || p.thumbnail || '',
      images: p.images || (p.image ? [p.image] : []),
      category: p.category || 'uncategorized',
      rating: parseFloat(p.rating || 0),
      reviews: parseInt(p.reviews_count || p.reviews || 0, 10),
      description: p.description || p.short_description || '',
      colors: p.color_options || [],
      providerProductId: p.id || p.product_id || p.sku,
    }));

    // Cache for 4 hours
    if (env.SUPPLIER_CACHE) {
      await env.SUPPLIER_CACHE.put(cacheKey, JSON.stringify(products), {
        expirationTtl: 14400,
      });
    }

    return products;
  } catch (error: any) {
    console.error('Printrove fetch error:', error);
    return [];
  }
}

/**
 * Sync catalog from Printrove
 */
export async function syncPrintroveCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    const apiKey = await env.API_KEYS_KV.get('printrove:api_key');
    if (!apiKey) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Printrove API key not configured',
      };
    }

    const response = await fetch('https://api.printrove.com/api/external/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Printrove API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    for (const item of items) {
      const productId = item.id || item.product_id || item.sku;
      if (!productId) continue;

      const title = item.name || item.title || item.product_name || 'Untitled Product';
      const description = item.description || item.short_description || '';
      const retailPrice = parseFloat(item.price || item.mrp || item.selling_price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || item.availability || 'active';

      // Insert or update product in D1 database
      await env.DB.prepare(`
        INSERT INTO products (provider_name, provider_product_id, title, description, retail_price, wholesale_cost, images, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(provider_name, provider_product_id)
        DO UPDATE SET
          title = excluded.title,
          description = excluded.description,
          retail_price = excluded.retail_price,
          wholesale_cost = excluded.wholesale_cost,
          images = excluded.images,
          status = excluded.status,
          updated_at = datetime('now')
      `).bind(
        'Printrove',
        productId,
        title,
        description,
        retailPrice,
        wholesaleCost,
        images,
        status
      ).run();

      saved++;
    }

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('Printrove catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
}

/**
 * Extract product blocks from various API response formats
 */
function extractProductBlocks(payload: any): any[] {
  if (payload.data && Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload.products && Array.isArray(payload.products)) {
    return payload.products;
  }
  if (payload.items && Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  return [payload];
}
