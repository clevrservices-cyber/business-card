import type { ContactRecord, ScanWarning } from "./contact.js";

/**
 * A plausibility check, not a full RFC 5322 grammar — good enough to catch
 * OCR/VLM garbage ("john.smithÂ©abc.com") without rejecting real addresses.
 */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isPlausibleEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/**
 * Adds a scheme when the card printed a bare domain ("www.acme.com") and
 * validates the result. Returns undefined when the value cannot be turned
 * into a URL at all, rather than throwing.
 */
export function normalizeUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (trimmed === "") return undefined;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withScheme).toString();
  } catch {
    return undefined;
  }
}

/**
 * Flags implausible emails and unparseable URLs as warnings without rejecting
 * or mutating the contact — postal address formats are deliberately NOT
 * validated against a Western template (spec: cards follow local conventions).
 */
export function validateContact(contact: ContactRecord): ScanWarning[] {
  const warnings: ScanWarning[] = [];

  contact.emails.forEach((email, index) => {
    if (!isPlausibleEmail(email.value)) {
      warnings.push({
        code: "EMAIL_IMPLAUSIBLE",
        message: `emails.${index} ("${email.value}") does not look like a valid email address`,
      });
    }
  });

  contact.websites.forEach((website, index) => {
    if (normalizeUrl(website.value) === undefined) {
      warnings.push({
        code: "URL_INVALID",
        message: `websites.${index} ("${website.value}") could not be parsed as a URL`,
      });
    }
  });

  return warnings;
}
