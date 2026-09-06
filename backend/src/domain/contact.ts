/**
 * Mirrors the frontend's `ContactData` contract (cardreader/src/types/business-card.ts)
 * field-for-field. This is deliberate: the frontend contract IS the API response
 * contract, so there is one shape to keep in sync, not two.
 */

export type PhoneType = "mobile" | "direct" | "office" | "home" | "fax" | "other";

export type SocialPlatform = "linkedin" | "x" | "facebook" | "instagram" | "github" | "other";

export type ConfidenceLevel = "high" | "medium" | "low";

export type CardSide = "front" | "back";

export interface PhoneEntry {
  id: string;
  type: PhoneType;
  value: string;
  normalized?: string | undefined;
  label?: string | undefined;
}

export interface EmailEntry {
  id: string;
  value: string;
  label?: string | undefined;
}

export interface WebsiteEntry {
  id: string;
  value: string;
  label?: string | undefined;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  value: string;
}

export interface PostalAddress {
  street?: string | undefined;
  building?: string | undefined;
  suite?: string | undefined;
  floor?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postal_code?: string | undefined;
  country?: string | undefined;
}

export interface QrCodeEntry {
  id: string;
  format?: string | undefined;
  detected: boolean;
  content?: string | undefined;
  side?: CardSide | undefined;
}

export interface ContactRecord {
  first_name?: string | undefined;
  middle_name?: string | undefined;
  last_name?: string | undefined;
  full_name?: string | undefined;
  job_title?: string | undefined;
  department?: string | undefined;
  company?: string | undefined;
  tagline?: string | undefined;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  websites: WebsiteEntry[];
  address: PostalAddress;
  social_links: SocialLink[];
  qr_codes: QrCodeEntry[];
  notes?: string | undefined;
}

/** Field-path keyed, e.g. "full_name", "phones.0", "address.city". */
export type ConfidenceMap = Record<string, ConfidenceLevel>;

export interface ScanWarning {
  code: string;
  message: string;
}

export function emptyContact(): ContactRecord {
  return {
    emails: [],
    phones: [],
    websites: [],
    address: {},
    social_links: [],
    qr_codes: [],
  };
}

let counter = 0;
/** Deterministic-enough id generator for entries created server-side (tests don't need randomness). */
export function nextId(): string {
  counter += 1;
  return `s${Date.now().toString(36)}${counter.toString(36)}`;
}
