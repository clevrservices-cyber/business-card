import * as http from "node:http";
import * as https from "node:https";
import * as net from "node:net";
import { lookup as dnsLookup } from "node:dns/promises";

export type SafeFetchErrorCode =
  | "BLOCKED_URL"
  | "TIMEOUT"
  | "TOO_LARGE"
  | "TOO_MANY_REDIRECTS"
  | "FETCH_FAILED";

export class SafeFetchError extends Error {
  constructor(
    readonly code: SafeFetchErrorCode,
    message: string,
  ) {
    super(message);
  }
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
}

export interface SafeFetchResult {
  ok: boolean;
  status: number;
  contentType?: string | undefined;
  body?: string | undefined;
  finalUrl: string;
}

function isPrivateOrReservedIPv4(ip: string): boolean {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const a = Number(m[1]);
  const b = Number(m[2]);
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local, incl. 169.254.169.254 cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a >= 224) return true; // multicast + reserved (224/4, 240/4)
  return false;
}

function isPrivateOrReservedIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;
  if (lower.startsWith("fe80:")) return true; // link-local
  if (/^f[cd][0-9a-f]{2}:/.test(lower)) return true; // fc00::/7 unique local
  const v4 = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  return v4 ? isPrivateOrReservedIPv4(v4[1]!) : false;
}

export function isPrivateOrReservedIp(ip: string, family: number): boolean {
  return family === 6 ? isPrivateOrReservedIPv6(ip) : isPrivateOrReservedIPv4(ip);
}

async function resolveAndValidate(hostname: string): Promise<{ address: string; family: number }> {
  const literalFamily = net.isIP(hostname);
  if (literalFamily) {
    if (isPrivateOrReservedIp(hostname, literalFamily)) {
      throw new SafeFetchError("BLOCKED_URL", `Refusing to fetch private/reserved address: ${hostname}`);
    }
    return { address: hostname, family: literalFamily };
  }
  const addresses = await dnsLookup(hostname, { all: true, verbatim: true });
  if (addresses.length === 0) {
    throw new SafeFetchError("BLOCKED_URL", `Could not resolve host: ${hostname}`);
  }
  for (const a of addresses) {
    if (isPrivateOrReservedIp(a.address, a.family)) {
      throw new SafeFetchError(
        "BLOCKED_URL",
        `"${hostname}" resolves to a private/reserved address (${a.address}) — refusing to fetch`,
      );
    }
  }
  return addresses[0]!;
}

function requestOnce(
  parsed: URL,
  pinned: { address: string; family: number },
  timeoutMs: number,
  maxBytes: number,
): Promise<{ status: number; contentType?: string; body?: string; redirectLocation?: string }> {
  return new Promise((resolve, reject) => {
    const lib = parsed.protocol === "https:" ? https : http;
    const req = lib.request(
      {
        // Connect directly to the pre-validated IP — never re-resolve the
        // hostname at connect time. This closes the DNS-rebinding gap
        // between validation and the real request; the Host header (and
        // TLS servername for SNI/cert checks) still carries the original name.
        hostname: pinned.address,
        port: parsed.port || (parsed.protocol === "https:" ? 443 : 80),
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: { Host: parsed.hostname, "User-Agent": "cardreader-qr-enrichment/1.0", Accept: "text/html" },
        timeout: timeoutMs,
        ...(parsed.protocol === "https:" ? { servername: parsed.hostname } : {}),
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
          res.resume();
          resolve({ status, redirectLocation: res.headers.location });
          return;
        }
        const contentType = res.headers["content-type"];
        let received = 0;
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => {
          received += chunk.length;
          if (received > maxBytes) {
            req.destroy();
            reject(new SafeFetchError("TOO_LARGE", `Response exceeded ${maxBytes} bytes`));
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ status, contentType, body: Buffer.concat(chunks).toString("utf8") }));
      },
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("TIMEOUT", `Timed out after ${timeoutMs}ms`)));
    req.on("error", (err) =>
      reject(err instanceof SafeFetchError ? err : new SafeFetchError("FETCH_FAILED", err.message)),
    );
    req.end();
  });
}

export async function safeFetchText(inputUrl: string, opts: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = opts.timeoutMs ?? 5000;
  const maxBytes = opts.maxBytes ?? 1_000_000;
  const maxRedirects = opts.maxRedirects ?? 2;
  let currentUrl = inputUrl;

  for (let hop = 0; ; hop++) {
    const parsed = new URL(currentUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new SafeFetchError("BLOCKED_URL", `Unsupported URL scheme: ${parsed.protocol}`);
    }
    // Re-resolved and re-validated every hop — a redirect can repoint to an
    // internal address after the first hop passed.
    const pinned = await resolveAndValidate(parsed.hostname);
    const result = await requestOnce(parsed, pinned, timeoutMs, maxBytes);
    if (result.redirectLocation) {
      if (hop >= maxRedirects) {
        throw new SafeFetchError("TOO_MANY_REDIRECTS", `Exceeded ${maxRedirects} redirects`);
      }
      currentUrl = new URL(result.redirectLocation, currentUrl).toString();
      continue;
    }
    return {
      ok: result.status < 400,
      status: result.status,
      contentType: result.contentType,
      body: result.body,
      finalUrl: currentUrl,
    };
  }
}
