import { Router } from 'itty-router';

export const providerKeysRoutes = Router();

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

/**
 * GET /api/provider-keys
 * Get all provider API keys from KV storage
 */
providerKeysRoutes.get('/', async (request: Request) => {
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const stored = await env.API_KEYS_KV.get('provider_keys', 'text');
    
    if (stored) {
      const keys = JSON.parse(stored);
      return new Response(
        JSON.stringify(keys),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify(defaultKeys),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error fetching provider keys:', error);
    return new Response(
      JSON.stringify(defaultKeys),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

/**
 * POST /api/provider-keys
 * Save provider API keys to KV storage
 */
providerKeysRoutes.post('/', async (request: Request) => {
  const env = (request as any).env;
  const corsHeaders = (request as any).corsHeaders || {};

  try {
    const body = await request.json() as AllApiKeys;
    
    await env.API_KEYS_KV.put('provider_keys', JSON.stringify(body));

    return new Response(
      JSON.stringify({ success: true, data: body }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error('Error saving provider keys:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});
