-- Business card scanner initial schema.
--
-- `scans` records every extraction attempt (for debugging/reprocessing);
-- `contacts` holds the user-confirmed, authoritative record after review.
-- No images table: uploads are processed in memory/temp-disk and discarded
-- once a scan completes (spec: temporary storage by default). scans.contact
-- and raw_extraction are enough to audit or reprocess a scan without the photo.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE scans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status          TEXT NOT NULL DEFAULT 'processing', -- processing | completed | failed
  vision_provider TEXT,                                -- 'anthropic-claude' | 'stub'
  qr_detected     BOOLEAN NOT NULL DEFAULT false,
  raw_extraction  JSONB,          -- the vision model's own output, pre-merge
  contact         JSONB,          -- final ContactRecord after merge/validate/normalize
  confidence      JSONB,
  warnings        JSONB NOT NULL DEFAULT '[]',
  error_message   TEXT,
  duration_ms     INTEGER,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE contacts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_id      UUID REFERENCES scans(id) ON DELETE SET NULL,
  contact      JSONB NOT NULL,   -- the corrected ContactRecord, as confirmed by the user
  corrections  JSONB,            -- diff vs. scans.contact, for future "frequently misread fields" analysis
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX contacts_scan_id_idx ON contacts (scan_id);
