import { emptyContact, nextId, type ConfidenceMap, type ContactRecord } from "../../domain/contact.js";

/**
 * Raw shape returned by the forced tool/function call — looser than
 * ContactRecord (no ids, optional arrays). Shared by every vision provider
 * since they're all instructed with the same CONTACT_TOOL_SCHEMA.
 */
export interface RawToolInput {
  contact: Partial<ContactRecord> & {
    emails?: { value: string; label?: string }[];
    phones?: { value: string; type: string }[];
    websites?: { value: string; label?: string }[];
    social_links?: { platform: string; value: string }[];
  };
  confidence: ConfidenceMap;
}

export function hydrateContact(raw: RawToolInput["contact"]): ContactRecord {
  const contact = emptyContact();
  contact.first_name = raw.first_name;
  contact.middle_name = raw.middle_name;
  contact.last_name = raw.last_name;
  contact.full_name = raw.full_name;
  contact.job_title = raw.job_title;
  contact.department = raw.department;
  contact.company = raw.company;
  contact.tagline = raw.tagline;
  contact.notes = raw.notes;
  contact.address = raw.address ?? {};
  contact.emails = (raw.emails ?? []).map((e) => ({ id: nextId(), value: e.value, label: e.label }));
  contact.phones = (raw.phones ?? []).map((p) => ({
    id: nextId(),
    value: p.value,
    type: (["mobile", "direct", "office", "home", "fax", "other"] as const).includes(
      p.type as never,
    )
      ? (p.type as ContactRecord["phones"][number]["type"])
      : "other",
  }));
  contact.websites = (raw.websites ?? []).map((w) => ({ id: nextId(), value: w.value, label: w.label }));
  contact.social_links = (raw.social_links ?? []).map((s) => ({
    id: nextId(),
    value: s.value,
    platform: (["linkedin", "x", "facebook", "instagram", "github", "other"] as const).includes(
      s.platform as never,
    )
      ? (s.platform as ContactRecord["social_links"][number]["platform"])
      : "other",
  }));
  return contact;
}
