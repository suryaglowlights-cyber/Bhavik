<?php
declare(strict_types=1);
require_once __DIR__ . '/bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    respond(405, ['success' => false, 'error' => 'Method not allowed']);
}

try {
    respond(200, getAllProviderKeys());
} catch (Throwable $ex) {
    respond(500, ['success' => false, 'error' => 'Unable to load provider keys.']);
}
