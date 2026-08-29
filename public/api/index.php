<?php
// API Front-Controller Router for Hostinger / Shared Hosting PHP
error_reporting(0);
ini_set('display_errors', '0');

// Set Timezone
date_default_timezone_set('Asia/Makassar');

// Set CORS & Security Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=utf-8');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/db.php';

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

// Parse route from REQUEST_URI or query parameter
$path = parse_url($requestUri, PHP_URL_PATH);

// Remove base path to normalize route
// Support: /api/login, /public/api/login, /api/index.php/login, /index.php/api/login
$route = $path;
if (strpos($route, '/api/index.php') !== false) {
    $route = substr($route, strpos($route, '/api/index.php') + strlen('/api/index.php'));
} elseif (strpos($route, '/api') !== false) {
    $route = substr($route, strpos($route, '/api') + strlen('/api'));
}

// Fallback to ?route= parameter if rewrite rule passed it
if (isset($_GET['route']) && !empty($_GET['route'])) {
    $route = '/' . ltrim($_GET['route'], '/');
}

$route = '/' . trim($route, '/');
if ($route === '/') {
    $route = '';
}

// Global Exception Handler
try {
    $db = getDB();

    // ==========================================
    // 1. Health Check
    // ==========================================
    if ($route === '' || $route === '/health') {
        sendJson(['status' => 'ok', 'server' => 'Hostinger PHP / MySQL API', 'time' => date('Y-m-d H:i:s')]);
    }

    // ==========================================
    // 2. Auth: POST /login
    // ==========================================
    if ($route === '/login' && $method === 'POST') {
        $body = getJsonBody();
        $username = trim($body['username'] ?? '');
        $password = trim($body['password'] ?? '');

        if (!$username || !$password) {
            sendJson(['success' => false, 'message' => 'Username dan password wajib diisi.'], 400);
        }

        $stmt = $db->prepare('SELECT id, username, name, role, nip FROM users WHERE username = ? AND password = ?');
        $stmt->execute([$username, $password]);
        $user = $stmt->fetch();

        if ($user) {
            sendJson(['success' => true, 'user' => $user]);
        } else {
            sendJson(['success' => false, 'message' => 'Username atau password salah'], 401);
        }
    }

    // ==========================================
    // 3. Geolocations: GET /geolocations
    // ==========================================
    if ($route === '/geolocations' && $method === 'GET') {
        $stmt = $db->query('SELECT * FROM geolocations');
        sendJson($stmt->fetchAll());
    }

    // ==========================================
    // 4. Admin Geolocations: GET & POST /admin/geolocations
    // ==========================================
    if ($route === '/admin/geolocations') {
        if ($method === 'GET') {
            $stmt = $db->query('SELECT * FROM geolocations');
            sendJson($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $name = $body['name'] ?? 'Sekolah';
            $latitude = $body['latitude'] ?? 0;
            $longitude = $body['longitude'] ?? 0;
            $radius = $body['radius'] ?? 100;

            $db->exec('DELETE FROM geolocations');
            $stmt = $db->prepare('INSERT INTO geolocations (name, latitude, longitude, radius) VALUES (?, ?, ?, ?)');
            $stmt->execute([$name, $latitude, $longitude, $radius]);
            sendJson(['success' => true]);
        }
    }

    // ==========================================
    // 5. Admin Users Management: /admin/users
    // ==========================================
    if ($route === '/admin/users') {
        if ($method === 'GET') {
            $stmt = $db->query('SELECT id, username, name, role, nip FROM users ORDER BY id DESC');
            sendJson($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $username = trim($body['username'] ?? '');
            $password = trim($body['password'] ?? '');
            $name = trim($body['name'] ?? '');
            $role = trim($body['role'] ?? 'pegawai');
            $nip = trim($body['nip'] ?? null);

            $stmt = $db->prepare('INSERT INTO users (username, password, name, role, nip) VALUES (?, ?, ?, ?, ?)');
            $stmt->execute([$username, $password, $name, $role, $nip]);
            sendJson(['success' => true]);
        }
    }

    // Handle /admin/users/:id (PUT, DELETE)
    if (preg_match('#^/admin/users/(\d+)$#', $route, $matches)) {
        $userId = (int)$matches[1];

        if ($method === 'PUT') {
            $body = getJsonBody();
            $username = trim($body['username'] ?? '');
            $password = trim($body['password'] ?? '');
            $name = trim($body['name'] ?? '');
            $role = trim($body['role'] ?? 'pegawai');
            $nip = trim($body['nip'] ?? null);

            if ($password) {
                $stmt = $db->prepare('UPDATE users SET username = ?, password = ?, name = ?, role = ?, nip = ? WHERE id = ?');
                $stmt->execute([$username, $password, $name, $role, $nip, $userId]);
            } else {
                $stmt = $db->prepare('UPDATE users SET username = ?, name = ?, role = ?, nip = ? WHERE id = ?');
                $stmt->execute([$username, $name, $role, $nip, $userId]);
            }
            sendJson(['success' => true]);
        } elseif ($method === 'DELETE') {
            $stmt = $db->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            sendJson(['success' => true]);
        }
    }

    // ==========================================
    // 6. Admin Classes: GET & POST /admin/classes, GET /classes
    // ==========================================
    if ($route === '/classes' || $route === '/admin/classes') {
        if ($method === 'GET') {
            $stmt = $db->query('SELECT * FROM classes ORDER BY name ASC');
            sendJson($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $name = trim($body['name'] ?? '');
            if ($name) {
                $stmt = $db->prepare('INSERT INTO classes (name) VALUES (?)');
                $stmt->execute([$name]);
            }
            sendJson(['success' => true]);
        }
    }

    // ==========================================
    // 7. Admin Subjects: GET & POST /admin/subjects, GET /subjects
    // ==========================================
    if ($route === '/subjects' || $route === '/admin/subjects') {
        if ($method === 'GET') {
            $stmt = $db->query('SELECT * FROM subjects ORDER BY name ASC');
            sendJson($stmt->fetchAll());
        } elseif ($method === 'POST') {
            $body = getJsonBody();
            $name = trim($body['name'] ?? '');
            if ($name) {
                $stmt = $db->prepare('INSERT INTO subjects (name) VALUES (?)');
                $stmt->execute([$name]);
            }
            sendJson(['success' => true]);
        }
    }

    // ==========================================
    // 8. Admin Attendance: GET /admin/attendance
    // ==========================================
    if ($route === '/admin/attendance' && $method === 'GET') {
        $sql = "
            SELECT a.*, u.name as user_name, u.nip
            FROM attendance a
            LEFT JOIN users u ON a.user_id = u.id
            ORDER BY a.timestamp DESC
        ";
        $stmt = $db->query($sql);
        sendJson($stmt->fetchAll());
    }

    // ==========================================
    // 9. Admin Journals: GET /admin/journals
    // ==========================================
    if ($route === '/admin/journals' && $method === 'GET') {
        $sql = "
            SELECT j.*, u.name as user_name, u.nip, c.name as class_name, s.name as subject_name
            FROM journals j
            LEFT JOIN users u ON j.user_id = u.id
            LEFT JOIN classes c ON j.class_id = c.id
            LEFT JOIN subjects s ON j.subject_id = s.id
            ORDER BY j.timestamp DESC
        ";
        $stmt = $db->query($sql);
        sendJson($stmt->fetchAll());
    }

    // ==========================================
    // 10. Admin Permissions: GET /admin/permissions
    // ==========================================
    if ($route === '/admin/permissions' && $method === 'GET') {
        $sql = "
            SELECT p.*, u.name as user_name, u.nip
            FROM permissions p
            LEFT JOIN users u ON p.user_id = u.id
            ORDER BY p.timestamp DESC
        ";
        $stmt = $db->query($sql);
        sendJson($stmt->fetchAll());
    }

    // ==========================================
    // 11. User Attendance: POST /attendance & GET /attendance/history/:userId
    // ==========================================
    if ($route === '/attendance' && $method === 'POST') {
        $body = getJsonBody();
        $userId = (int)($body['userId'] ?? 0);
        $type = trim($body['type'] ?? 'in');
        $latitude = $body['latitude'] ?? null;
        $longitude = $body['longitude'] ?? null;
        $address = $body['address'] ?? null;
        $selfie = $body['selfie'] ?? null;

        if (!$userId) {
            sendJson(['success' => false, 'message' => 'User ID tidak valid'], 400);
        }

        // Check if already checked in / out today
        $stmtCheck = $db->prepare('SELECT id FROM attendance WHERE user_id = ? AND type = ? AND DATE(timestamp) = CURDATE()');
        $stmtCheck->execute([$userId, $type]);
        if ($stmtCheck->fetch()) {
            $label = $type === 'in' ? 'masuk' : 'pulang';
            sendJson(['success' => false, 'message' => "Anda sudah melakukan absen {$label} hari ini."], 400);
        }

        $stmt = $db->prepare('INSERT INTO attendance (user_id, type, latitude, longitude, address, selfie) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $type, $latitude, $longitude, $address, $selfie]);
        sendJson(['success' => true]);
    }

    if (preg_match('#^/attendance/history/(\d+)$#', $route, $matches) && $method === 'GET') {
        $userId = (int)$matches[1];
        $stmt = $db->prepare('SELECT * FROM attendance WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50');
        $stmt->execute([$userId]);
        sendJson($stmt->fetchAll());
    }

    // ==========================================
    // 12. User Journals: POST /journals
    // ==========================================
    if ($route === '/journals' && $method === 'POST') {
        $body = getJsonBody();
        $userId = (int)($body['userId'] ?? 0);
        $classId = (int)($body['classId'] ?? 0);
        $subjectId = (int)($body['subjectId'] ?? 0);
        $teachingHours = trim($body['teachingHours'] ?? '1');
        $content = trim($body['content'] ?? '');
        $selfie = $body['selfie'] ?? null;
        $latitude = $body['latitude'] ?? null;
        $longitude = $body['longitude'] ?? null;

        $stmt = $db->prepare('INSERT INTO journals (user_id, class_id, subject_id, teaching_hours, content, selfie, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
        $stmt->execute([$userId, $classId, $subjectId, $teachingHours, $content, $selfie, $latitude, $longitude]);
        sendJson(['success' => true]);
    }

    // ==========================================
    // 13. User Permissions: POST /permissions
    // ==========================================
    if ($route === '/permissions' && $method === 'POST') {
        $body = getJsonBody();
        $userId = (int)($body['userId'] ?? 0);
        $type = trim($body['type'] ?? 'izin');
        $reason = trim($body['reason'] ?? '');
        $fileUrl = $body['fileUrl'] ?? null;

        $stmt = $db->prepare('INSERT INTO permissions (user_id, type, reason, file_url) VALUES (?, ?, ?, ?)');
        $stmt->execute([$userId, $type, $reason, $fileUrl]);
        sendJson(['success' => true]);
    }

    // ==========================================
    // 14. Global Stats: GET /stats
    // ==========================================
    if ($route === '/stats' && $method === 'GET') {
        $totalUsers = (int)$db->query('SELECT COUNT(*) FROM users')->fetchColumn();
        $todayAttendance = (int)$db->query('SELECT COUNT(DISTINCT user_id) FROM attendance WHERE DATE(timestamp) = CURDATE()')->fetchColumn();
        $pendingPermissions = (int)$db->query("SELECT COUNT(*) FROM permissions WHERE status = 'pending'")->fetchColumn();

        sendJson([
            'totalUsers' => $totalUsers,
            'todayAttendance' => $todayAttendance,
            'pendingPermissions' => $pendingPermissions
        ]);
    }

    // ==========================================
    // 15. Excel Batch Import: /admin/import/*
    // ==========================================
    if ($route === '/admin/import/users' && $method === 'POST') {
        $body = getJsonBody();
        $users = $body['users'] ?? [];
        if (!is_array($users) || empty($users)) {
            sendJson(['success' => false, 'message' => 'Data users kosong atau format tidak valid'], 400);
        }

        $inserted = 0;
        $updated = 0;

        foreach ($users as $u) {
            $username = trim($u['username'] ?? '');
            $name = trim($u['name'] ?? '');
            if (!$username || !$name) continue;

            $role = strtolower(trim($u['role'] ?? 'pegawai'));
            if (!in_array($role, ['admin', 'guru', 'pegawai'])) {
                $role = 'pegawai';
            }
            $password = trim($u['password'] ?? '123456');
            $nip = trim($u['nip'] ?? null);

            $stmtCheck = $db->prepare('SELECT id FROM users WHERE username = ?');
            $stmtCheck->execute([$username]);
            $existing = $stmtCheck->fetch();

            if ($existing) {
                if (!empty($u['password'])) {
                    $stmtUp = $db->prepare('UPDATE users SET name = ?, password = ?, role = ?, nip = ? WHERE username = ?');
                    $stmtUp->execute([$name, $password, $role, $nip, $username]);
                } else {
                    $stmtUp = $db->prepare('UPDATE users SET name = ?, role = ?, nip = ? WHERE username = ?');
                    $stmtUp->execute([$name, $role, $nip, $username]);
                }
                $updated++;
            } else {
                $stmtIn = $db->prepare('INSERT INTO users (username, password, name, role, nip) VALUES (?, ?, ?, ?, ?)');
                $stmtIn->execute([$username, $password, $name, $role, $nip]);
                $inserted++;
            }
        }

        sendJson(['success' => true, 'count' => count($users), 'inserted' => $inserted, 'updated' => $updated]);
    }

    if ($route === '/admin/import/journals' && $method === 'POST') {
        $body = getJsonBody();
        $journals = $body['journals'] ?? [];
        if (!is_array($journals) || empty($journals)) {
            sendJson(['success' => false, 'message' => 'Data jurnal kosong atau format tidak valid'], 400);
        }

        $users = $db->query('SELECT id, username, name FROM users')->fetchAll();
        $classes = $db->query('SELECT id, name FROM classes')->fetchAll();
        $subjects = $db->query('SELECT id, name FROM subjects')->fetchAll();

        $inserted = 0;
        $errors = [];

        foreach ($journals as $idx => $j) {
            $rowNum = $idx + 2;

            $userId = $j['userId'] ?? null;
            if (!$userId && (!empty($j['teacherName']) || !empty($j['username']))) {
                $queryTerm = strtolower(trim($j['username'] ?? $j['teacherName'] ?? ''));
                foreach ($users as $u) {
                    if (strtolower($u['username']) === $queryTerm || strtolower($u['name']) === $queryTerm || stripos($u['name'], $queryTerm) !== false) {
                        $userId = $u['id'];
                        break;
                    }
                }
            }

            if (!$userId) {
                $teacherStr = $j['teacherName'] ?? $j['username'] ?? '';
                $errors[] = "Baris {$rowNum}: Guru \"{$teacherStr}\" tidak ditemukan di database.";
                continue;
            }

            $classId = $j['classId'] ?? null;
            if (!$classId && !empty($j['className'])) {
                $cName = trim($j['className']);
                foreach ($classes as $c) {
                    if (strcasecmp($c['name'], $cName) === 0) {
                        $classId = $c['id'];
                        break;
                    }
                }
                if (!$classId) {
                    $stmtC = $db->prepare('INSERT INTO classes (name) VALUES (?)');
                    $stmtC->execute([$cName]);
                    $classId = (int)$db->lastInsertId();
                    $classes[] = ['id' => $classId, 'name' => $cName];
                }
            }

            if (!$classId) {
                $errors[] = "Baris {$rowNum}: Nama kelas tidak valid.";
                continue;
            }

            $subjectId = $j['subjectId'] ?? null;
            if (!$subjectId && !empty($j['subjectName'])) {
                $sName = trim($j['subjectName']);
                foreach ($subjects as $s) {
                    if (strcasecmp($s['name'], $sName) === 0) {
                        $subjectId = $s['id'];
                        break;
                    }
                }
                if (!$subjectId) {
                    $stmtS = $db->prepare('INSERT INTO subjects (name) VALUES (?)');
                    $stmtS->execute([$sName]);
                    $subjectId = (int)$db->lastInsertId();
                    $subjects[] = ['id' => $subjectId, 'name' => $sName];
                }
            }

            if (!$subjectId) {
                $errors[] = "Baris {$rowNum}: Nama mata pelajaran tidak valid.";
                continue;
            }

            $teachingHours = trim($j['teachingHours'] ?? '1');
            $content = trim($j['content'] ?? 'Kegiatan Belajar Mengajar');
            $selfie = $j['selfie'] ?? null;
            $latitude = $j['latitude'] ?? null;
            $longitude = $j['longitude'] ?? null;
            $timestamp = $j['timestamp'] ?? date('Y-m-d H:i:s');

            $stmtIn = $db->prepare('INSERT INTO journals (user_id, class_id, subject_id, teaching_hours, content, selfie, latitude, longitude, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
            $stmtIn->execute([$userId, $classId, $subjectId, $teachingHours, $content, $selfie, $latitude, $longitude, $timestamp]);
            $inserted++;
        }

        sendJson(['success' => true, 'count' => count($journals), 'inserted' => $inserted, 'errors' => $errors]);
    }

    if ($route === '/admin/import/classes' && $method === 'POST') {
        $body = getJsonBody();
        $classes = $body['classes'] ?? [];
        $inserted = 0;
        foreach ($classes as $name) {
            $cName = trim((string)$name);
            if (!$cName) continue;
            $stmtCheck = $db->prepare('SELECT id FROM classes WHERE name = ?');
            $stmtCheck->execute([$cName]);
            if (!$stmtCheck->fetch()) {
                $stmtIn = $db->prepare('INSERT INTO classes (name) VALUES (?)');
                $stmtIn->execute([$cName]);
                $inserted++;
            }
        }
        sendJson(['success' => true, 'inserted' => $inserted]);
    }

    if ($route === '/admin/import/subjects' && $method === 'POST') {
        $body = getJsonBody();
        $subjects = $body['subjects'] ?? [];
        $inserted = 0;
        foreach ($subjects as $name) {
            $sName = trim((string)$name);
            if (!$sName) continue;
            $stmtCheck = $db->prepare('SELECT id FROM subjects WHERE name = ?');
            $stmtCheck->execute([$sName]);
            if (!$stmtCheck->fetch()) {
                $stmtIn = $db->prepare('INSERT INTO subjects (name) VALUES (?)');
                $stmtIn->execute([$sName]);
                $inserted++;
            }
        }
        sendJson(['success' => true, 'inserted' => $inserted]);
    }

    // 404 Route Not Found
    sendJson(['success' => false, 'message' => "Route API tidak ditemukan: {$method} {$route}"], 404);

} catch (Exception $e) {
    sendJson([
        'success' => false,
        'message' => 'Terjadi kesalahan server: ' . $e->getMessage()
    ], 500);
}
