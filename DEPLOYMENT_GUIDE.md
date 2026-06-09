# Dropshipping Integration - Quick Deployment Guide

## Overview

Your dropshipping integration layer is **already fully implemented**. This guide will help you deploy it to Cloudflare and get it running in production.

## What's Already Built

✅ **Dynamic Product Sync** - Fetches products from GlowRoad, Roposo Clout, and CJ Dropshipping  
✅ **Margin Calculator** - Automatic profit margin calculation (percentage or fixed)  
✅ **Automated Order Routing** - Routes orders to correct suppliers automatically  
✅ **Cloudflare Compatibility** - Configured for Cloudflare Workers with KV caching  
✅ **CORS Handling** - Secure cross-origin request management  
✅ **Authentication** - JWT-based auth for admin endpoints  
✅ **Scheduled Syncs** - Auto-syncs products every 4 hours  

---

## Step 1: Get Supplier API Credentials (15 minutes)

### GlowRoad
1. Visit https://www.glowroad.com/seller/dashboard
2. Go to **Settings** → **API Keys**
3. Generate API Key and Secret
4. Save these values

### Roposo Clout
1. Visit https://clout.roposo.com
2. Go to **Seller Settings** → **API Credentials**
3. Get API Key and Seller ID
4. Save these values

### CJ Dropshipping
1. Visit https://www.cjdropshipping.com/
2. Go to **Seller Center** → **Settings** → **API**
3. Generate API Key and Access Token
4. Save these values

---

## Step 2: Set Up Cloudflare Account (5 minutes)

1. Visit https://dash.cloudflare.com and sign up/login
2. Get your **Account ID**:
   - Go to **Workers & Pages** → Right sidebar shows Account ID
3. Get your **Zone ID** (if you have a domain):
   - Go to your domain → Right sidebar shows Zone ID

---

## Step 3: Install Wrangler CLI (2 minutes)

```bash
npm install -g @cloudflare/wrangler
```

Authenticate:

```bash
wrangler login
```

This will open a browser window for authentication.

---

## Step 4: Configure Backend Environment (10 minutes)

Navigate to the workers directory:

```bash
cd backend/dropshipping-workers
```

Create environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# GlowRoad
GLOWROAD_API_KEY=your_actual_glowroad_api_key
GLOWROAD_API_SECRET=your_actual_glowroad_api_secret

# Roposo Clout
ROPOSO_CLOUT_API_KEY=your_actual_roposo_api_key
ROPOSO_CLOUT_SELLER_ID=your_actual_roposo_seller_id

# CJ Dropshipping
CJ_DROPSHIPPING_API_KEY=your_actual_cj_api_key
CJ_DROPSHIPPING_ACCESS_TOKEN=your_actual_cj_access_token

# Security
JWT_SECRET=generate_a_random_secret_string_here
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173
```

---

## Step 5: Create Cloudflare Resources (5 minutes)

### Create D1 Database

```bash
wrangler d1 create bhavik-dropshipping
```

Copy the returned `database_id` and update `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "bhavik-dropshipping"
database_id = "paste_database_id_here"
```

### Create KV Namespaces

```bash
wrangler kv:namespace create "SUPPLIER_CACHE"
wrangler kv:namespace create "SUPPLIER_CACHE" --preview
wrangler kv:namespace create "API_KEYS_KV"
wrangler kv:namespace create "API_KEYS_KV" --preview
```

Copy the returned namespace IDs and update `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SUPPLIER_CACHE"
id = "paste_namespace_id_here"

[[kv_namespaces]]
binding = "API_KEYS_KV"
id = "paste_namespace_id_here"

[env.production.kv_namespaces]
binding = "SUPPLIER_CACHE"
id = "paste_preview_namespace_id_here"

[env.production.kv_namespaces]
binding = "API_KEYS_KV"
id = "paste_preview_namespace_id_here"
```

---

## Step 6: Update wrangler.toml (3 minutes)

Edit `backend/dropshipping-workers/wrangler.toml`:

```toml
account_id = "your_cloudflare_account_id"  # From wrangler whoami
route = "api.yourdomain.com/*"  # Your actual API subdomain
zone_id = "your_zone_id"  # From Cloudflare dashboard
```

---

## Step 7: Deploy Backend (5 minutes)

### Development/Testing

```bash
cd backend/dropshipping-workers
wrangler dev
```

This starts a local dev server at `http://localhost:8787`

### Production Deployment

```bash
wrangler deploy --env production
```

You'll get a URL like: `https://bhavik-dropshipping-api.your-account.workers.dev`

**Save this URL** - you'll need it for the frontend configuration.

---

## Step 8: Configure Frontend (5 minutes)

Navigate to project root:

```bash
cd ../..
```

Create frontend environment file:

```bash
cp .env.example.dropshipping .env.local
```

Edit `.env.local`:

```env
# Backend URL from Step 7
VITE_BACKEND_URL=https://bhavik-dropshipping-api.your-account.workers.dev/api

# For local development (use when testing locally)
VITE_DEV_BACKEND_URL=http://localhost:8787/api

# Default margin percentage
VITE_DEFAULT_MARGIN_PERCENTAGE=30

# Supplier status (for UI visibility)
VITE_GLOWROAD_ENABLED=true
VITE_ROPOSO_ENABLED=true
VITE_CJ_ENABLED=true
```

---

## Step 9: Test the Integration (10 minutes)

### Test Product Sync

```bash
curl -X GET "http://localhost:8787/api/products/search?supplier=glowroad&limit=5"
```

Expected response:
```json
{
  "success": true,
  "data": [...],
  "total": 5,
  "limit": 5,
  "offset": 0
}
```

### Test Order Submission

```bash
curl -X POST http://localhost:8787/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "glowroad:123", "supplier": "glowroad", "quantity": 1}],
    "shipping": {
      "fullName": "Test User",
      "email": "test@example.com",
      "phone": "+91-9876543210",
      "address": "123 Test St",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001",
      "country": "IN"
    },
    "paymentMethod": "COD",
    "referenceOrderId": "TEST-1234567890"
  }'
```

### Test Health Check

```bash
curl http://localhost:8787/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Step 10: Deploy Frontend to Cloudflare Pages (5 minutes)

### Option A: Git Integration (Recommended)

1. Push your code to GitHub
2. In Cloudflare Dashboard:
   - Go to **Workers & Pages** → **Create Application** → **Pages**
   - Connect to your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
3. Deploy

### Option B: Manual Deployment

```bash
# Build frontend
npm run build

# Deploy to Cloudflare Pages
npx wrangler pages deploy dist \
  --project-name bhavik-ecommerce \
  --branch main
```

---

## CORS Configuration

The backend automatically handles CORS. Ensure your `ALLOWED_ORIGINS` in `.env` includes:

```env
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173
```

If you encounter CORS errors:

1. Check browser console for the exact origin
2. Add it to `ALLOWED_ORIGINS`
3. Redeploy Workers: `wrangler deploy --env production`

---

## API Keys Security

**API keys are NEVER exposed to the frontend.** They are stored securely in Cloudflare Workers environment variables.

To update API keys after deployment:

```bash
cd backend/dropshipping-workers

# Update individual secrets
wrangler secret put GLOWROAD_API_KEY --env production
wrangler secret put GLOWROAD_API_SECRET --env production
wrangler secret put ROPOSO_CLOUT_API_KEY --env production
wrangler secret put ROPOSO_CLOUT_SELLER_ID --env production
wrangler secret put CJ_DROPSHIPPING_API_KEY --env production
wrangler secret put CJ_DROPSHIPPING_ACCESS_TOKEN --env production

# Redeploy
wrangler deploy --env production
```

---

## Monitoring and Logs

### View Worker Logs

```bash
wrangler tail --env production
```

This shows real-time logs from your deployed Workers.

### Check Supplier Health

```bash
curl https://api.yourdomain.com/api/suppliers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Troubleshooting

### Products Not Showing

**Problem**: Empty product list

**Solution**:
1. Verify API credentials in `.env`
2. Check Worker logs: `wrangler tail`
3. Test supplier API directly with curl
4. Ensure KV namespaces are created

### Orders Not Submitting

**Problem**: Order submission fails

**Solution**:
1. Validate order payload format
2. Check shipping address format
3. Verify supplier API credentials
4. Check Worker logs for specific errors

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solution**:
1. Check `ALLOWED_ORIGINS` in Workers env
2. Ensure your frontend domain is included
3. Redeploy Workers after changes

### Slow Performance

**Problem**: Products take too long to load

**Solution**:
1. Check KV cache is working (should hit cache on second request)
2. Reduce product limit: `?limit=20`
3. Enable longer cache TTL in supplier files

---

## Production Checklist

Before going live:

- [ ] All supplier API credentials configured
- [ ] Cloudflare Workers deployed to production
- [ ] Frontend deployed to Cloudflare Pages
- [ ] HTTPS enabled on all endpoints
- [ ] CORS properly configured for your domain
- [ ] API keys stored in Cloudflare secrets (not in code)
- [ ] KV namespaces created and configured
- [ ] D1 database created
- [ ] Tested product sync with each supplier
- [ ] Tested order submission with each supplier
- [ ] Error monitoring set up (Cloudflare Analytics)
- [ ] JWT secret configured
- [ ] Scheduled syncs configured (every 4 hours)

---

## API Endpoints Reference

### Product Operations

```
GET  /api/products/search?supplier=glowroad&category=tshirts&margin=30
GET  /api/products/glowroad:12345?margin=30
```

### Order Operations

```
POST /api/orders/create
GET  /api/orders/GR-12345/status?supplier=glowroad
```

### Admin Operations (requires JWT)

```
GET  /api/suppliers
POST /api/suppliers/glowroad/sync
GET  /api/suppliers/glowroad/health
```

### System Health

```
GET  /health
```

---

## Next Steps

1. **Today**: Complete Steps 1-8 (backend setup and testing)
2. **Tomorrow**: Deploy frontend (Step 9-10)
3. **Day 3**: Run end-to-end tests with real orders
4. **Day 4**: Monitor performance and optimize
5. **Day 5**: Set up analytics and alerts

---

## Support

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **GlowRoad API Docs**: https://docs.glowroad.com/api/
- **Roposo Clout API Docs**: https://clout.roposo.com/developer/
- **CJ Dropshipping API Docs**: https://api.cjdropshipping.com/docs/

---

## Emergency Contacts

- **Cloudflare Support**: https://support.cloudflare.com
- **GlowRoad Support**: support@glowroad.com
- **Roposo Support**: support@roposo.com
- **CJ Dropshipping**: support@cjdropshipping.com

---

**You're ready to deploy! Start with Step 1 above.** 🚀
