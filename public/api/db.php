<?php
// Database Connection Helper using PDO MySQL

function getDB() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $config = require __DIR__ . '/config.php';
    $dbConfig = $config['db'];

    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $dbConfig['host'],
        $dbConfig['port'],
        $dbConfig['dbname'],
        $dbConfig['charset']
    );

    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];

    try {
        $pdo = new PDO($dsn, $dbConfig['username'], $dbConfig['password'], $options);
        
        // Auto ensure teaching_hours column exists in journals table
        try {
            $checkCol = $pdo->query("SHOW COLUMNS FROM journals LIKE 'teaching_hours'");
            if ($checkCol->rowCount() === 0) {
                $pdo->exec("ALTER TABLE journals ADD COLUMN teaching_hours TEXT");
            }
        } catch (\Exception $e) {
            // Ignore if table not created yet
        }

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Gagal terhubung ke Database MySQL Hostinger: ' . $e->getMessage(),
            'hint' => 'Silakan periksa konfigurasi di file api/config.php (host, dbname, username, password)'
        ]);
        exit;
    }
}

function sendJson($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getJsonBody() {
    $raw = file_get_contents('php://input');
    if (empty($raw)) {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}
