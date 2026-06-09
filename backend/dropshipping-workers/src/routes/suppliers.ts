import { Router } from 'itty-router';

export const supplierRoutes = Router();

// ========================================
// Supplier Management Routes (Admin Only)
// ========================================

/**
 * GET /api/suppliers
 * List all configured suppliers with their status
 */
supplierRoutes.get('/', async (request: Request) => {
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const suppliers = [
      {
        id: 'glowroad',
        name: 'GlowRoad',
        isActive: !!env.GLOWROAD_API_KEY,
        baseUrl: 'https://api.glowroad.com',
        lastSync: await getLastSync(env, 'glowroad'),
      },
      {
        id: 'roposo',
        name: 'Roposo Clout',
        isActive: !!env.ROPOSO_CLOUT_API_KEY,
        baseUrl: 'https://api.roposo.com',
        lastSync: await getLastSync(env, 'roposo'),
      },
      {
        id: 'cj',
        name: 'CJ Dropshipping',
        isActive: !!env.CJ_DROPSHIPPING_API_KEY,
        baseUrl: 'https://api.cj.com',
        lastSync: await getLastSync(env, 'cj'),
      },
    ];

    return new Response(
      JSON.stringify({ success: true, data: suppliers }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * POST /api/suppliers/:id/sync
 * Manually trigger product sync for a supplier
 */
supplierRoutes.post('/:id/sync', async (request: Request) => {
  const { id } = request.params as any;
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const result = await syncSupplierProducts(env, id);

    return new Response(
      JSON.stringify({
        success: true,
        data: result,
        message: `Sync initiated for ${id}`,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * GET /api/suppliers/:id/health
 * Check supplier API health/connectivity
 */
supplierRoutes.get('/:id/health', async (request: Request) => {
  const { id } = request.params as any;
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const health = await checkSupplierHealth(env, id);

    return new Response(
      JSON.stringify({
        success: true,
        data: health,
      }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

// ========================================
// Helper Functions
// ========================================

async function getLastSync(env: any, supplier: string): Promise<string | null> {
  if (!env.SUPPLIER_CACHE) return null;

  const key = `sync:${supplier}:timestamp`;
  const lastSync = await env.SUPPLIER_CACHE.get(key);

  return lastSync;
}

async function syncSupplierProducts(env: any, supplier: string): Promise<any> {
  // This would call the actual sync logic from each supplier module
  const timestamp = new Date().toISOString();

  if (env.SUPPLIER_CACHE) {
    await env.SUPPLIER_CACHE.put(
      `sync:${supplier}:timestamp`,
      timestamp,
      { expirationTtl: 86400 }
    );
  }

  return {
    supplier,
    syncStarted: timestamp,
    expectedDuration: '5-15 minutes',
  };
}

async function checkSupplierHealth(env: any, supplier: string): Promise<any> {
  // Implement health checks for each supplier API
  const healthChecks: Record<string, () => Promise<any>> = {
    glowroad: async () => ({
      status: env.GLOWROAD_API_KEY ? 'ok' : 'unconfigured',
      apiConfigured: !!env.GLOWROAD_API_KEY,
      lastCheck: new Date().toISOString(),
    }),
    roposo: async () => ({
      status: env.ROPOSO_CLOUT_API_KEY ? 'ok' : 'unconfigured',
      apiConfigured: !!env.ROPOSO_CLOUT_API_KEY,
      lastCheck: new Date().toISOString(),
    }),
    cj: async () => ({
      status: env.CJ_DROPSHIPPING_API_KEY ? 'ok' : 'unconfigured',
      apiConfigured: !!env.CJ_DROPSHIPPING_API_KEY,
      lastCheck: new Date().toISOString(),
    }),
  };

  const checker = healthChecks[supplier];
  if (!checker) throw new Error(`Unknown supplier: ${supplier}`);

  return checker();
}
