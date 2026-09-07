import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import express, { type Express } from "express";
import type { Server } from "node:http";
import { Pool } from "pg";
import sharp from "sharp";

import { confirmRouter } from "../src/interfaces/http/routes/confirm.js";
import { scanRouter } from "../src/interfaces/http/routes/scan.js";

// Runs the stub provider (no ANTHROPIC_API_KEY needed) — the validation tests
// below need no database at all. The full-pipeline tests do, and are skipped
// unless postgres is actually reachable (a syntactically valid but unreachable
// DATABASE_URL, e.g. from .env.test, must not make these look runnable).
async function probeDb(): Promise<boolean> {
  const url = process.env["DATABASE_URL"];
  if (!url) return false;
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 500 });
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  } finally {
    await pool.end().catch(() => undefined);
  }
}
const hasDb = await probeDb();

let server: Server;
let baseUrl: string;

// bun-types returns Response.json() as Promise<unknown>; these tests intentionally
// poke at arbitrary response-body shape, so a single cast point is simplest.
async function jsonBody(res: Response): Promise<any> {
  return res.json();
}

beforeAll(async () => {
  const app: Express = express();
  app.use(express.json());
  app.use(scanRouter);
  app.use(confirmRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const address = server.address();
  const port = typeof address === "object" && address ? address.port : 0;
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(() => {
  server.close();
});

async function tinyPng(): Promise<Blob> {
  const buffer = await sharp({
    create: { width: 20, height: 20, channels: 3, background: { r: 200, g: 200, b: 200 } },
  })
    .png()
    .toBuffer();
  return new Blob([buffer], { type: "image/png" });
}

describe("POST /api/business-card/scan — validation (no database needed)", () => {
  test("rejects a request with no front image", async () => {
    const res = await fetch(`${baseUrl}/api/business-card/scan`, { method: "POST", body: new FormData() });
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.success).toBe(false);
    expect(body.code).toBe("UPLOAD_FAILED");
  });

  test("rejects an unsupported image format", async () => {
    const form = new FormData();
    form.append("front", new Blob([new Uint8Array([1, 2, 3])], { type: "image/gif" }), "front.gif");

    const res = await fetch(`${baseUrl}/api/business-card/scan`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.code).toBe("UNSUPPORTED_FORMAT");
  });

  test("rejects a file that claims to be an image but isn't readable", async () => {
    const form = new FormData();
    form.append("front", new Blob([new Uint8Array([1, 2, 3, 4])], { type: "image/png" }), "front.png");

    const res = await fetch(`${baseUrl}/api/business-card/scan`, { method: "POST", body: form });
    expect(res.status).toBe(400);
    const body = await jsonBody(res);
    expect(body.code).toBe("IMAGE_UNPROCESSABLE");
  });
});

describe.skipIf(!hasDb)("POST /api/business-card/scan — full pipeline (needs DATABASE_URL)", () => {
  test("runs the stub provider end to end and returns a ScanResult-shaped body", async () => {
    const form = new FormData();
    form.append("front", await tinyPng(), "front.png");

    const res = await fetch(`${baseUrl}/api/business-card/scan`, { method: "POST", body: form });
    // The stub provider extracts nothing from a blank image, so this is the
    // documented NO_CONTACT_DETECTED path — still proves upload -> preprocess
    // -> QR -> vision -> merge -> DB round-trips without throwing.
    expect(res.status).toBe(422);
    const body = await jsonBody(res);
    expect(body.success).toBe(false);
    expect(body.code).toBe("NO_CONTACT_DETECTED");
    expect(body.partial.contact).toBeDefined();
    expect(body.partial.warnings.some((w: { code: string }) => w.code === "AI_NOT_CONFIGURED")).toBe(
      Boolean(!process.env["OPENAI_API_KEY"] && !process.env["ANTHROPIC_API_KEY"]),
    );
  });
});

describe.skipIf(!hasDb)("POST /api/business-card/confirm (needs DATABASE_URL)", () => {
  test("persists a confirmed contact and returns an id", async () => {
    const res = await fetch(`${baseUrl}/api/business-card/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: {
          full_name: "Jane Doe",
          emails: [],
          phones: [],
          websites: [],
          address: {},
          social_links: [],
          qr_codes: [],
        },
        front_image: "blob:front",
      }),
    });

    expect(res.status).toBe(200);
    const body = await jsonBody(res);
    expect(body.success).toBe(true);
    expect(typeof body.id).toBe("string");
  });
});
