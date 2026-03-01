import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database Abstraction
let db: any;
let isMySQL = false;

async function initDB() {
  if (process.env.DB_HOST) {
    try {
      db = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: Number(process.env.DB_PORT || 3306),
      });
      isMySQL = true;
      console.log("Connected to MySQL Database");
    } catch (err) {
      console.error("Failed to connect to MySQL, falling back to SQLite:", err);
      await setupSQLite();
    }
  } else {
    await setupSQLite();
  }
}

async function setupSQLite() {
  try {
    const sqliteDb = await open({
      filename: "attendance.db",
      driver: sqlite3.Database
    });
    isMySQL = false;
    
    // Wrapper to mimic mysql2/promise for simple queries
    db = {
      execute: async (sql: string, params: any[] = []) => {
        if (sql.trim().toUpperCase().startsWith("SELECT")) {
          const rows = await sqliteDb.all(sql, params);
          return [rows];
        } else {
          const result = await sqliteDb.run(sql, params);
          return [{ insertId: result.lastID, affectedRows: result.changes }];
        }
      },
      query: async (sql: string, params: any[] = []) => {
        const rows = await sqliteDb.all(sql, params);
        return [rows];
      }
    };

    await sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      name TEXT,
      role TEXT DEFAULT 'pegawai',
      nip TEXT,
      class_id INTEGER
    );

    CREATE TABLE IF NOT EXISTS classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE
    );

    CREATE TABLE IF NOT EXISTS geolocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      latitude REAL,
      longitude REAL,
      radius INTEGER
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL,
      longitude REAL,
      address TEXT,
      selfie TEXT
    );

    CREATE TABLE IF NOT EXISTS journals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      class_id INTEGER,
      subject_id INTEGER,
      content TEXT,
      selfie TEXT,
      latitude REAL,
      longitude REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      reason TEXT,
      file_url TEXT,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed default data for SQLite
  const admin = await sqliteDb.get("SELECT * FROM users WHERE username = ?", "admin");
  if (!admin) {
    await sqliteDb.run("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)", "admin", "admin123", "Administrator", "admin");
  }
  const guru = await sqliteDb.get("SELECT * FROM users WHERE username = ?", "guru");
  if (!guru) {
    await sqliteDb.run("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)", "guru", "guru123", "Guru Contoh", "guru");
  }
  const geo = await sqliteDb.get("SELECT * FROM geolocations");
  if (!geo) {
    await sqliteDb.run("INSERT INTO geolocations (name, latitude, longitude, radius) VALUES (?, ?, ?, ?)", "Sekolah", -6.2000, 106.8166, 100);
  }
  
  console.log("Using SQLite Database (Preview Mode)");
  } catch (err) {
    console.error("Critical Error: SQLite initialization failed.");
    console.error(err);
    console.error("Please configure MySQL in .env (DB_HOST, etc.) for Hostinger production.");
  }
}
async function startServer() {
  await initDB();
  
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const [rows]: any = await db.execute("SELECT id, username, name, role, nip FROM users WHERE username = ? AND password = ?", [username, password]);
    const user = rows[0];
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  });

  app.get("/api/geolocations", async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM geolocations");
    res.json(rows);
  });

  app.get("/api/admin/users", async (req, res) => {
    const [rows] = await db.execute("SELECT id, username, name, role, nip FROM users");
    res.json(rows);
  });

  app.post("/api/admin/users", async (req, res) => {
    const { username, password, name, role, nip } = req.body;
    try {
      await db.execute("INSERT INTO users (username, password, name, role, nip) VALUES (?, ?, ?, ?, ?)", [username, password, name, role, nip]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.put("/api/admin/users/:id", async (req, res) => {
    const { username, password, name, role, nip } = req.body;
    const { id } = req.params;
    try {
      if (password) {
        await db.execute("UPDATE users SET username = ?, password = ?, name = ?, role = ?, nip = ? WHERE id = ?", [username, password, name, role, nip, id]);
      } else {
        await db.execute("UPDATE users SET username = ?, name = ?, role = ?, nip = ? WHERE id = ?", [username, name, role, nip, id]);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.delete("/api/admin/users/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await db.execute("DELETE FROM users WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (e: any) {
      res.status(400).json({ success: false, message: e.message });
    }
  });

  app.get("/api/admin/classes", async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM classes");
    res.json(rows);
  });

  app.post("/api/admin/classes", async (req, res) => {
    await db.execute("INSERT INTO classes (name) VALUES (?)", [req.body.name]);
    res.json({ success: true });
  });

  app.get("/api/admin/subjects", async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM subjects");
    res.json(rows);
  });

  app.post("/api/admin/subjects", async (req, res) => {
    await db.execute("INSERT INTO subjects (name) VALUES (?)", [req.body.name]);
    res.json({ success: true });
  });

  app.get("/api/admin/geolocations", async (req, res) => {
    const [rows] = await db.execute("SELECT * FROM geolocations");
    res.json(rows);
  });

  app.post("/api/admin/geolocations", async (req, res) => {
    const { name, latitude, longitude, radius } = req.body;
    // Delete all existing geolocations to ensure only one exists
    await db.execute("DELETE FROM geolocations");
    await db.execute("INSERT INTO geolocations (name, latitude, longitude, radius) VALUES (?, ?, ?, ?)", [name, latitude, longitude, radius]);
    res.json({ success: true });
  });

  app.get("/api/admin/attendance", async (req, res) => {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as user_name 
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
    `);
    res.json(rows);
  });

  app.get("/api/admin/journals", async (req, res) => {
    const [rows] = await db.execute(`
      SELECT j.*, u.name as user_name, c.name as class_name, s.name as subject_name
      FROM journals j
      JOIN users u ON j.user_id = u.id
      JOIN classes c ON j.class_id = c.id
      JOIN subjects s ON j.subject_id = s.id
      ORDER BY j.timestamp DESC
    `);
    res.json(rows);
  });

  app.get("/api/admin/permissions", async (req, res) => {
    const [rows] = await db.execute(`
      SELECT p.*, u.name as user_name
      FROM permissions p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.timestamp DESC
    `);
    res.json(rows);
  });

  app.post("/api/attendance", async (req, res) => {
    const { userId, type, latitude, longitude, address, selfie } = req.body;
    
    // MySQL vs SQLite date functions
    const dateFunc = isMySQL ? "CURDATE()" : "date('now', 'localtime')";
    const [existing]: any = await db.execute(`
      SELECT type FROM attendance 
      WHERE user_id = ? AND type = ? AND DATE(timestamp) = ${dateFunc}
    `, [userId, type]);

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, message: `Anda sudah melakukan absen ${type === 'in' ? 'masuk' : 'pulang'} hari ini.` });
    }

    await db.execute(`
      INSERT INTO attendance (user_id, type, latitude, longitude, address, selfie)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [userId, type, latitude, longitude, address, selfie]);

    res.json({ success: true });
  });

  app.post("/api/journals", async (req, res) => {
    const { userId, classId, subjectId, content, selfie, latitude, longitude } = req.body;
    await db.execute(`
      INSERT INTO journals (user_id, class_id, subject_id, content, selfie, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [userId, classId, subjectId, content, selfie, latitude, longitude]);
    res.json({ success: true });
  });

  app.post("/api/permissions", async (req, res) => {
    const { userId, type, reason, fileUrl } = req.body;
    await db.execute(`
      INSERT INTO permissions (user_id, type, reason, file_url)
      VALUES (?, ?, ?, ?)
    `, [userId, type, reason, fileUrl]);
    res.json({ success: true });
  });

  app.get("/api/stats", async (req, res) => {
    const dateFunc = isMySQL ? "CURDATE()" : "date('now', 'localtime')";
    const [uRows]: any = await db.execute("SELECT COUNT(*) as count FROM users");
    const [aRows]: any = await db.execute(`SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE DATE(timestamp) = ${dateFunc}`);
    const [pRows]: any = await db.execute("SELECT COUNT(*) as count FROM permissions WHERE status = 'pending'");
    
    res.json({
      totalUsers: uRows[0].count,
      todayAttendance: aRows[0].count,
      pendingPermissions: pRows[0].count
    });
  });

  app.get("/api/attendance/history/:userId", async (req, res) => {
    const { userId } = req.params;
    const [rows] = await db.execute(`
      SELECT * FROM attendance 
      WHERE user_id = ? 
      ORDER BY timestamp DESC
      LIMIT 50
    `, [userId]);
    res.json(rows);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "..", "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
