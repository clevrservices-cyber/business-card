# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Card Reader / Business Card Scanner: photograph or upload a business card (front, optional back)
and get back a structured, editable contact. [README.md](README.md) is Lovable's original
frontend-only build brief and remains the historical spec of that half — this file covers the
current, actual state of both halves.

Two halves:

- **`src/`** — the frontend (TanStack Start / React 19, Lovable-generated). `src/lib/scan-api.ts`
  is the API boundary to the real backend; most components are untouched from what Lovable
  produced, except the contact review screen (`ContactResults.tsx` and its `scanner/` siblings),
  which now also has a networking-notes block (Contact Event, Tags, voice-recorded connection
  notes, follow-up Actions) added directly on top of Lovable's original layout conventions.
- **`backend/`** — real, working. Bun + TypeScript + Express + Postgres, vision extraction behind
  a swappable provider registry (OpenAI `gpt-4o` if `OPENAI_API_KEY` is set, else Anthropic Claude
  if `ANTHROPIC_API_KEY` is set, else a zero-cost stub), independent QR/vCard detection (plus an
  SSRF-guarded fetch+extract pass when a QR links to a URL instead of a vCard), cross-side
  merge/validation/normalization, and voice-note transcription (Whisper) + grammar-correct/summarize
  (a cheaper text-only OpenAI model).

## Production deployment

**Self-hosted on this box, single origin**: `businesscard.arundopower.com`. This domain used to
point at Lovable's own hosting for the frontend, with the backend on a separate subdomain — the
user repointed DNS here and asked to drop Lovable as the hosting provider, so it's now one domain,
routed by Traefik (`/opt/docker/reverse-proxy/traefik/dynamic/businesscard.yml`, same two-router
pattern as `avatar-studio.yml`): `PathPrefix(/api)` → `cardreader-backend:8090`, everything else →
`cardreader-frontend:3020`. One origin means the frontend's same-origin `/api/...` calls just work
with **no CORS needed in production** (`VITE_API_URL` is intentionally unset for the deployed
service).

```bash
cp .env.example .env && cp backend/.env.example backend/.env   # first run only
docker compose up -d --build                                   # from the repo root
docker compose up -d --build cardreader-frontend                # after a frontend change
docker restart cardreader-backend                                # after a backend change (bind-mounted)
```

Traefik watches its `dynamic/` directory live — no restart needed there after editing routes. Its
label decorations in `docker-compose.yml` do nothing on their own; this box's Traefik is
file-provider only.

**The frontend is a real production build, not a dev server.** `Dockerfile` (repo root) builds
with `NITRO_PRESET=node-server` — this template's helper (`@lovable.dev/vite-tanstack-config`)
defaults Nitro to a Cloudflare target, but only inside Lovable's own build sandbox
(`LOVABLE_SANDBOX`/`DEV_SERVER__PROJECT_PATH` set); outside it, an explicit `NITRO_PRESET` env var
wins, no `vite.config.ts` edit needed. **`NODE_ENV=production` must also be set at build time** —
without it the SSR bundle picks React's dev JSX transform (`jsx-dev-runtime`), which isn't in this
preset's traced output and fails every request with `jsxDEV is not a function`; found by actually
booting the build, not assumed. Output is a self-contained `.output/server/index.mjs` (Nitro
traces and bundles its own runtime deps into `.output/server/node_modules` — no second `bun
install` needed in the runtime image).

The backend's `Dockerfile` is a normal Bun/Express image; `docker-compose.yml` bind-mounts
`backend/` over it for dev convenience (`bun --watch`), so a backend code change just needs a
container restart, not a rebuild. The frontend has no such bind mount — a production build is
meant to be rebuilt on deploy, not live-edited.

## Backend

See `backend/CLAUDE.md`-equivalent detail inline here (no separate file yet): Postgres via raw
`pg` + numbered SQL migrations (`backend/src/infrastructure/db/migrations/`, run automatically on
boot in `main.ts`), an AI capability registry
(`backend/src/infrastructure/ai/registry.ts`) binding `vision.extract`, `text.extractContact`,
`audio.transcribe`, and `text.correctAndSummarize` to OpenAI, Anthropic (vision only), or a
stub — first configured key wins, in that order (`backend/src/infrastructure/ai/providers/`) —
and QR detection (`jsQR` + `sharp`) that runs independently of the vision call and only feeds in
as corroborating evidence during merge (`backend/src/domain/merge-sides.ts`) — never silently
overwrites the visual reading.

**QR-URL enrichment**: if a decoded QR code isn't a vCard but is a plain `http(s)` URL, the backend
fetches it (`backend/src/infrastructure/http/safe-fetch.ts`) and runs the page text through
`text.extractContact`, merged in exactly like vCard data. The fetch is SSRF-guarded: scheme
allowlist, DNS-resolved-IP validation against private/loopback/link-local/reserved ranges
(including the `169.254.169.254` cloud metadata address), connects to the pre-validated IP directly
(closes the DNS-rebinding gap), and **re-validates on every redirect hop**, not just the initial
URL — a redirect can repoint to an internal address after the first hop passed. Runs concurrently
with the vision call (`Promise.all` in `scan.ts`), not serially, since neither depends on the
other's result. Never fails the scan — every failure mode (blocked, timeout, too-large, non-html)
degrades to "no enrichment," logged as `[qr] URL enrichment skipped for "...": ...`.

**Reusable Contact Event / Tags**: two flat lookup tables (`002_lookup_tables.sql`, case-insensitive
unique index on `lower(name)`), upserted from `confirm.ts` when a confirmed contact carries them,
listed via `GET /api/business-card/{contact-events,tags}` for the frontend's creatable dropdown/tag
input.

**Voice notes**: `POST /api/business-card/transcribe` (multer, `MAX_AUDIO_MB` limit) runs
`audio.transcribe` (Whisper) then `text.correctAndSummarize` (a separate, cheaper
`OPENAI_TEXT_MODEL` — default `gpt-4o-mini` — from the vision model) and returns the corrected/
summarized text. Used by both "Describe connection" and each Action's description
(`src/hooks/use-voice-recorder.ts`, browser `MediaRecorder`, 20s auto-stop).

```bash
cd backend
bun install
bun run dev          # bun --watch src/main.ts
bun run migrate       # bun src/infrastructure/db/migrations runner
bun test               # DB-dependent tests skip automatically if postgres isn't reachable; .env.test
                         # forces the stub AI provider even though the real .env has a live key, so
                         # `bun test` never makes a real (paid) API call
bun run typecheck
```

## Local dev (frontend + backend on different ports, needs CORS)

```bash
cd backend && bun run dev            # :8090
VITE_API_URL=http://localhost:8090 bun run dev -- --port 3020   # repo root, separate terminal
```

`CORS_ORIGIN` in `backend/.env` must include whatever origin the dev frontend runs on
(`http://localhost:3020` by default) — this only matters for this local split-origin case; the
real deployment is same-origin and doesn't use CORS at all.

## Known gaps (not implemented, deliberately)

OCR fallback (interface exists, no body — Claude's vision handles OCR directly), vCard export,
CRM exporters, auth/rate limiting (no login exists anywhere in the frontend; this is a real public
production domain today with no auth in front of it — flagged, not silently fixed without being
asked).

**DB-dependent tests share the real Postgres instance** with the dev/production backend (both
point at `127.0.0.1:5439`, same database) — `bun test` writes real rows into `scans`/`contacts`/
`tags`/`contact_events`, not an isolated test database. `.env.test` blanking the AI keys stops tests
from making live paid API calls, but doesn't stop this data pollution. Worth a real fix (separate
test DB or schema) if this starts mattering — not done here since it's a pre-existing pattern, not
something this change introduced, and picking the fix (separate DB vs. transaction-rollback-per-test
vs. something else) is a call worth making deliberately, not as a drive-by.
