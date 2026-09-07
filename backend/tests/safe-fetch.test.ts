import { describe, expect, test } from "bun:test";

import { isPrivateOrReservedIp, safeFetchText, SafeFetchError } from "../src/infrastructure/http/safe-fetch.js";

/** Real reachability probe — this repo's established pattern (see scan-route.test.ts's hasDb) for
 * skipping a test gracefully when an external dependency isn't reachable, rather than failing on
 * something unrelated to the behavior under test. */
async function canReachHttpbin(): Promise<boolean> {
  try {
    const res = await fetch("https://httpbin.org/status/200", { signal: AbortSignal.timeout(4000) });
    return res.ok;
  } catch {
    return false;
  }
}
const hasInternet = await canReachHttpbin();

describe("isPrivateOrReservedIp", () => {
  test.each([
    ["0.0.0.0", 4],
    ["10.1.2.3", 4],
    ["127.0.0.1", 4],
    ["169.254.169.254", 4], // cloud metadata address
    ["169.254.0.1", 4],
    ["172.16.0.1", 4],
    ["172.31.255.255", 4],
    ["192.168.1.1", 4],
    ["100.64.0.1", 4],
    ["100.127.255.255", 4],
    ["224.0.0.1", 4],
    ["::1", 6],
    ["fe80::1", 6],
    ["fc00::1", 6],
    ["fd00::1", 6],
  ])("flags %s as private/reserved", (ip, family) => {
    expect(isPrivateOrReservedIp(ip, family)).toBe(true);
  });

  test.each([
    ["8.8.8.8", 4],
    ["1.1.1.1", 4],
    ["93.184.216.34", 4],
    ["172.15.255.255", 4], // just below 172.16.0.0/12
    ["172.32.0.1", 4], // just above 172.16.0.0/12
    ["2606:4700:4700::1111", 6],
  ])("allows %s as public", (ip, family) => {
    expect(isPrivateOrReservedIp(ip, family)).toBe(false);
  });
});

describe("safeFetchText", () => {
  test("blocks a direct request to a loopback URL", async () => {
    await expect(safeFetchText("http://127.0.0.1:1/")).rejects.toThrow(SafeFetchError);
  });

  test("blocks an unsupported scheme", async () => {
    await expect(safeFetchText("file:///etc/passwd")).rejects.toThrow(SafeFetchError);
  });

  describe.skipIf(!hasInternet)("redirect re-validation (needs real internet access)", () => {
    test("a redirect from a genuinely public host to a private address is blocked, not silently followed", async () => {
      // httpbin.org is a real, public host — this hop passes validation
      // legitimately, proving the block below comes from re-validating the
      // *redirect target*, not just the initial URL (which the "blocks a
      // direct request to a loopback URL" test above already covers).
      const redirectingUrl = "https://httpbin.org/redirect-to?url=http://127.0.0.1:1/&status_code=302";
      await expect(safeFetchText(redirectingUrl)).rejects.toThrow(SafeFetchError);
    });
  });
});
