import { Router, type Request, type Response } from "express";

import { query } from "../../../infrastructure/db/pool.js";

export const lookupsRouter = Router();

lookupsRouter.get("/api/business-card/contact-events", async (req: Request, res: Response) => {
  const items = await listNames("contact_events", req.query["q"]);
  res.json({ success: true, items });
});

lookupsRouter.get("/api/business-card/tags", async (req: Request, res: Response) => {
  const items = await listNames("tags", req.query["q"]);
  res.json({ success: true, items });
});

async function listNames(table: "contact_events" | "tags", q: unknown): Promise<string[]> {
  const term = typeof q === "string" && q.trim() ? q.trim() : undefined;
  const rows = await query<{ name: string }>(
    term
      ? `SELECT name FROM ${table} WHERE name ILIKE $1 ORDER BY name LIMIT 50`
      : `SELECT name FROM ${table} ORDER BY name LIMIT 50`,
    term ? [`%${term}%`] : [],
  );
  return rows.map((r) => r.name);
}
