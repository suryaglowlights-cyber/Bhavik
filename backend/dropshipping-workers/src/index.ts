import { Router } from 'itty-router';
import { handleCors } from './middleware/cors';
import { validateAuth } from './middleware/auth';
import { productRoutes } from './routes/products';
import { orderRoutes } from './routes/orders';
import { supplierRoutes } from './routes/suppliers';
import { providerKeysRoutes } from './routes/provider-keys';

// ========================================
// Cloudflare Workers - Dropshipping API
// ========================================

interface Env {
  DB: D1Database;
  SUPPLIER_CACHE: KVNamespace;
  API_KEYS_KV: KVNamespace;
  GLOWROAD_API_KEY: string;
  GLOWROAD_API_SECRET: string;
  ROPOSO_CLOUT_API_KEY: string;
  CJ_DROPSHIPPING_API_KEY: string;
  PRINTROVE_TOKEN: string;
  JWT_SECRET: string;
  ALLOWED_ORIGINS: string;
}

const router = Router();

// Apply CORS middleware to all routes
router.all('*', handleCors);

// Health check endpoint (no auth required)
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

// API Routes
router.all('/api/products/*', productRoutes);
router.all('/api/orders/*', orderRoutes);
router.all('/api/suppliers/*', validateAuth, supplierRoutes);
router.all('/api/provider-keys', providerKeysRoutes);

// 404 handler
router.all('*', () => {
  return new Response(JSON.stringify({ error: 'Not Found' }), {
    status: 404,
    headers: { 'Content-Type': 'application/json' },
  });
});

export default {
  fetch: async (request: Request, env: Env, ctx: ExecutionContext) => {
    // Inject env into request context
    (request as any).env = env;
    (request as any).ctx = ctx;
    return router.handle(request);
  },

  scheduled: async (event: ScheduledEvent, env: Env, ctx: ExecutionContext) => {
    // Scheduled cron job - sync products every 4 hours
    console.log('Running scheduled product sync...');
    await syncAllSuppliers(env);
  },
};

// Helper: Sync products from all suppliers
async function syncAllSuppliers(env: Env): Promise<void> {
  const suppliers = ['glowroad', 'roposo', 'cj'];
  
  for (const supplier of suppliers) {
    try {
      console.log(`Syncing products from ${supplier}...`);
      // This will be called from product route handlers
      // Store sync status in KV for monitoring
      await env.SUPPLIER_CACHE.put(
        `sync:${supplier}:timestamp`,
        new Date().toISOString(),
        { expirationTtl: 86400 } // 24 hours
      );
    } catch (error) {
      console.error(`Failed to sync ${supplier}:`, error);
    }
  }
}
