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
        result = await syncQikinkCatalog(env);
        break;
      case 'Blinkstore':
        result = await syncBlinkstoreCatalog(env);
        break;
      case 'VendorGo':
        result = await syncVendorGoCatalog(env);
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
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
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
    await env.BHAVIK_STORE?.put('product:index:printrove', JSON.stringify(productIds));

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
// GlowRoad Catalog Sync
// ========================================

async function syncGlowroadCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    const apiKey = env.GLOWROAD_API_KEY;
    const apiSecret = env.GLOWROAD_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'GlowRoad API keys not configured',
      };
    }

    const response = await fetch('https://api.glowroad.com/v2/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Client-Id': apiSecret,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`GlowRoad API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id;
      if (!productId) continue;

      const title = item.title || item.name || 'Untitled Product';
      const description = item.description || '';
      const retailPrice = parseFloat(item.price || item.mrp || 0);
      const wholesaleCost = parseFloat(item.wholesale_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || 'active';

      // Save to KV storage
      const cacheKey = `product:glowroad:${productId}`;
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
        id: `glowroad:${productId}`,
        provider: 'GlowRoad',
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
    await env.BHAVIK_STORE?.put('product:index:glowroad', JSON.stringify(productIds));

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('GlowRoad catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
}

// ========================================
// Roposo Catalog Sync
// ========================================

async function syncRoposoCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    const apiKey = env.ROPOSO_CLOUT_API_KEY;
    const sellerId = env.ROPOSO_CLOUT_SELLER_ID;
    
    if (!apiKey || !sellerId) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Roposo API keys not configured',
      };
    }

    const response = await fetch('https://api.roposo.com/v2/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Seller-Id': sellerId,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Roposo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id;
      if (!productId) continue;

      const title = item.name || item.title || 'Untitled Product';
      const description = item.description || '';
      const retailPrice = parseFloat(item.price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.wholesale_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || 'active';

      // Save to KV storage
      const cacheKey = `product:roposo:${productId}`;
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
        id: `roposo:${productId}`,
        provider: 'Roposo',
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
    await env.BHAVIK_STORE?.put('product:index:roposo', JSON.stringify(productIds));

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('Roposo catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
}

// ========================================
// Qikink Catalog Sync
// ========================================

async function syncQikinkCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    // Get API keys from KV storage
    const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
    if (!keysData) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Qikink API keys not configured in provider keys',
      };
    }

    const keys = JSON.parse(keysData);
    const { clientId, accessToken } = keys.qikink || {};
    
    if (!clientId || !accessToken) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Qikink clientId and accessToken required',
      };
    }

    const response = await fetch('https://api.qikink.com/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Client-Id': clientId,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Qikink API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id || item.sku;
      if (!productId) continue;

      const title = item.name || item.title || 'Untitled Product';
      const description = item.description || '';
      const retailPrice = parseFloat(item.price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || 'active';

      // Save to KV storage
      const cacheKey = `product:qikink:${productId}`;
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
        id: `qikink:${productId}`,
        provider: 'Qikink',
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
    await env.BHAVIK_STORE?.put('product:index:qikink', JSON.stringify(productIds));

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('Qikink catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
}

// ========================================
// Blinkstore Catalog Sync
// ========================================

async function syncBlinkstoreCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    // Get API keys from KV storage
    const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
    if (!keysData) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Blinkstore API keys not configured in provider keys',
      };
    }

    const keys = JSON.parse(keysData);
    const { apiKey, secretKey } = keys.blinkstore || {};
    
    if (!apiKey || !secretKey) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'Blinkstore apiKey and secretKey required',
      };
    }

    const response = await fetch('https://api.blinkstore.com/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Secret-Key': secretKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Blinkstore API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id || item.sku;
      if (!productId) continue;

      const title = item.name || item.title || 'Untitled Product';
      const description = item.description || '';
      const retailPrice = parseFloat(item.price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || 'active';

      // Save to KV storage
      const cacheKey = `product:blinkstore:${productId}`;
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
        id: `blinkstore:${productId}`,
        provider: 'Blinkstore',
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
    await env.BHAVIK_STORE?.put('product:index:blinkstore', JSON.stringify(productIds));

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('Blinkstore catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
}

// ========================================
// VendorGo Catalog Sync
// ========================================

async function syncVendorGoCatalog(env: any): Promise<{
  success: boolean;
  stats: { total: number; saved: number };
  error?: string;
}> {
  try {
    // Get API keys from KV storage
    const keysData = await env.BHAVIK_STORE?.get('provider_keys', 'text');
    if (!keysData) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'VendorGo API keys not configured in provider keys',
      };
    }

    const keys = JSON.parse(keysData);
    const { apiKey, secretKey } = keys.vendorgo || {};
    
    if (!apiKey || !secretKey) {
      return {
        success: false,
        stats: { total: 0, saved: 0 },
        error: 'VendorGo apiKey and secretKey required',
      };
    }

    const response = await fetch('https://api.vendorgo.com/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Secret-Key': secretKey,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`VendorGo API error: ${response.statusText}`);
    }

    const data = await response.json();
    const items = extractProductBlocks(data);

    let saved = 0;
    const productIds: string[] = [];

    for (const item of items) {
      const productId = item.id || item.product_id || item.sku;
      if (!productId) continue;

      const title = item.name || item.title || 'Untitled Product';
      const description = item.description || '';
      const retailPrice = parseFloat(item.price || 0);
      const wholesaleCost = parseFloat(item.cost_price || item.price || 0);
      const images = JSON.stringify(item.images || (item.image ? [item.image] : []));
      const status = item.status || 'active';

      // Save to KV storage
      const cacheKey = `product:vendorgo:${productId}`;
      await env.BHAVIK_STORE?.put(cacheKey, JSON.stringify({
        id: `vendorgo:${productId}`,
        provider: 'VendorGo',
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
    await env.BHAVIK_STORE?.put('product:index:vendorgo', JSON.stringify(productIds));

    return {
      success: true,
      stats: { total: items.length, saved },
    };
  } catch (error: any) {
    console.error('VendorGo catalog sync error:', error);
    return {
      success: false,
      stats: { total: 0, saved: 0 },
      error: error.message,
    };
  }
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
