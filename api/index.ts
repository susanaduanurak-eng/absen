import type { Request, Response } from "express";
import { app, initDB, runMigrations } from "../server.js";

let isReady = false;
let initPromise: Promise<void> | null = null;

async function ensureDBReady() {
  if (!isReady) {
    if (!initPromise) {
      initPromise = (async () => {
        await initDB();
        await runMigrations();
        isReady = true;
      })();
    }
    await initPromise;
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    await ensureDBReady();
    return app(req, res);
  } catch (err: any) {
    console.error("Vercel Serverless Function Error:", err);
    return res.status(500).json({
      success: false,
      message: "Database connection error: " + (err?.message || String(err)),
      hint: "Pastikan DATABASE_URL atau POSTGRES_URL dari Neon sudah terpasang di Vercel Environment Variables.",
    });
  }
}
