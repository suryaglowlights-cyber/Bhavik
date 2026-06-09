<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

$provider = trim((string)($_GET['provider'] ?? ''));
$allowed = ['Printrove', 'Qikink', 'Blinkstore', 'VendorGo', 'GlowRoad', 'Roposo'];
if (!in_array($provider, $allowed, true)) {
    respond(400, ['success' => false, 'error' => 'Invalid provider specified.']);
}

$credentials = getProviderCredentials($provider);
if ($provider === 'Printrove' && empty($credentials['api_key'])) {
    respond(400, ['success' => false, 'error' => 'Printrove bearer token is not configured.']);
}

if ($provider === 'Qikink' && (empty($credentials['client_id']) || empty($credentials['access_token']))) {
    respond(400, ['success' => false, 'error' => 'Qikink credentials are not configured.']);
}

if ($provider === 'Blinkstore' && empty($credentials['api_key'])) {
    respond(400, ['success' => false, 'error' => 'Blinkstore API key is not configured.']);
}

if ($provider === 'VendorGo' && empty($credentials['api_key'])) {
    respond(400, ['success' => false, 'error' => 'VendorGo API key is not configured.']);
}

if ($provider === 'GlowRoad' && (empty($credentials['api_key']) || empty($credentials['secret_key']))) {
    respond(400, ['success' => false, 'error' => 'GlowRoad API key or secret is not configured.']);
}

if ($provider === 'Roposo' && empty($credentials['api_key'])) {
    respond(400, ['success' => false, 'error' => 'Roposo API key is not configured.']);
}

try {
    switch ($provider) {
        case 'Printrove':
            $items = fetchPrintroveCatalog($credentials);
            break;
        case 'Qikink':
            $items = fetchQikinkCatalog($credentials);
            break;
        case 'Blinkstore':
            $items = fetchBlinkstoreCatalog($credentials);
            break;
        case 'VendorGo':
            $items = fetchVendorGoCatalog($credentials);
            break;
        case 'GlowRoad':
            $items = fetchGlowRoadCatalog($credentials);
            break;
        case 'Roposo':
            $items = fetchRoposoCatalog($credentials);
            break;
        default:
            $items = [];
    }

    if (!is_array($items)) {
        respond(502, ['success' => false, 'error' => 'Catalog response was not an array.']);
    }

    $stats = saveCatalogProducts($provider, $items);
    respond(200, ['success' => true, 'provider' => $provider, 'stats' => $stats]);
} catch (Throwable $ex) {
    respond(500, ['success' => false, 'error' => 'Catalog sync failed: ' . $ex->getMessage()]);
}

function fetchPrintroveCatalog(array $credentials): array {
    $payload = curlGet('https://api.printrove.com/api/external/products', [
        'Authorization: Bearer ' . trim($credentials['api_key']),
        'Accept: application/json',
    ]);

    $items = extractProductBlocks($payload);
    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? $item['product_name'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? $item['short_description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? $item['selling_price'] ?? 0,
            'wholesale_cost' => $item['cost_price'] ?? $item['price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}

function fetchQikinkCatalog(array $credentials): array {
    $payload = curlGet('https://api.qikink.com/api/v1/products', [
        'ClientId: ' . trim($credentials['client_id']),
        'Accesstoken: ' . trim($credentials['access_token']),
        'Accept: application/json',
    ]);
    $items = extractProductBlocks($payload);

    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? 0,
            'wholesale_cost' => $item['cost_price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}

function fetchBlinkstoreCatalog(array $credentials): array {
    $payload = curlGet('https://api.blinkstore.in/v1/products', [
        'X-API-KEY: ' . trim($credentials['api_key']),
        'Accept: application/json',
    ]);

    $items = extractProductBlocks($payload);
    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? 0,
            'wholesale_cost' => $item['cost_price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}

function fetchVendorGoCatalog(array $credentials): array {
    $payload = curlGet('https://api.vendorgo.in/v1/products', [
        'Authorization: Bearer ' . trim($credentials['api_key']),
        'Accept: application/json',
    ]);

    $items = extractProductBlocks($payload);
    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? 0,
            'wholesale_cost' => $item['cost_price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}

function fetchGlowRoadCatalog(array $credentials): array {
    $payload = curlGet('https://api.glowroad.com/v2/products', [
        'Authorization: Bearer ' . trim($credentials['api_key']),
        'X-Client-Id: ' . trim($credentials['secret_key']),
        'Accept: application/json',
    ]);

    $items = extractProductBlocks($payload);
    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? $item['product_name'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? $item['short_description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? $item['selling_price'] ?? 0,
            'wholesale_cost' => $item['wholesale_price'] ?? $item['cost_price'] ?? $item['price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}

function fetchRoposoCatalog(array $credentials): array {
    $payload = curlGet('https://api.roposo.com/v2/products', [
        'Authorization: Bearer ' . trim($credentials['api_key']),
        'Accept: application/json',
    ]);

    $items = extractProductBlocks($payload);
    return array_map(function ($item) {
        return [
            'provider_product_id' => (string)($item['id'] ?? $item['product_id'] ?? $item['sku'] ?? ''),
            'title' => (string)($item['name'] ?? $item['title'] ?? 'Untitled Product'),
            'description' => (string)($item['description'] ?? ''),
            'retail_price' => $item['price'] ?? $item['mrp'] ?? 0,
            'wholesale_cost' => $item['wholesale_price'] ?? $item['cost_price'] ?? 0,
            'images' => $item['images'] ?? $item['image'] ?? [],
            'status' => (string)($item['status'] ?? $item['availability'] ?? 'active'),
        ];
    }, $items);
}
