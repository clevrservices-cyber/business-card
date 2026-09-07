import type { ContactRecord } from "../../domain/contact.js";
import { capabilities } from "../ai/registry.js";
import { htmlToText } from "../http/html-to-text.js";
import { safeFetchText } from "../http/safe-fetch.js";

export function isFetchableUrl(content: string): boolean {
  try {
    const parsed = new URL(content.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Never rejects — every failure mode (blocked/timeout/too-large/non-html/
 * extraction-empty) degrades to `undefined`, exactly like the vCard path
 * degrades when there's no QR at all. Callers rely on this contract to run
 * it inside Promise.all alongside the vision call without a catch.
 */
export async function enrichContactFromQrUrl(rawUrl: string): Promise<Partial<ContactRecord> | undefined> {
  try {
    const fetched = await safeFetchText(rawUrl.trim(), { timeoutMs: 5000, maxBytes: 1_000_000, maxRedirects: 2 });
    if (!fetched.ok || !fetched.body) return undefined;
    if (!fetched.contentType || !/text\/html/i.test(fetched.contentType)) return undefined;

    const text = htmlToText(fetched.body);
    if (text.length < 20) return undefined;

    const result = await capabilities["text.extractContact"].run({ text, sourceUrl: fetched.finalUrl });
    return result.contact;
  } catch (error) {
    console.warn(`[qr] URL enrichment skipped for "${rawUrl}":`, (error as Error).message);
    return undefined;
  }
}
