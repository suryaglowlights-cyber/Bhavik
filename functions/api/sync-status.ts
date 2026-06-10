// Cloudflare Pages Function for Sync Status
// Handles GET /api/sync-status

export async function onRequestGet(context: { env: any }) {
  const { env } = context;

  try {
    const lastSync = await env.BHAVIK_STORE?.get('last_sync_timestamp', 'text');
    
    return new Response(
      JSON.stringify({ lastSync }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching sync status:', error);
    return new Response(
      JSON.stringify({ lastSync: null }),
      {
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
