# Dropshipping Integration - Complete Setup Guide

## Overview

This guide covers setting up a complete dropshipping integration layer for your Bhavik e-commerce platform hosted on Cloudflare. The architecture includes:

- **Cloudflare Workers**: Secure serverless backend that handles API key management
- **Frontend API Layer**: TypeScript/React integration
- **Margin Calculator**: Automated profit margin calculations
- **Order Routing**: Automatic order distribution to suppliers
- **Multi-Supplier Support**: GlowRoad, Roposo Clout, CJ Dropshipping

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│           Your e-commerce Frontend (React)          │
│        (Deployed on Cloudflare Pages)               │
│  - Product Search & Display                         │
│  - Shopping Cart                                     │
│  - Checkout Flow                                     │
└──────────────────────┬──────────────────────────────┘
                       │
                       │ HTTPS
                       │ (API calls)
                       ▼
┌─────────────────────────────────────────────────────┐
│      Cloudflare Workers (Secure Backend)            │
│                                                      │
│  ✓ API Key Management (Never exposed to frontend)   │
│  ✓ Request Validation & CORS handling              │
│  ✓ Product sync & caching (KV Storage)             │
│  ✓ Order routing & submission                       │
│  ✓ Scheduled syncs (Cron)                          │
└──────────────────┬──────────────────────────────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
 ┌─────────┐  ┌─────────┐  ┌─────────┐
 │GlowRoad │  │ Roposo  │  │    CJ   │
 │  APIs   │  │Clout    │  │Dropship │
 │         │  │ APIs    │  │  APIs   │
 └─────────┘  └─────────┘  └─────────┘
```

---

## Step 1: Set up Cloudflare Workers Backend

### 1.1 Install Wrangler CLI

```bash
npm install -g @cloudflare/wrangler
# or
npm install -g wrangler
```

### 1.2 Create Cloudflare Account & Get Credentials

1. Visit https://dash.cloudflare.com
2. Sign up or log in
3. Go to **Account Settings** → **API Tokens**
4. Create token with "Edit Cloudflare Workers" permission
5. Create token with "Edit KV Storage" permission

### 1.3 Authenticate Wrangler

```bash
cd backend/dropshipping-workers
wrangler login
```

Follow the authentication flow.

### 1.4 Set Environment Variables

Create `.env` file in `backend/dropshipping-workers/`:

```bash
# Copy from .env.example
cp .env.example .env

# Edit with your credentials
nano .env
```

Fill in your supplier API credentials:
- **GlowRoad**: Get from your GlowRoad merchant dashboard
- **Roposo Clout**: Get from Roposo seller portal
- **CJ Dropshipping**: Get from CJ platform settings

### 1.5 Configure wrangler.toml

Edit `backend/dropshipping-workers/wrangler.toml`:

```toml
# Set your Cloudflare account ID
account_id = "your_account_id"

# Set your domain
route = "api.yourdomain.com/*"  # or custom subdomain
zone_id = "your_zone_id"

# Set environment variables
[env.production]
routes = [{ pattern = "api.yourdomain.com/*", zone_id = "your_zone_id" }]

# Replace with your actual credentials
[vars]
JWT_SECRET = "your_jwt_secret_here"
ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173"
```

Find `account_id` and `zone_id`:
```bash
wrangler whoami  # Shows account_id
# zone_id from Cloudflare dashboard → your domain → bottom right
```

### 1.6 Create KV Namespaces

```bash
cd backend/dropshipping-workers

# Create cache namespace
wrangler kv:namespace create "SUPPLIER_CACHE"
wrangler kv:namespace create "SUPPLIER_CACHE" --preview

# Create API keys namespace
wrangler kv:namespace create "API_KEYS_KV"
wrangler kv:namespace create "API_KEYS_KV" --preview
```

Copy the returned namespace IDs into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "SUPPLIER_CACHE"
id = "your_namespace_id_here"

[env.production.kv_namespaces]
binding = "SUPPLIER_CACHE"
id = "your_namespace_id_production"
```

### 1.7 Deploy Workers

```bash
# Development/preview
wrangler dev

# Production deployment
wrangler deploy --env production
```

After deployment, you'll get a URL like: `https://bhavik-dropshipping-api.your-account.workers.dev`

---

## Step 2: Configure Frontend Environment

### 2.1 Create Frontend .env

```bash
cd ../../  # Back to root

cp .env.example.dropshipping .env.local
```

Edit `.env.local`:

```env
# Backend URL (from Step 1.7)
VITE_BACKEND_URL=https://bhavik-dropshipping-api.your-account.workers.dev/api

# For local development
VITE_DEV_BACKEND_URL=http://localhost:8787/api

# Margin settings
VITE_DEFAULT_MARGIN_PERCENTAGE=30
```

### 2.2 Update package.json if needed

Ensure you have required dependencies:

```bash
npm install
```

---

## Step 3: Update Frontend Components

### 3.1 Update Checkout Component

Replace the checkout flow to use the new dropshipping API:

**File**: `src/components/CheckoutDrawer.tsx`

```typescript
import { submitDropshipperOrder } from '../lib/dropshippingApi';

export default function CheckoutDrawer({ ... }) {
  const handleSubmitOrder = async () => {
    try {
      setSubmitting(true);
      
      const payload = {
        items: items.map(item => ({
          productId: item.id,
          supplier: item.provider.toLowerCase(),
          quantity: item.qty,
        })),
        shipping: form,
        paymentMethod: form.paymentMethod as 'COD' | 'PREPAID' | 'WALLET',
        referenceOrderId: `ORD-${Date.now()}`,
      };

      const result = await submitDropshipperOrder(payload);
      
      if (result.success) {
        onSuccess(result.referenceOrderId, form.paymentMethod);
        // Track order IDs for customer
        localStorage.setItem(`order:${result.referenceOrderId}`, JSON.stringify(result));
      } else {
        setError('Failed to submit order. Some suppliers may have issues.');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };
  
  // ... rest of component
}
```

### 3.2 Add Margin Calculator to Product Display

**File**: `src/components/ProductCard.tsx`

```typescript
import { calculateRetailPrice, getMarginConfig } from '../utils/marginCalculator';

export default function ProductCard({ product }: Props) {
  const marginConfig = getMarginConfig();
  const retailPrice = calculateRetailPrice(product.price, marginConfig);
  
  return (
    <div>
      <h3>{product.name}</h3>
      <p>₹{product.price.toFixed(2)} (supplier cost)</p>
      <p className="font-bold text-lg">₹{retailPrice.toFixed(2)} (your price)</p>
      <p className="text-sm text-gray-500">
        Margin: +₹{(retailPrice - product.price).toFixed(2)}
      </p>
      {/* ... rest of card */}
    </div>
  );
}
```

### 3.3 Create Admin Panel for Margin Management

**File**: `src/components/admin/MarginSettings.tsx`

```typescript
import { useState } from 'react';
import { getMarginConfig, saveMarginConfig, MarginConfig } from '../../utils/marginCalculator';

export default function MarginSettings() {
  const [config, setConfig] = useState<MarginConfig>(() => getMarginConfig());

  const handleSave = () => {
    saveMarginConfig(config);
    alert('Margin configuration saved!');
  };

  return (
    <div className="p-6 bg-white rounded-lg border">
      <h2>Profit Margin Settings</h2>
      
      <div>
        <label>Margin Type:</label>
        <select
          value={config.type}
          onChange={(e) => setConfig({ ...config, type: e.target.value as 'percentage' | 'fixed' })}
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </select>
      </div>

      <div>
        <label>Margin Value:</label>
        <input
          type="number"
          value={config.value}
          onChange={(e) => setConfig({ ...config, value: parseFloat(e.target.value) })}
        />
        {config.type === 'percentage' ? '%' : '₹'}
      </div>

      <button onClick={handleSave}>Save Configuration</button>
    </div>
  );
}
```

---

## Step 4: Get Supplier API Credentials

### GlowRoad

1. Visit https://www.glowroad.com/seller/dashboard
2. Go to **Settings** → **API Keys**
3. Generate new API key
4. Copy to `.env`:
   ```env
   GLOWROAD_API_KEY=your_key
   GLOWROAD_API_SECRET=your_secret
   ```

### Roposo Clout

1. Visit https://clout.roposo.com
2. Go to **Seller Settings** → **API Credentials**
3. Copy credentials to `.env`:
   ```env
   ROPOSO_CLOUT_API_KEY=your_key
   ROPOSO_CLOUT_SELLER_ID=your_id
   ```

### CJ Dropshipping

1. Visit https://www.cjdropshipping.com/
2. Go to **Seller Center** → **Settings** → **API**
3. Generate API credentials
4. Copy to `.env`:
   ```env
   CJ_DROPSHIPPING_API_KEY=your_key
   CJ_DROPSHIPPING_ACCESS_TOKEN=your_token
   ```

---

## Step 5: Handle CORS and Deployment to Cloudflare

### 5.1 Update Cloudflare Pages Configuration

Create `wrangler.toml` in root (or update your build configuration):

```toml
[build]
command = "npm run build"

[env.production]
routes = [
  { pattern = "yourdomain.com/*", zone_id = "your_zone_id" },
]

# Workers prefix for API routes
[[env.production.services]]
binding = "DROPSHIPPING_API"
service = "bhavik-dropshipping-api"
environment = "production"
```

### 5.2 CORS Configuration

The Cloudflare Workers backend automatically handles CORS. Ensure your `ALLOWED_ORIGINS` in `wrangler.toml` includes:

```toml
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
```

### 5.3 Deploy Frontend to Cloudflare Pages

```bash
# Build frontend
npm run build

# Connect to Cloudflare Pages
npx wrangler pages deploy dist \
  --project-name bhavik-ecommerce \
  --branch main
```

Or use Git integration:
1. Push to GitHub
2. Connect in Cloudflare Pages dashboard
3. Auto-deploy on push

---

## Step 6: Security Best Practices

### 6.1 API Key Rotation

```bash
# Rotate keys regularly (monthly recommended)
# 1. Generate new keys in each supplier's dashboard
# 2. Update in Cloudflare Workers secrets:
wrangler secret put GLOWROAD_API_KEY --env production

# 3. Redeploy
wrangler deploy --env production
```

### 6.2 Enable HTTPS Only

In Cloudflare Dashboard:
- **SSL/TLS** → Set to "Full" or "Full (strict)"
- **Security** → **HTTPS Redirect**: Enable
- **Security** → **Always Use HTTPS**: Enable

### 6.3 Rate Limiting

Add to `wrangler.toml`:

```toml
[[routes]]
pattern = "api.yourdomain.com/api/orders/*"
zone_name = "yourdomain.com"
custom_domain = true

[rate_limit]
limit = 100  # requests
period = 60  # per 60 seconds
```

### 6.4 Monitor Requests

Use Cloudflare Analytics:
1. Dashboard → Analytics
2. Monitor Workers performance
3. Check error rates
4. Review API usage

---

## Step 7: Testing

### 7.1 Local Development

```bash
# Terminal 1: Start Workers local dev
cd backend/dropshipping-workers
wrangler dev

# Terminal 2: Start Frontend dev
cd ../../
npm run dev
```

Visit `http://localhost:5173`

### 7.2 Test Product Sync

```bash
curl -X GET http://localhost:8787/api/products/search?supplier=glowroad&limit=5

# Should return products with margin calculated
```

### 7.3 Test Order Submission

```bash
curl -X POST http://localhost:8787/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"productId": "glowroad:123", "supplier": "glowroad", "quantity": 1}],
    "shipping": {
      "fullName": "John Doe",
      "email": "john@example.com",
      "phone": "+91-9876543210",
      "address": "123 Main St",
      "city": "Mumbai",
      "state": "MH",
      "pincode": "400001",
      "country": "IN"
    },
    "paymentMethod": "COD",
    "referenceOrderId": "ORD-1234567890"
  }'
```

### 7.4 Monitor in Production

```bash
# Check worker logs
wrangler tail --env production

# View requests and errors in real-time
```

---

## Step 8: Troubleshooting

### CORS Errors

**Problem**: `Access-Control-Allow-Origin` errors

**Solution**:
1. Check `ALLOWED_ORIGINS` in Cloudflare Workers env
2. Ensure your frontend domain is included
3. Check browser console for exact error origin

```toml
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com,http://localhost:5173"
```

### Products Not Showing

**Problem**: Empty product list

**Solution**:
1. Verify API credentials in `wrangler.toml`
2. Check Cloudflare Workers logs: `wrangler tail`
3. Test supplier API directly:
   ```bash
   curl -X GET https://api.glowroad.com/v2/products \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

### Orders Not Submitting

**Problem**: Order submission fails

**Solution**:
1. Check order validation: `referenceOrderId`, `shipping.fullName`, etc.
2. Verify supplier API credentials
3. Check Cloudflare Workers logs for API errors
4. Ensure shipping address format matches supplier requirements

### Slow Product Loading

**Problem**: Products take too long to load

**Solution**:
1. Check KV cache hit rate in Cloudflare dashboard
2. Reduce product limit: `?limit=20` instead of `?limit=100`
3. Enable product caching in frontend:
   ```typescript
   const CACHE_DURATION = 1800000; // 30 minutes
   ```

---

## Step 9: Monitoring & Analytics

### 9.1 Set up Alerts

In Cloudflare Dashboard:
1. **Notifications** → **Create Notification**
2. Choose trigger: Worker Errors, High Error Rate, etc.
3. Set alert threshold (e.g., >5% errors)

### 9.2 Track Order Metrics

Add tracking to checkout:

```typescript
import { submitDropshipperOrder } from '../lib/dropshippingApi';

const result = await submitDropshipperOrder(payload);

// Log to analytics
if (window.gtag) {
  window.gtag('event', 'purchase', {
    transaction_id: result.referenceOrderId,
    value: cartTotal,
    currency: 'INR',
    supplier: items[0].provider,
  });
}
```

### 9.3 Monitor Supplier Performance

Check supplier health daily:

```bash
curl https://api.yourdomain.com/api/suppliers \
  -H "Authorization: Bearer YOUR_TOKEN"

# Response shows last sync time and status
```

---

## Step 10: Optimization Tips

### 10.1 Cache Products Aggressively

Set longer cache TTL for popular products:

```typescript
// In cloudflare workers
await env.SUPPLIER_CACHE.put(cacheKey, JSON.stringify(products), {
  expirationTtl: 86400, // 24 hours for popular items
});
```

### 10.2 Preload Popular Suppliers

Sync during off-peak hours:

```toml
# In wrangler.toml - schedule sync at 2 AM
[triggers]
crons = ["0 2 * * *"]
```

### 10.3 Implement Progressive Enhancement

Load products incrementally:

```typescript
// Fetch first 5 products immediately
// Lazy-load more as user scrolls
```

---

## Step 11: Production Checklist

- [ ] API credentials configured in all supplier dashboards
- [ ] Cloudflare Workers deployed to production
- [ ] Frontend deployed to Cloudflare Pages
- [ ] HTTPS enabled and redirects active
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error monitoring set up
- [ ] Database backups configured
- [ ] SSL certificate valid
- [ ] Security headers configured
- [ ] API load tests completed
- [ ] Order flow tested end-to-end
- [ ] Customer support documentation ready

---

## Next Steps

1. **Test with real orders** (use test accounts with suppliers)
2. **Monitor performance** for first week
3. **Gather customer feedback**
4. **Optimize based on usage patterns**
5. **Plan for seasonal scaling**

---

## Support & Resources

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [GlowRoad API Docs](https://docs.glowroad.com/api/)
- [Roposo Clout API Docs](https://clout.roposo.com/developer/)
- [CJ Dropshipping API Docs](https://api.cjdropshipping.com/docs/)

---

## Emergency Contacts

- **Cloudflare Support**: https://support.cloudflare.com
- **GlowRoad Support**: support@glowroad.com
- **Roposo Support**: support@roposo.com
- **CJ Dropshipping**: support@cjdropshipping.com
