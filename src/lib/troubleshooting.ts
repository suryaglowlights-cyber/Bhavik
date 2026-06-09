// ========================================
// Common Issues & Solutions Reference
// ========================================

export const TROUBLESHOOTING_GUIDE = {
  cors_errors: {
    title: "CORS Errors in Browser Console",
    symptoms: [
      "Access to XMLHttpRequest blocked by CORS policy",
      "No 'Access-Control-Allow-Origin' header",
      "Preflight request failed (OPTIONS 403)"
    ],
    solutions: [
      {
        step: 1,
        description: "Check that your frontend domain is in ALLOWED_ORIGINS",
        code: `
// In Cloudflare Workers wrangler.toml
ALLOWED_ORIGINS="https://yourdomain.com,https://www.yourdomain.com"
        `
      },
      {
        step: 2,
        description: "Redeploy Cloudflare Workers",
        code: `
wrangler deploy --env production
        `
      },
      {
        step: 3,
        description: "Check browser requests in DevTools Network tab",
        details: "Look for OPTIONS preflight requests - they should return 200"
      }
    ]
  },

  api_401_unauthorized: {
    title: "401 Unauthorized Errors",
    symptoms: [
      "Orders fail to submit",
      "Products return 401",
      "Missing Authorization header"
    ],
    solutions: [
      {
        step: 1,
        description: "Verify API token is being sent",
        code: `
// Check in .env.local
VITE_API_TOKEN=your_token_here
        `
      },
      {
        step: 2,
        description: "Check if JWT token is expired",
        code: `
// Frontend debug
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token expires at:', new Date(payload.exp * 1000));
        `
      },
      {
        step: 3,
        description: "Regenerate JWT token in Workers",
        code: `
wrangler secret put JWT_SECRET --env production
        `
      }
    ]
  },

  supplier_api_errors: {
    title: "Supplier API Connection Failures",
    symptoms: [
      "Empty product lists",
      "Orders not submitting to supplier",
      "No error message displayed"
    ],
    solutions: [
      {
        step: 1,
        description: "Verify API credentials are correct",
        code: `
// Test GlowRoad directly
curl -X GET https://api.glowroad.com/v2/products \\
  -H "Authorization: Bearer YOUR_API_KEY"
        `
      },
      {
        step: 2,
        description: "Check Cloudflare Workers logs",
        code: `
wrangler tail --env production
// Look for supplier API error messages
        `
      },
      {
        step: 3,
        description: "Update supplier API credentials",
        code: `
// In wrangler.toml
wrangler secret put GLOWROAD_API_KEY --env production
wrangler deploy --env production
        `
      }
    ]
  },

  slow_product_loading: {
    title: "Products Loading Slowly",
    symptoms: [
      "Product search takes >5 seconds",
      "Multiple product syncs happening",
      "KV cache not working"
    ],
    solutions: [
      {
        step: 1,
        description: "Check KV namespace is configured",
        code: `
// In wrangler.toml
[[kv_namespaces]]
binding = "SUPPLIER_CACHE"
id = "your_namespace_id"
        `
      },
      {
        step: 2,
        description: "Increase cache TTL",
        code: `
// In Cloudflare Workers (products.ts)
await env.SUPPLIER_CACHE.put(cacheKey, JSON.stringify(products), {
  expirationTtl: 86400, // Increase to 24 hours
});
        `
      },
      {
        step: 3,
        description: "Reduce product limit per request",
        code: `
// Frontend
const products = await fetchDropshipperProducts({
  limit: 20, // Reduce from 50
  offset: 0
});
        `
      }
    ]
  },

  payment_gateway_issues: {
    title: "Payment Processing Failures",
    symptoms: [
      "COD orders not being accepted",
      "Payment reference validation fails",
      "Checkout hangs after payment"
    ],
    solutions: [
      {
        step: 1,
        description: "Verify payment method mapping",
        code: `
// Check mapping in suppliers modules
const paymentMap = {
  'COD': 'cod',
  'PREPAID': 'prepaid',
};
        `
      },
      {
        step: 2,
        description: "Ensure payment reference is provided for prepaid",
        code: `
if (paymentMethod === 'PREPAID' && !paymentReference) {
  throw new Error('Payment reference required for PREPAID orders');
}
        `
      },
      {
        step: 3,
        description: "Check supplier payment method support",
        details: "Not all suppliers support all payment methods. Check docs."
      }
    ]
  },

  inventory_sync_failures: {
    title: "Products Not Syncing from Suppliers",
    symptoms: [
      "No products shown in store",
      "Old products still displayed",
      "Sync logs show errors"
    ],
    solutions: [
      {
        step: 1,
        description: "Manually trigger sync",
        code: `
curl -X POST https://api.yourdomain.com/api/suppliers/glowroad/sync \\
  -H "Authorization: Bearer YOUR_TOKEN"
        `
      },
      {
        step: 2,
        description: "Check sync logs",
        code: `
SELECT * FROM sync_logs 
WHERE supplier='glowroad' 
ORDER BY started_at DESC 
LIMIT 5;
        `
      },
      {
        step: 3,
        description: "Check cron job configuration",
        code: `
// In wrangler.toml
[triggers]
crons = ["0 */4 * * *"]  // Every 4 hours
        `
      }
    ]
  },

  margin_calculation_errors: {
    title: "Incorrect Prices Shown to Customers",
    symptoms: [
      "Retail prices don't match calculation",
      "Margin not applied consistently",
      "Admin margin config not updating"
    ],
    solutions: [
      {
        step: 1,
        description: "Verify margin config is loaded",
        code: `
// In frontend component
const margin = getMarginConfig();
console.log('Current margin config:', margin);
        `
      },
      {
        step: 2,
        description: "Check localStorage for margin data",
        code: `
// In browser console
localStorage.getItem('dropshipping:margin:config')
        `
      },
      {
        step: 3,
        description: "Clear cache and recalculate",
        code: `
localStorage.removeItem('dropshipping:margin:config');
// Refresh page
        `
      }
    ]
  },

  order_routing_failures: {
    title: "Orders Not Reaching Suppliers",
    symptoms: [
      "Order submitted but supplier ID not returned",
      "Customer gets 'success' but no order created",
      "Webhook not being received"
    ],
    solutions: [
      {
        step: 1,
        description: "Check order request payload",
        code: `
// In browser DevTools, intercept request
console.log(JSON.stringify(orderPayload, null, 2));
        `
      },
      {
        step: 2,
        description: "Verify supplier order ID returned",
        code: `
// Check response from order submission
const result = await submitDropshipperOrder(payload);
console.log('Supplier orders:', result.supplierOrders);
        `
      },
      {
        step: 3,
        description: "Check supplier webhook configuration",
        code: `
// Verify webhook URL is correct in supplier dashboard
// Test webhook:
curl -X POST https://yourdomain.com/api/webhooks/supplier \\
  -H "Content-Type: application/json" \\
  -d '{"test": true}'
        `
      }
    ]
  },

  deployment_issues: {
    title: "Deployment to Cloudflare Fails",
    symptoms: [
      "wrangler deploy fails with errors",
      "Pages deployment doesn't show API routes",
      "Environment variables not being set"
    ],
    solutions: [
      {
        step: 1,
        description: "Check authentication",
        code: `
wrangler login
wrangler whoami
        `
      },
      {
        step: 2,
        description: "Verify wrangler.toml configuration",
        code: `
# Required fields:
# - account_id
# - zone_id (for zone-scoped workers)
# - name
# - type
        `
      },
      {
        step: 3,
        description: "Check build output",
        code: `
npm run build
# Verify dist/ folder is created with all files
ls -la dist/
        `
      }
    ]
  },

  database_issues: {
    title: "Database Errors",
    symptoms: [
      "Order history not saving",
      "Margin configs not persisting",
      "Sync logs not being recorded"
    ],
    solutions: [
      {
        step: 1,
        description: "Verify database connection",
        code: `
// In bootstrap.php
$pdo = getPdo();
$pdo->query("SELECT 1");
        `
      },
      {
        step: 2,
        description: "Check table existence",
        code: `
SHOW TABLES;
DESCRIBE dropshipping_orders;
        `
      },
      {
        step: 3,
        description: "Run schema migration",
        code: `
# Import schema
mysql -u user -p database < backend/sql/dropshipping_schema.sql
        `
      }
    ]
  }
};

// Helper to get troubleshooting info
export function getTroubleshootingGuide(issue: keyof typeof TROUBLESHOOTING_GUIDE) {
  return TROUBLESHOOTING_GUIDE[issue];
}

// Helper for error recovery
export const ERROR_RECOVERY = {
  retryPolicy: {
    maxRetries: 3,
    retryDelayMs: 1000,
    backoffMultiplier: 2,
  },

  async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000; // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  },
};
