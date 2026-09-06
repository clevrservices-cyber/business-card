import type { ConfidenceMap, ContactRecord, QrCodeEntry, ScanWarning } from "./contact.js";
import { nextId } from "./contact.js";

/** Scalar fields worth cross-checking between the visible card and a decoded vCard QR. */
const SCALAR_FIELDS = [
  "first_name",
  "last_name",
  "full_name",
  "job_title",
  "department",
  "company",
] as const satisfies readonly (keyof ContactRecord)[];

export interface MergeInput {
  vlmContact: ContactRecord;
  vlmConfidence: ConfidenceMap;
  qrEntries: QrCodeEntry[];
  /** A partial contact decoded from a vCard QR code, if one was found. Corroborating evidence only. */
  qrContact?: Partial<ContactRecord> | undefined;
}

export interface MergeResult {
  contact: ContactRecord;
  confidence: ConfidenceMap;
  warnings: ScanWarning[];
}

function normalizeForCompare(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeKey(value: string): string {
  return normalizeForCompare(value);
}

/**
 * Combines the vision model's reading of the printed card with independently
 * decoded QR/vCard evidence. Agreement raises confidence; disagreement is
 * flagged as a warning rather than silently resolved — neither source is
 * trusted blindly (spec: cross-validation).
 */
export function mergeContactSides(input: MergeInput): MergeResult {
  const contact: ContactRecord = structuredClone(input.vlmContact);
  const confidence: ConfidenceMap = { ...input.vlmConfidence };
  const warnings: ScanWarning[] = [];

  contact.qr_codes = input.qrEntries;

  const qrContact = input.qrContact;
  if (!qrContact) {
    return { contact, confidence, warnings };
  }

  for (const field of SCALAR_FIELDS) {
    const qrValue = qrContact[field];
    if (typeof qrValue !== "string" || qrValue.trim() === "") continue;

    const cardValue = contact[field];
    if (typeof cardValue !== "string" || cardValue.trim() === "") {
      (contact as unknown as Record<string, unknown>)[field] = qrValue;
      confidence[field] = "medium";
      continue;
    }

    if (normalizeForCompare(cardValue) === normalizeForCompare(qrValue)) {
      confidence[field] = "high";
    } else {
      // A genuine disagreement between two independent sources is exactly what
      // "low" confidence exists to flag — this isn't a mild reduction.
      confidence[field] = "low";
      warnings.push({
        code: "FIELD_CONFLICT",
        message: `${field} differs between the printed card ("${cardValue}") and the QR code ("${qrValue}")`,
      });
    }
  }

  if (qrContact.emails) {
    const existing = new Set(contact.emails.map((e) => dedupeKey(e.value)));
    for (const email of qrContact.emails) {
      const key = dedupeKey(email.value);
      if (existing.has(key)) continue;
      existing.add(key);
      confidence[`emails.${contact.emails.length}`] = "medium";
      contact.emails.push({ ...email, id: nextId() });
    }
  }

  if (qrContact.phones) {
    const existing = new Set(contact.phones.map((p) => dedupeKey(p.value)));
    for (const phone of qrContact.phones) {
      const key = dedupeKey(phone.value);
      if (existing.has(key)) continue;
      existing.add(key);
      confidence[`phones.${contact.phones.length}`] = "medium";
      contact.phones.push({ ...phone, id: nextId() });
    }
  }

  if (qrContact.websites) {
    const existing = new Set(contact.websites.map((w) => dedupeKey(w.value)));
    for (const website of qrContact.websites) {
      const key = dedupeKey(website.value);
      if (existing.has(key)) continue;
      existing.add(key);
      confidence[`websites.${contact.websites.length}`] = "medium";
      contact.websites.push({ ...website, id: nextId() });
    }
  }

  return { contact, confidence, warnings };
}
