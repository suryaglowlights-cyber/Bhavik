// Cloudflare Pages Function for Loading Products
// Handles GET /api/products.php

export async function onRequestGet(context: { env: any }) {
  const { env } = context;

  try {
    const products: any[] = [];

    // Load product index for each provider
    const providers = ['printrove', 'glowroad', 'roposo', 'qikink', 'blinkstore', 'vendorgo'];

    for (const provider of providers) {
      const indexKey = `product:index:${provider}`;
      const indexData = await env.BHAVIK_STORE?.get(indexKey, 'json');

      if (indexData && Array.isArray(indexData)) {
        for (const productId of indexData) {
          const productKey = `product:${provider}:${productId}`;
          const productData = await env.BHAVIK_STORE?.get(productKey, 'json');

          if (productData) {
            products.push(productData);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ products }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error loading products:', error);
    return new Response(
      JSON.stringify({ products: [], error: error.message }),
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
