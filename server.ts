import express from "express";
import { createServer as createViteServer } from "vite";
import mysql from "mysql2/promise";
import pg from "pg";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();
app.use(express.json({ limit: "50mb" }));

type DBType = "postgres" | "mysql" | "sqlite";
let dbType: DBType = "sqlite";
let db: any;
let isInitialized = false;

function formatQuery(sql: string): string {
  if (dbType === "postgres") {
    let idx = 1;
    return sql.replace(/\?/g, () => `$${idx++}`);
  }
  return sql;
}

function getDateFilter(): string {
  if (dbType === "postgres") return "DATE(timestamp) = CURRENT_DATE";
  if (dbType === "mysql") return "DATE(timestamp) = CURDATE()";
  return "DATE(timestamp) = date('now', '+8 hours')";
}

async function setupPostgreSQL(connectionString: string) {
  try {
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
    });

    // Test connection
    await pool.query("SELECT 1");

    db = {
      execute: async (sql: string, params: any[] = []) => {
        const pgSql = formatQuery(sql);
        const res = await pool.query(pgSql, params);
        return [res.rows, res];
      },
      query: async (sql: string, params: any[] = []) => {
        const pgSql = formatQuery(sql);
        const res = await pool.query(pgSql, params);
        return [res.rows, res];
      },
    };
    dbType = "postgres";
    console.log("Connected to Neon / PostgreSQL Database");

    // Auto create tables if not exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE,
        password TEXT,
        name TEXT,
        role VARCHAR(50) DEFAULT 'pegawai',
        nip VARCHAR(100),
        class_id INTEGER
      );

      CREATE TABLE IF NOT EXISTS classes (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE
      );

      CREATE TABLE IF NOT EXISTS subjects (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE
      );

      CREATE TABLE IF NOT EXISTS geolocations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        radius INTEGER
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type VARCHAR(50),
        timestamp TIMESTAMP DEFAULT NOW(),
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        address TEXT,
        selfie TEXT
      );

      CREATE TABLE IF NOT EXISTS journals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        class_id INTEGER,
        subject_id INTEGER,
        teaching_hours VARCHAR(100),
        content TEXT,
        selfie TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        timestamp TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        type VARCHAR(50),
        reason TEXT,
        file_url TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    // Migration for teaching_hours column
    try {
      await pool.query("ALTER TABLE journals ADD COLUMN IF NOT EXISTS teaching_hours VARCHAR(100)");
    } catch (e) {}

    // Seed default data for PostgreSQL
    const userRes = await pool.query("SELECT id FROM users LIMIT 1");
    if (userRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)",
        ["admin", "admin123", "Administrator", "admin"]
      );
      await pool.query(
        "INSERT INTO users (username, password, name, role) VALUES ($1, $2, $3, $4)",
        ["guru", "guru123", "Guru Contoh", "guru"]
      );
      console.log("Seeded default users (admin, guru) to PostgreSQL");
    }

    const geoRes = await pool.query("SELECT id FROM geolocations LIMIT 1");
    if (geoRes.rows.length === 0) {
      await pool.query(
        "INSERT INTO geolocations (name, latitude, longitude, radius) VALUES ($1, $2, $3, $4)",
        ["Sekolah", -6.2000, 106.8166, 100]
      );
      console.log("Seeded default geolocation to PostgreSQL");
    }
  } catch (err) {
    console.error("Failed to connect to Neon / PostgreSQL, falling back to SQLite:", err);
    await setupSQLite();
  }
}

async function setupMySQL() {
  try {
    const mysqlConn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
    });
    db = mysqlConn;
    dbType = "mysql";
    console.log("Connected to MySQL Database");
  } catch (err) {
    console.error("Failed to connect to MySQL, falling back to SQLite:", err);
    await setupSQLite();
  }
}

async function setupSQLite() {
  try {
    const sqliteDb = await open({
      filename: "attendance.db",
      driver: sqlite3.Database,
    });
    dbType = "sqlite";

    // Wrapper to mimic mysql2/pg execution for simple queries
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
      },
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
        timestamp DATETIME DEFAULT (datetime('now', '+8 hours')),
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
        teaching_hours TEXT,
        content TEXT,
        selfie TEXT,
        latitude REAL,
        longitude REAL,
        timestamp DATETIME DEFAULT (datetime('now', '+8 hours'))
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        type TEXT,
        reason TEXT,
        file_url TEXT,
        status TEXT DEFAULT 'pending',
        timestamp DATETIME DEFAULT (datetime('now', '+8 hours'))
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
    console.error("Critical Error: SQLite initialization failed:", err);
  }
}

export async function initDB() {
  const pgUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
  if (pgUrl || process.env.PGHOST) {
    const connStr = pgUrl || `postgresql://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT || 5432}/${process.env.PGDATABASE}?sslmode=require`;
    await setupPostgreSQL(connStr);
  } else if (process.env.DB_HOST) {
    await setupMySQL();
  } else {
    await setupSQLite();
  }
}

export async function runMigrations() {
  try {
    if (dbType === "mysql") {
      const [columns]: any = await db.execute("SHOW COLUMNS FROM journals LIKE 'teaching_hours'");
      if (columns.length === 0) {
        await db.execute("ALTER TABLE journals ADD COLUMN teaching_hours TEXT");
      } else {
        const col = columns[0];
        if (col.Type.toLowerCase().includes("int")) {
          await db.execute("ALTER TABLE journals MODIFY COLUMN teaching_hours TEXT");
        }
      }
    } else if (dbType === "postgres") {
      try {
        await db.execute("ALTER TABLE journals ADD COLUMN IF NOT EXISTS teaching_hours VARCHAR(100)");
      } catch (e) {}
    } else {
      const sqliteDb = await open({ filename: "attendance.db", driver: sqlite3.Database });
      try {
        await sqliteDb.exec("ALTER TABLE journals ADD COLUMN teaching_hours TEXT");
      } catch (e) {}
    }
  } catch (err) {
    console.error("Migration error:", err);
  }
}

// Middleware to ensure DB connection is ready before processing API requests
app.use("/api", async (req, res, next) => {
  if (!isInitialized) {
    await initDB();
    await runMigrations();
    isInitialized = true;
  }
  next();
});

// API Routes
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows]: any = await db.execute(
      "SELECT id, username, name, role, nip FROM users WHERE username = ? AND password = ?",
      [username, password]
    );
    const user = rows[0];
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Username atau password salah" });
    }
  } catch (err: any) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Database error: " + err.message });
  }
});

app.get("/api/geolocations", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM geolocations");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/users", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT id, username, name, role, nip FROM users");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/users", async (req, res) => {
  const { username, password, name, role, nip } = req.body;
  try {
    await db.execute("INSERT INTO users (username, password, name, role, nip) VALUES (?, ?, ?, ?, ?)", [
      username,
      password,
      name,
      role,
      nip,
    ]);
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
      await db.execute(
        "UPDATE users SET username = ?, password = ?, name = ?, role = ?, nip = ? WHERE id = ?",
        [username, password, name, role, nip, id]
      );
    } else {
      await db.execute("UPDATE users SET username = ?, name = ?, role = ?, nip = ? WHERE id = ?", [
        username,
        name,
        role,
        nip,
        id,
      ]);
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
  try {
    const [rows] = await db.execute("SELECT * FROM classes");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/classes", async (req, res) => {
  try {
    await db.execute("INSERT INTO classes (name) VALUES (?)", [req.body.name]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/subjects", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM subjects");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/subjects", async (req, res) => {
  try {
    await db.execute("INSERT INTO subjects (name) VALUES (?)", [req.body.name]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/geolocations", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM geolocations");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/admin/geolocations", async (req, res) => {
  const { name, latitude, longitude, radius } = req.body;
  try {
    await db.execute("DELETE FROM geolocations");
    await db.execute("INSERT INTO geolocations (name, latitude, longitude, radius) VALUES (?, ?, ?, ?)", [
      name,
      latitude,
      longitude,
      radius,
    ]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/attendance", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT a.*, u.name as user_name 
      FROM attendance a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.timestamp DESC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Batch Import Endpoints for Excel
app.post("/api/admin/import/users", async (req, res) => {
  try {
    const { users } = req.body;
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: "Data users kosong atau format tidak valid" });
    }

    let inserted = 0;
    let updated = 0;

    for (const u of users) {
      if (!u.username || !u.name) continue;
      const role = u.role ? String(u.role).toLowerCase() : "pegawai";
      const validRole = ["admin", "guru", "pegawai"].includes(role) ? role : "pegawai";
      const password = u.password ? String(u.password) : "123456";
      const nip = u.nip ? String(u.nip) : null;

      const [existing]: any = await db.execute("SELECT id FROM users WHERE username = ?", [u.username]);
      if (existing && existing.length > 0) {
        if (u.password) {
          await db.execute(
            "UPDATE users SET name = ?, password = ?, role = ?, nip = ? WHERE username = ?",
            [u.name, password, validRole, nip, u.username]
          );
        } else {
          await db.execute(
            "UPDATE users SET name = ?, role = ?, nip = ? WHERE username = ?",
            [u.name, validRole, nip, u.username]
          );
        }
        updated++;
      } else {
        await db.execute(
          "INSERT INTO users (username, password, name, role, nip) VALUES (?, ?, ?, ?, ?)",
          [u.username, password, u.name, validRole, nip]
        );
        inserted++;
      }
    }

    res.json({ success: true, count: users.length, inserted, updated });
  } catch (err: any) {
    console.error("Import users error:", err);
    res.status(500).json({ success: false, message: "Gagal import user: " + err.message });
  }
});

app.post("/api/admin/import/journals", async (req, res) => {
  try {
    const { journals } = req.body;
    if (!Array.isArray(journals) || journals.length === 0) {
      return res.status(400).json({ success: false, message: "Data jurnal kosong atau format tidak valid" });
    }

    const [users]: any = await db.execute("SELECT id, username, name FROM users");
    const [classes]: any = await db.execute("SELECT id, name FROM classes");
    const [subjects]: any = await db.execute("SELECT id, name FROM subjects");

    const userList = Array.isArray(users) ? users : [];
    const classList = Array.isArray(classes) ? classes : [];
    const subjectList = Array.isArray(subjects) ? subjects : [];

    let inserted = 0;
    const errors: string[] = [];

    for (let idx = 0; idx < journals.length; idx++) {
      const j = journals[idx];
      const rowNum = idx + 2;

      let userId = j.userId;
      if (!userId && (j.teacherName || j.username)) {
        const queryTerm = String(j.username || j.teacherName || "").trim().toLowerCase();
        const matched = userList.find(
          (u: any) =>
            u.username.toLowerCase() === queryTerm ||
            u.name.toLowerCase() === queryTerm ||
            u.name.toLowerCase().includes(queryTerm)
        );
        if (matched) {
          userId = matched.id;
        }
      }

      if (!userId) {
        errors.push(`Baris ${rowNum}: Guru "${j.teacherName || j.username || ""}" tidak ditemukan di sistem.`);
        continue;
      }

      let classId = j.classId;
      if (!classId && j.className) {
        const cName = String(j.className).trim();
        let matchedClass = classList.find((c: any) => c.name.toLowerCase() === cName.toLowerCase());
        if (!matchedClass) {
          await db.execute("INSERT INTO classes (name) VALUES (?)", [cName]);
          const [newC]: any = await db.execute("SELECT id, name FROM classes WHERE name = ?", [cName]);
          if (newC && newC[0]) {
            matchedClass = newC[0];
            classList.push(matchedClass);
          }
        }
        if (matchedClass) {
          classId = matchedClass.id;
        }
      }

      if (!classId) {
        errors.push(`Baris ${rowNum}: Nama kelas "${j.className || ""}" tidak valid.`);
        continue;
      }

      let subjectId = j.subjectId;
      if (!subjectId && j.subjectName) {
        const sName = String(j.subjectName).trim();
        let matchedSubject = subjectList.find((s: any) => s.name.toLowerCase() === sName.toLowerCase());
        if (!matchedSubject) {
          await db.execute("INSERT INTO subjects (name) VALUES (?)", [sName]);
          const [newS]: any = await db.execute("SELECT id, name FROM subjects WHERE name = ?", [sName]);
          if (newS && newS[0]) {
            matchedSubject = newS[0];
            subjectList.push(matchedSubject);
          }
        }
        if (matchedSubject) {
          subjectId = matchedSubject.id;
        }
      }

      if (!subjectId) {
        errors.push(`Baris ${rowNum}: Nama mata pelajaran "${j.subjectName || ""}" tidak valid.`);
        continue;
      }

      const teachingHours = j.teachingHours ? String(j.teachingHours).trim() : "1";
      const content = j.content ? String(j.content).trim() : "Kegiatan Belajar Mengajar";
      const selfie = j.selfie || null;
      const latitude = j.latitude ? Number(j.latitude) : null;
      const longitude = j.longitude ? Number(j.longitude) : null;
      const timestamp = j.timestamp || new Date().toISOString().slice(0, 19).replace("T", " ");

      await db.execute(
        `INSERT INTO journals (user_id, class_id, subject_id, teaching_hours, content, selfie, latitude, longitude, timestamp)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, classId, subjectId, teachingHours, content, selfie, latitude, longitude, timestamp]
      );

      inserted++;
    }

    res.json({ success: true, count: journals.length, inserted, errors });
  } catch (err: any) {
    console.error("Import journals error:", err);
    res.status(500).json({ success: false, message: "Gagal import jurnal: " + err.message });
  }
});

app.post("/api/admin/import/classes", async (req, res) => {
  try {
    const { classes } = req.body;
    if (!Array.isArray(classes)) {
      return res.status(400).json({ success: false, message: "Data kelas tidak valid" });
    }
    let inserted = 0;
    for (const name of classes) {
      if (!name || typeof name !== "string") continue;
      const trimmed = name.trim();
      const [existing]: any = await db.execute("SELECT id FROM classes WHERE name = ?", [trimmed]);
      if (!existing || existing.length === 0) {
        await db.execute("INSERT INTO classes (name) VALUES (?)", [trimmed]);
        inserted++;
      }
    }
    res.json({ success: true, inserted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/admin/import/subjects", async (req, res) => {
  try {
    const { subjects } = req.body;
    if (!Array.isArray(subjects)) {
      return res.status(400).json({ success: false, message: "Data mapel tidak valid" });
    }
    let inserted = 0;
    for (const name of subjects) {
      if (!name || typeof name !== "string") continue;
      const trimmed = name.trim();
      const [existing]: any = await db.execute("SELECT id FROM subjects WHERE name = ?", [trimmed]);
      if (!existing || existing.length === 0) {
        await db.execute("INSERT INTO subjects (name) VALUES (?)", [trimmed]);
        inserted++;
      }
    }
    res.json({ success: true, inserted });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/admin/journals", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT j.*, u.name as user_name, c.name as class_name, s.name as subject_name
      FROM journals j
      LEFT JOIN users u ON j.user_id = u.id
      LEFT JOIN classes c ON j.class_id = c.id
      LEFT JOIN subjects s ON j.subject_id = s.id
      ORDER BY j.timestamp DESC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/permissions", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT p.*, u.name as user_name
      FROM permissions p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.timestamp DESC
    `);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/attendance", async (req, res) => {
  const { userId, type, latitude, longitude, address, selfie } = req.body;
  try {
    const [existing]: any = await db.execute(
      `SELECT type FROM attendance WHERE user_id = ? AND type = ? AND ${getDateFilter()}`,
      [userId, type]
    );

    if (existing && existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Anda sudah melakukan absen ${type === "in" ? "masuk" : "pulang"} hari ini.`,
      });
    }

    await db.execute(
      `INSERT INTO attendance (user_id, type, latitude, longitude, address, selfie)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, type, latitude, longitude, address, selfie]
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error("Attendance error:", err);
    res.status(500).json({ success: false, message: "Gagal menyimpan absensi: " + err.message });
  }
});

app.get("/api/classes", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM classes");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/subjects", async (req, res) => {
  try {
    const [rows] = await db.execute("SELECT * FROM subjects");
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/journals", async (req, res) => {
  const { userId, classId, subjectId, teachingHours, content, selfie, latitude, longitude } = req.body;
  try {
    await db.execute(
      `INSERT INTO journals (user_id, class_id, subject_id, teaching_hours, content, selfie, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, classId, subjectId, teachingHours, content, selfie, latitude, longitude]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post("/api/permissions", async (req, res) => {
  const { userId, type, reason, fileUrl } = req.body;
  try {
    await db.execute(
      `INSERT INTO permissions (user_id, type, reason, file_url)
      VALUES (?, ?, ?, ?)`,
      [userId, type, reason, fileUrl]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const [uRows]: any = await db.execute("SELECT COUNT(*) as count FROM users");
    const [aRows]: any = await db.execute(`SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE ${getDateFilter()}`);
    const [pRows]: any = await db.execute("SELECT COUNT(*) as count FROM permissions WHERE status = 'pending'");

    res.json({
      totalUsers: Number(uRows[0]?.count || 0),
      todayAttendance: Number(aRows[0]?.count || 0),
      pendingPermissions: Number(pRows[0]?.count || 0),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/attendance/history/:userId", async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.execute(
      `SELECT * FROM attendance WHERE user_id = ? ORDER BY timestamp DESC LIMIT 50`,
      [userId]
    );
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export async function startServer() {
  await initDB();
  await runMigrations();
  isInitialized = true;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// In local/dev/container environment, start the server automatically
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
  startServer();
}
