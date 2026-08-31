import type { Request, Response } from "express";
import { app, initDB, runMigrations } from "../server.js";

let isReady = false;

export default async function handler(req: Request, res: Response) {
  if (!isReady) {
    await initDB();
    await runMigrations();
    isReady = true;
  }
  return app(req, res);
}
