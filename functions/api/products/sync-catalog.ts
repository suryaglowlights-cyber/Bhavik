// Cloudflare Pages Function for Catalog Sync
// Handles POST /api/products/sync-catalog?provider=Printrove

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');

  const allowedProviders = ['Printrove', 'Qikink', 'Blinkstore', 'VendorGo', 'GlowRoad', 'Roposo'];
  if (!provider || !allowedProviders.includes(provider)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid provider specified.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    let result;

    switch (provider) {
      case 'Printrove':
        result = await syncPrintroveCatalog(env);
        break;
      case 'GlowRoad':
        result = await syncGlowroadCatalog(env);
        break;
      case 'Roposo':
        result = await syncRoposoCatalog(env);
        break;
      case 'Qikink':
      case 'Blinkstore':
      case 'VendorGo':
        result = {
          success: false,
          stats: { total: 0, saved: 0 },
          error: `${provider} catalog sync not yet implemented.`,
        };
        break;
      default:
        result = {
          success: false,
          stats: { total: 0, saved: 0 },
          error: 'Unknown provider.',
        };
    }

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider, stats: result.stats }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Catalog sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Catalog sync failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// ========================================
// Printrove Catalog Sync
// ========================================

async function syncPrintroveCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    const apiKey = env.PRINTROVE_TOKEN;
    if (!apiKey) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Printrove API key not configured',
      };
    }

    const response = await fetch('https://api.printrove.com/api/external/products', {
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
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id || item.sku;
      if (!productId) continue;

      const title = item.name || item.title || item.product_name || 'Untitled Product';
      const description = item.description || item.short_description || '';
      const retailPrice = parseFloat(item.price || item.mrp || item.selling_price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || item.availability || 'active';

      // Save to KV storage
      const cacheKey = `product:printrove:${productId}`;
      await env.CACHE?.put(cacheKey, JSON.stringify({
        id: `printrove:${productId}`,
        provider: 'Printrove',
        providerProductId: productId,
        name: title,
        description,
        price: retailPrice,
        retailPrice,
        wholesaleCost,
        images: item.images || (item.image ? [item.image] : []),
        image: item.images?.[0] || item.image || '',
        status,
      }));

      productIds.push(productId);
      saved++;
    }

    // Update product index
    await env.CACHE?.put('product:index:printrove', JSON.stringify(productIds));

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

// ========================================
// GlowRoad Catalog Sync (placeholder)
// ========================================

async function syncGlowroadCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  return {
    success: false,
    stats: { total: 0, saved: 0 },
    error: 'GlowRoad catalog sync not yet implemented in Pages Function.',
  };
}

// ========================================
// Roposo Catalog Sync (placeholder)
// ========================================

async function syncRoposoCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  return {
    success: false,
    stats: { total: 0, saved: 0 },
    error: 'Roposo catalog sync not yet implemented in Pages Function.',
  };
}

// ========================================
// Helper Functions
// ========================================

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
