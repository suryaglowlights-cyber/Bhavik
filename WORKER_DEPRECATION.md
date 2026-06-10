# Worker Deprecation Notice

## ⚠️ Separate Worker Deprecation

The separate Cloudflare Worker `bhavik-dropshipping-api` is now **DEPRECATED**. All API functionality has been migrated to Cloudflare Pages Functions within the main Pages project.

### What Changed

All API routes that were previously handled by the separate worker are now handled by Pages Functions in the `/functions/` directory:

| Previous Worker Route | New Pages Function | Location |
|---------------------|-------------------|----------|
| `/api/provider-keys` | `GET/POST /api/keys` | `functions/api/keys.ts` |
| `/api/products/*` | `GET /api/products.php` | `functions/api/products.php.ts` |
| `/api/products/sync-catalog` | `POST /api/products/sync-catalog` | `functions/api/products/sync-catalog.ts` |
| `/api/orders/*` | `POST/GET /api/orders` | `functions/api/orders.ts` |
| `/api/inventory` | `POST/PATCH/GET /api/inventory` | `functions/api/inventory.ts` |
| `/api/sync-status` | `GET /api/sync-status` | `functions/api/sync-status.ts` |

### Migration Benefits

1. **Simplified Architecture**: Single deployment instead of managing separate worker
2. **Unified Storage**: All data now stored in Cloudflare KV namespace `BHAVIK_STORE`
3. **Better Performance**: Reduced latency with co-located functions
4. **Easier Maintenance**: Single codebase for both frontend and backend
5. **Cost Efficiency**: No separate worker billing

### Storage Changes

- **Before**: Used separate KV namespaces (`SUPPLIER_CACHE`, `API_KEYS_KV`)
- **After**: Single unified KV namespace `BHAVIK_STORE` for all data:
  - API keys: `provider_keys`
  - Products: `product:{provider}:{productId}`
  - Product indexes: `product:index:{provider}`
  - Inventory: `inventory_products`
  - Sync status: `last_sync_timestamp`
  - Orders: `order:{referenceOrderId}:{supplier}`

### Action Required

1. **Delete the separate worker** from your Cloudflare dashboard:
   - Go to Workers & Pages
   - Find `bhavik-dropshipping-api`
   - Delete it

2. **Update any external integrations** that reference the worker URL to use the Pages Functions URL instead:
   - Old: `https://bhavik-dropshipping-api.YOUR_SUBDOMAIN.workers.dev`
   - New: `https://bhavik.pages.dev/api/...`

3. **Verify environment variables** are set in Cloudflare Pages dashboard:
   - `PRINTROVE_TOKEN`
   - `GLOWROAD_API_KEY`
   - `GLOWROAD_API_SECRET`
   - `ROPOSO_CLOUT_API_KEY`
   - `ROPOSO_CLOUT_SELLER_ID`
   - (Any other provider-specific keys)

### Backend Directory

The `backend/dropshipping-workers/` directory is kept for reference but is no longer used in production. You may safely delete it after confirming the Pages Functions are working correctly.

### Testing Checklist

- [ ] API keys can be saved and retrieved from `/api/keys`
- [ ] Catalog sync works for all providers via `/api/products/sync-catalog`
- [ ] Products load correctly from `/api/products.php`
- [ ] Orders can be created via `/api/orders`
- [ ] Inventory management works via `/api/inventory`
- [ ] Site status check works in admin dashboard
- [ ] Cloud Storage indicator shows "Connected" in admin header

### Rollback Plan

If you need to revert to the separate worker:

1. Redeploy the worker from `backend/dropshipping-workers/`
2. Update frontend API calls back to worker URLs
3. Restore environment variables in worker settings

However, this is not recommended as the Pages Functions implementation is the new standard.

---

**Date**: June 10, 2026  
**Version**: 2.0 (Pages Functions Migration)
