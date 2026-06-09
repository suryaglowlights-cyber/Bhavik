// ========================================
// Authentication Middleware
// ========================================

export async function validateAuth(request: Request): Promise<Response | undefined> {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer') {
    return new Response(
      JSON.stringify({ error: 'Invalid Authorization scheme' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Verify JWT token
    const verified = await verifyJWT(token, (request as any).env.JWT_SECRET);
    (request as any).user = verified;
    return undefined; // Continue to next handler
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired token' }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

async function verifyJWT(token: string, secret: string): Promise<any> {
  // In production, use a proper JWT library
  // For now, simple validation
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  
  // Decode payload (not fully verified - use proper JWT library in production)
  const payload = JSON.parse(atob(parts[1]));
  
  if (payload.exp && payload.exp < Date.now() / 1000) {
    throw new Error('Token expired');
  }
  
  return payload;
}
