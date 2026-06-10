// Cloudflare Pages Function for API Key Management
// Handles GET/POST /api/keys

interface ProviderKeys {
  apiKey: string;
  secretKey: string;
  clientId: string;
  accessToken: string;
  webhookUrl: string;
  isActive: boolean;
}

interface AllApiKeys {
  printrove: ProviderKeys;
  qikink: ProviderKeys;
  blinkstore: ProviderKeys;
  vendorgo: ProviderKeys;
}

const defaultKeys: AllApiKeys = {
  printrove: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  qikink: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  blinkstore: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
  vendorgo: { apiKey: "", secretKey: "", clientId: "", accessToken: "", webhookUrl: "", isActive: false },
};

export async function onRequestGet(context: { env: any }) {
  const { env } = context;

  try {
    const stored = await env.BHAVIK_STORE?.get('provider_keys', 'text');
    
    if (stored) {
      const keys = JSON.parse(stored);
      return new Response(
        JSON.stringify(keys),
        {
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    return new Response(
      JSON.stringify(defaultKeys),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error fetching provider keys:', error);
    return new Response(
      JSON.stringify(defaultKeys),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function onRequestPost(context: { request: Request; env: any }) {
  const { request, env } = context;

  try {
    const body = await request.json() as AllApiKeys;
    
    await env.BHAVIK_STORE?.put('provider_keys', JSON.stringify(body));

    return new Response(
      JSON.stringify({ success: true, data: body }),
      {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  } catch (error: any) {
    console.error('Error saving provider keys:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
