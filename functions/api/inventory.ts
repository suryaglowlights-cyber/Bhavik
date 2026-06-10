// Cloudflare Pages Function for Inventory Management
// Handles POST, PATCH, GET /api/inventory

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
  imageUrl: string;
  isLive: boolean;
}

export async function onRequestGet(context: { env: any }) {
  const { env } = context;

  try {
    const productsData = await env.BHAVIK_STORE?.get('inventory_products', 'json');
    
    if (productsData && Array.isArray(productsData)) {
      return new Response(
        JSON.stringify({ products: productsData }),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify({ products: [] }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching inventory:', error);
    return new Response(
      JSON.stringify({ products: [], error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const product: Product = await request.json();
    
    // Get existing products
    const productsData = await env.BHAVIK_STORE?.get('inventory_products', 'json');
    const products = productsData && Array.isArray(productsData) ? productsData : [];
    
    // Add new product
    products.push(product);
    
    // Save to KV
    await env.BHAVIK_STORE?.put('inventory_products', JSON.stringify(products));

    return new Response(
      JSON.stringify({ success: true, product }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error adding product:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestPatch(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { id, isLive } = body;
    
    // Get existing products
    const productsData = await env.BHAVIK_STORE?.get('inventory_products', 'json');
    const products = productsData && Array.isArray(productsData) ? productsData : [];
    
    // Update product
    const updatedProducts = products.map((p: Product) =>
      p.id === id ? { ...p, isLive } : p
    );
    
    // Save to KV
    await env.BHAVIK_STORE?.put('inventory_products', JSON.stringify(updatedProducts));

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error updating product:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
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
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
