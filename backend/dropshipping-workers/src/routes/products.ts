import { Router } from 'itty-router';
import { fetchGlowroadProducts } from '../suppliers/glowroad';
import { fetchRopososProducts } from '../suppliers/roposo';
import { fetchCJProducts } from '../suppliers/cj-dropshipping';
import { fetchPrintroveProducts, syncPrintroveCatalog } from '../suppliers/printrove';
import { syncGlowroadCatalog } from '../suppliers/glowroad';
import { syncRoposoCatalog } from '../suppliers/roposo';

export const productRoutes = Router();

// ========================================
// Product Routes with Margin Calculation
// ========================================

/**
 * GET /api/products/search?supplier=glowroad&category=tshirts&margin=30
 * 
 * Query parameters:
 * - supplier: 'glowroad' | 'roposo' | 'cj' | 'all'
 * - category: product category filter
 * - limit: max results (default 50)
 * - offset: pagination offset
 * - margin: profit margin percentage (default from DB config)
 * - search: search keyword
 */
productRoutes.get('/search', async (request: Request) => {
  const url = new URL(request.url);
  const supplier = url.searchParams.get('supplier') || 'all';
  const category = url.searchParams.get('category');
  const limit = parseInt(url.searchParams.get('limit') || '50', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const margin = parseFloat(url.searchParams.get('margin') || '30');
  const search = url.searchParams.get('search');
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    let products = [];

    if (supplier === 'all' || supplier === 'glowroad') {
      const gp = await fetchGlowroadProducts(env, { category, search, limit, offset });
      products = [...products, ...gp];
    }

    if (supplier === 'all' || supplier === 'roposo') {
      const rp = await fetchRopososProducts(env, { category, search, limit, offset });
      products = [...products, ...rp];
    }

    if (supplier === 'all' || supplier === 'cj') {
      const cp = await fetchCJProducts(env, { category, search, limit, offset });
      products = [...products, ...cp];
    }

    // Apply margin calculation
    products = applyMargin(products, margin);

    // Pagination slicing
    const paginated = products.slice(offset, offset + limit);

    return new Response(
      JSON.stringify({
        success: true,
        data: paginated,
        total: products.length,
        limit,
        offset,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Product search error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch products' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * POST /api/products/sync-catalog?provider=Printrove
 * Sync catalog from a provider
 */
productRoutes.post('/sync-catalog', async (request: Request) => {
  const url = new URL(request.url);
  const provider = url.searchParams.get('provider');
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  const allowedProviders = ['Printrove', 'Qikink', 'Blinkstore', 'VendorGo', 'GlowRoad', 'Roposo'];
  if (!provider || !allowedProviders.includes(provider)) {
    return new Response(
      JSON.stringify({ success: false, error: 'Invalid provider specified.' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
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
          error: `${provider} catalog sync not yet implemented in Cloudflare Worker.`,
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
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, provider, stats: result.stats }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Catalog sync error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Catalog sync failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * GET /api/products/:id
 * Get single product details
 */
productRoutes.get('/:id', async (request: Request) => {
  const { id } = request.params as any;
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    // Parse supplier and product ID from format: "supplier:productId"
    const [supplier, productId] = id.split(':');

    let product = null;

    switch (supplier) {
      case 'glowroad':
        product = await fetchGlowroadProduct(env, productId);
        break;
      case 'roposo':
        product = await fetchRopozoProduct(env, productId);
        break;
      case 'cj':
        product = await fetchCJProduct(env, productId);
        break;
    }

    if (!product) {
      return new Response(JSON.stringify({ error: 'Product not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Apply default margin
    product = applyMarginToProduct(product, 30);

    return new Response(JSON.stringify({ success: true, data: product }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

// ========================================
// Helper Functions
// ========================================

/**
 * Apply margin calculation to products
 * Supports both percentage and fixed amount margins
 */
function applyMargin(products: any[], margin: number): any[] {
  return products.map(product => applyMarginToProduct(product, margin));
}

function applyMarginToProduct(product: any, margin: number): any {
  const supplierPrice = product.price || product.cost || 0;
  
  let retailPrice: number;

  if (margin < 1) {
    // Treat as fixed amount (e.g., 50 = +$50)
    retailPrice = supplierPrice + margin;
  } else {
    // Treat as percentage (e.g., 30 = 30% markup)
    retailPrice = supplierPrice * (1 + margin / 100);
  }

  return {
    ...product,
    originalPrice: supplierPrice,
    price: Math.round(retailPrice * 100) / 100, // Round to 2 decimals
    margin,
    marginAmount: Math.round((retailPrice - supplierPrice) * 100) / 100,
  };
}

// Single product fetch functions
async function fetchGlowroadProduct(env: any, id: string): Promise<any> {
  try {
    const response = await fetch(`https://api.glowroad.com/v2/products/${id}`, {
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

    const p = await response.json();
    return {
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
    };
  } catch (error: any) {
    console.error('GlowRoad single product fetch error:', error);
    return null;
  }
}

async function fetchRopozoProduct(env: any, id: string): Promise<any> {
  try {
    const response = await fetch(`https://api.roposo.com/v2/products/${id}`, {
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

    const p = await response.json();
    return {
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
    };
  } catch (error: any) {
    console.error('Roposo single product fetch error:', error);
    return null;
  }
}

async function fetchCJProduct(env: any, id: string): Promise<any> {
  try {
    const response = await fetch(`https://api.cjdropshipping.com/v1/products/${id}`, {
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

    const p = await response.json();
    const data = p.data || p;
    return {
      id: `cj:${data.productId}`,
      supplier: 'cj',
      name: data.productName || data.title,
      price: parseFloat(data.costPrice || data.wholesale_price || 0),
      originalPrice: parseFloat(data.salePrice || data.retailPrice || 0),
      image: data.mainImage || data.thumbnail,
      images: data.productImages || [data.mainImage],
      category: data.category || 'uncategorized',
      rating: parseFloat(data.rating || 0),
      reviews: parseInt(data.reviewsCount || 0, 10),
      description: data.description,
      colors: data.colorArray || [],
      providerProductId: data.productId,
    };
  } catch (error: any) {
    console.error('CJ single product fetch error:', error);
    return null;
  }
}
