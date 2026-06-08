<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    $pdo = getPdo();
    $stmt = $pdo->query('SELECT id, provider_name, provider_product_id, title, description, retail_price, wholesale_cost, images, status, created_at, updated_at FROM products ORDER BY updated_at DESC, provider_name ASC');
    $rows = $stmt->fetchAll();
    foreach ($rows as &$row) {
        $row['images'] = $row['images'] ? json_decode($row['images'], true) : [];
        $row['images'] = is_array($row['images']) ? $row['images'] : [];
    }
    respond(200, ['success' => true, 'products' => $rows]);
} catch (Throwable $ex) {
    respond(500, ['success' => false, 'error' => 'Unable to load products.']);
}
