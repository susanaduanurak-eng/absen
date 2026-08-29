<?php
// Diagnostic & Test Tool for Hostinger / Shared Hosting Deployment
header('Content-Type: text/html; charset=utf-8');

$config = @include __DIR__ . '/config.php';
$dbConfig = $config['db'] ?? [];

$status = [
    'php_version' => phpversion(),
    'pdo_mysql' => extension_loaded('pdo_mysql'),
    'json' => extension_loaded('json'),
    'timezone' => date_default_timezone_get(),
    'current_time' => date('Y-m-d H:i:s'),
    'db_connected' => false,
    'db_error' => null,
    'tables' => []
];

try {
    if (!extension_loaded('pdo_mysql')) {
        throw new Exception("Ekstensi PHP 'pdo_mysql' tidak aktif di hosting ini.");
    }
    
    $dsn = sprintf(
        'mysql:host=%s;port=%s;dbname=%s;charset=%s',
        $dbConfig['host'] ?? 'localhost',
        $dbConfig['port'] ?? '3306',
        $dbConfig['dbname'] ?? '',
        $dbConfig['charset'] ?? 'utf8mb4'
    );
    
    $pdo = new PDO($dsn, $dbConfig['username'] ?? '', $dbConfig['password'] ?? '', [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5
    ]);
    
    $status['db_connected'] = true;
    
    // Check tables
    $tableList = ['users', 'classes', 'subjects', 'geolocations', 'attendance', 'journals', 'permissions'];
    foreach ($tableList as $t) {
        try {
            $stmt = $pdo->query("SELECT COUNT(*) FROM `{$t}`");
            $count = $stmt->fetchColumn();
            $status['tables'][$t] = "Ada ({$count} baris data)";
        } catch (Exception $e) {
            $status['tables'][$t] = "Belum Dibuat / Error";
        }
    }
} catch (Exception $e) {
    $status['db_error'] = $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cek Koneksi Hostinger - SMKN 1 Poco Ranaka</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
        .card { max-width: 650px; margin: 0 auto; background: white; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); padding: 28px; }
        h1 { font-size: 20px; font-weight: 800; margin-top: 0; color: #0f172a; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-danger { background: #fee2e2; color: #991b1b; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td, th { padding: 10px 12px; text-align: left; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
        th { font-weight: 700; color: #64748b; background: #f8fafc; }
        .tip { background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #1e40af; margin-top: 20px; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="card">
        <h1>🛠️ Status Backend PHP & Database MySQL</h1>
        <p style="color: #64748b; font-size: 13px; margin-top: -8px;">Sistem Absensi & Jurnal Mengajar SMKN 1 Poco Ranaka</p>
        
        <table>
            <tr>
                <td>Versi PHP Server</td>
                <td><strong><?= htmlspecialchars($status['php_version']) ?></strong></td>
            </tr>
            <tr>
                <td>Ekstensi PDO MySQL</td>
                <td>
                    <?php if ($status['pdo_mysql']): ?>
                        <span class="badge badge-success">Aktif</span>
                    <?php else: ?>
                        <span class="badge badge-danger">Tidak Aktif</span>
                    <?php endif; ?>
                </td>
            </tr>
            <tr>
                <td>Koneksi Database MySQL</td>
                <td>
                    <?php if ($status['db_connected']): ?>
                        <span class="badge badge-success">Terhubung Sukses ✅</span>
                    <?php else: ?>
                        <span class="badge badge-danger">Gagal Terhubung ❌</span>
                    <?php endif; ?>
                </td>
            </tr>
            <?php if ($status['db_error']): ?>
            <tr>
                <td>Pesan Error Database</td>
                <td style="color: #dc2626; font-family: monospace; font-size: 11px;">
                    <?= htmlspecialchars($status['db_error']) ?>
                </td>
            </tr>
            <?php endif; ?>
            <tr>
                <td>Waktu Server</td>
                <td><?= htmlspecialchars($status['current_time']) ?> (<?= htmlspecialchars($status['timezone']) ?>)</td>
            </tr>
        </table>

        <h3 style="font-size: 15px; margin-top: 24px; margin-bottom: 8px;">Status Tabel Database:</h3>
        <table>
            <thead>
                <tr>
                    <th>Nama Tabel</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <?php if ($status['db_connected']): ?>
                    <?php foreach ($status['tables'] as $table => $tStatus): ?>
                        <tr>
                            <td><code><?= htmlspecialchars($table) ?></code></td>
                            <td><?= htmlspecialchars($tStatus) ?></td>
                        </tr>
                    <?php endforeach; ?>
                <?php else: ?>
                    <tr>
                        <td colspan="2" style="color: #94a3b8; text-align: center;">Database belum terhubung</td>
                    </tr>
                <?php endif; ?>
            </tbody>
        </table>

        <?php if (!$status['db_connected']): ?>
            <div class="tip">
                <strong>Cara Mengatasi:</strong> Buka file <code>api/config.php</code> di File Manager Hostinger dan isi <code>dbname</code>, <code>username</code>, dan <code>password</code> sesuai database MySQL yang Anda buat di cPanel / hPanel Hostinger.
            </div>
        <?php else: ?>
            <div class="tip" style="background: #f0fdf4; border-color: #22c55e; color: #15803d;">
                <strong>Semua Siap!</strong> Backend PHP dan MySQL Hostinger Anda sudah berfungsi 100%. Anda dapat membuka halaman utama aplikasi web Anda sekarang.
            </div>
        <?php endif; ?>
    </div>
</body>
</html>
