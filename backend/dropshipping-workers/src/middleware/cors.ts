// ========================================
// CORS Middleware for Cloudflare Workers
// ========================================

export function handleCors(request: Request): Response | undefined {
  const headers = request.headers;
  const origin = headers.get('origin');
  
  // Parse allowed origins from env
  const allowedOrigins = (request as any).env?.ALLOWED_ORIGINS?.split(',') || [
    'https://yourdomain.com',
    'https://www.yourdomain.com',
    'http://localhost:5173', // Dev
  ];

  const corsHeaders: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400', // 24 hours
  };

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    corsHeaders['Access-Control-Allow-Origin'] = origin;
  } else if (allowedOrigins.some(allowed => allowed === '*')) {
    corsHeaders['Access-Control-Allow-Origin'] = '*';
  }

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  // Add CORS headers to regular responses
  (request as any).corsHeaders = corsHeaders;
  return undefined;
}
