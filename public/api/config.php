<?php
// Configuration File for Hostinger / Shared Hosting MySQL Database
// Sesuaikan informasi database di bawah ini dengan database yang Anda buat di Hostinger cPanel / hPanel

return [
    'db' => [
        'host'     => getenv('DB_HOST') ?: 'localhost', // Biasanya localhost di Hostinger
        'port'     => getenv('DB_PORT') ?: '3306',
        'dbname'   => getenv('DB_NAME') ?: 'u123456789_absensi', // Ganti dengan nama database Anda di Hostinger
        'username' => getenv('DB_USER') ?: 'u123456789_admin',   // Ganti dengan user database Anda
        'password' => getenv('DB_PASSWORD') ?: 'PasswordDatabaseAnda123!', // Ganti dengan password database Anda
        'charset'  => 'utf8mb4',
    ],
    'app' => [
        'timezone' => 'Asia/Makassar', // WITA untuk SMKN 1 Poco Ranaka (NTT)
        'cors_allowed_origins' => ['*'],
    ]
];
