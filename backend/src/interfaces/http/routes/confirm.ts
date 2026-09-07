import { Router, type Request, type Response } from "express";

import { query, queryOne } from "../../../infrastructure/db/pool.js";
import { confirmContactSchema } from "../dto/contact-schema.js";

export const confirmRouter = Router();

confirmRouter.post("/api/business-card/confirm", async (req: Request, res: Response) => {
  const parsed = confirmContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      success: false,
      code: "UPLOAD_FAILED",
      message: "The confirmed contact was not in the expected shape.",
    });
    return;
  }

  const { contact, scan_id: scanId } = parsed.data;

  const corrections = scanId ? await diffAgainstScan(scanId, contact) : null;

  const rows = await query<{ id: string }>(
    `INSERT INTO contacts (scan_id, contact, corrections) VALUES ($1, $2, $3) RETURNING id`,
    [scanId ?? null, JSON.stringify(contact), corrections ? JSON.stringify(corrections) : null],
  );

  await Promise.all([
    contact.contact_event ? upsertContactEvent(contact.contact_event) : Promise.resolve(),
    contact.tags?.length ? upsertTags(contact.tags) : Promise.resolve(),
  ]);

  res.json({ success: true, id: rows[0]?.id });
});

/** Reusable-dropdown lookup: create on first use, silently reuse on a case-insensitive match. */
async function upsertContactEvent(name: string): Promise<void> {
  const trimmed = name.trim();
  if (!trimmed) return;
  await query(`INSERT INTO contact_events (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING`, [trimmed]);
}

async function upsertTags(names: string[]): Promise<void> {
  const trimmed = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  if (trimmed.length === 0) return;
  await query(`INSERT INTO tags (name) SELECT unnest($1::text[]) ON CONFLICT (lower(name)) DO NOTHING`, [trimmed]);
}

/** A shallow field-level diff against the scan's own extraction, for future "frequently misread fields" analysis. */
async function diffAgainstScan(
  scanId: string,
  corrected: Record<string, unknown>,
): Promise<Record<string, { before: unknown; after: unknown }> | null> {
  const scan = await queryOne<{ contact: Record<string, unknown> | null }>(
    `SELECT contact FROM scans WHERE id = $1`,
    [scanId],
  );
  if (!scan?.contact) return null;

  const diff: Record<string, { before: unknown; after: unknown }> = {};
  for (const key of Object.keys(corrected)) {
    const before = scan.contact[key];
    const after = corrected[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      diff[key] = { before, after };
    }
  }
  return Object.keys(diff).length > 0 ? diff : null;
}
