-- Reusable lookup tables backing two creatable UI controls on the review
-- screen: "Contact Event" (single, creatable combobox) and "Tag" (multi,
-- creatable chips). Deliberately flat name lists, NOT a normalized
-- contacts<->tags join table -- this mirrors 001_init.sql's existing choice
-- to round-trip the whole ContactRecord as one JSONB blob with no per-field
-- columns; these tables exist purely to power autocomplete/dedup of names
-- across scans, not to relationally model tag membership.
--
-- Case-insensitive dedup: "Web Summit 2026" and "web summit 2026" are the
-- same event. A unique index on lower(name) enforces this and doubles as
-- the ON CONFLICT target for the upsert-on-confirm in confirm.ts.

CREATE TABLE contact_events (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX contact_events_name_lower_idx ON contact_events (lower(name));

CREATE TABLE tags (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX tags_name_lower_idx ON tags (lower(name));
