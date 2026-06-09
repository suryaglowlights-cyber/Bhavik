<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
ini_set('display_errors', '0');

function respond(int $status, $payload): void {
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function getPdo(): PDO {
    $host = '127.0.0.1';
    $db = 'bhavix';
    $user = 'your_db_user';
    $pass = 'your_db_password';
    $dsn = "mysql:host={$host};dbname={$db};charset=utf8mb4";

    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    return $pdo;
}

function getAllProviderKeys(): array {
    $pdo = getPdo();
    $stmt = $pdo->query('SELECT provider, api_key, secret_key, client_id, access_token, webhook_url, is_active FROM provider_api_keys');
    $rows = $stmt->fetchAll();

    $result = [
        'printrove' => [],
        'qikink' => [],
        'blinkstore' => [],
        'vendorgo' => [],
        'glowroad' => [],
        'roposo' => [],
    ];

    foreach ($rows as $row) {
        $key = strtolower($row['provider']);
        if (!isset($result[$key])) {
            continue;
        }
        $result[$key] = [
            'apiKey' => $row['api_key'] ?? '',
            'secretKey' => $row['secret_key'] ?? '',
            'clientId' => $row['client_id'] ?? '',
            'accessToken' => $row['access_token'] ?? '',
            'webhookUrl' => $row['webhook_url'] ?? '',
            'isActive' => (bool) $row['is_active'],
        ];
    }

    return $result;
}

function getProviderCredentials(string $provider): array {
    $pdo = getPdo();
    $stmt = $pdo->prepare('SELECT api_key, secret_key, client_id, access_token FROM provider_api_keys WHERE provider = :provider LIMIT 1');
    $stmt->execute([':provider' => $provider]);
    $row = $stmt->fetch();
    return $row ?: ['api_key' => '', 'secret_key' => '', 'client_id' => '', 'access_token' => ''];
}

function curlGet(string $url, array $headers): array {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

    $responseBody = curl_exec($ch);
    $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($responseBody === false) {
        respond(502, ['success' => false, 'error' => 'Provider request failed: ' . $curlError]);
    }

    $payload = json_decode($responseBody, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        respond(502, ['success' => false, 'error' => 'Invalid JSON response from provider: ' . json_last_error_msg()]);
    }

    if ($statusCode >= 400) {
        respond($statusCode, ['success' => false, 'error' => 'Provider returned HTTP ' . $statusCode, 'payload' => $payload]);
    }

    return $payload;
}

function normalizeImages(array|string|null $images): string {
    if (is_string($images)) {
        return json_encode([$images], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    if (is_array($images)) {
        return json_encode(array_values($images), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }
    return json_encode([], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
}

function normalizeFloat(mixed $value): float {
    if (is_numeric($value)) {
        return (float) $value;
    }
    if (is_string($value)) {
        return (float) preg_replace('/[^0-9.\-]/', '', $value);
    }
    return 0.0;
}

function saveCatalogProducts(string $provider, array $products): array {
    $pdo = getPdo();
    $insert = $pdo->prepare(
        'INSERT INTO products (provider_name, provider_product_id, title, description, retail_price, wholesale_cost, images, status, created_at, updated_at)
         VALUES (:provider_name, :provider_product_id, :title, :description, :retail_price, :wholesale_cost, :images, :status, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
           title = VALUES(title),
           description = VALUES(description),
           retail_price = VALUES(retail_price),
           wholesale_cost = VALUES(wholesale_cost),
           images = VALUES(images),
           status = VALUES(status),
           updated_at = NOW()'
    );

    $saved = 0;
    foreach ($products as $product) {
        if (empty($product['provider_product_id']) || empty($product['title'])) {
            continue;
        }

        $insert->execute([
            ':provider_name' => $provider,
            ':provider_product_id' => $product['provider_product_id'],
            ':title' => $product['title'],
            ':description' => $product['description'] ?? '',
            ':retail_price' => normalizeFloat($product['retail_price'] ?? $product['price'] ?? 0),
            ':wholesale_cost' => normalizeFloat($product['wholesale_cost'] ?? 0),
            ':images' => normalizeImages($product['images'] ?? $product['image'] ?? []),
            ':status' => $product['status'] ?? 'active',
        ]);
        $saved++;
    }

    return ['total' => count($products), 'saved' => $saved];
}

function extractProductBlocks(array $payload): array {
    if (isset($payload['data']) && is_array($payload['data'])) {
        return array_values($payload['data']);
    }

    if (isset($payload['products']) && is_array($payload['products'])) {
        return array_values($payload['products']);
    }

    if (isset($payload['items']) && is_array($payload['items'])) {
        return array_values($payload['items']);
    }

    if (array_keys($payload) !== range(0, count($payload) - 1)) {
        return [$payload];
    }

    return $payload;
}
