/**
 * TEMPORARY FRONTEND DATA CONTRACT
 * ---------------------------------
 * These types describe the shape the UI expects from a future backend
 * scan endpoint. They are NOT a database schema and carry no persistence
 * semantics. Adjust freely when the real API is connected.
 */

export type PhoneType = "mobile" | "direct" | "office" | "home" | "fax" | "other";

export type SocialPlatform =
  "linkedin" | "x" | "facebook" | "instagram" | "skype" | "whatsapp" | "wechat" | "telegram";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface PhoneEntry {
  id: string;
  type: PhoneType;
  value: string;
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
  format?: string | undefined; // e.g. "qr" or "code128"
  detected: boolean;
  content?: string | undefined;
  side?: CardSide | undefined;
}

export interface ActionItem {
  id: string;
  description?: string | undefined;
  deadline?: string | undefined; // ISO date "YYYY-MM-DD"
}

export interface ContactData {
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
  contact_event?: string | undefined;
  event_date?: string | undefined;
  tags: string[];
  connection_description?: string | undefined;
  actions: ActionItem[];
  notes?: string | undefined;
}

/** Confidence keyed by field path, e.g. "full_name", "phones.0", "address.city". */
export type ConfidenceMap = Record<string, ConfidenceLevel | number>;

export interface ScanWarning {
  code: string;
  message: string;
}

export interface ScanResult {
  front_image: string;
  back_image?: string | undefined;
  contact: ContactData;
  confidence: ConfidenceMap;
  warnings?: ScanWarning[] | undefined;
}

export type ScanErrorCode =
  | "IMAGE_TOO_BLURRY"
  | "IMAGE_UNPROCESSABLE"
  | "UNSUPPORTED_FORMAT"
  | "UPLOAD_FAILED"
  | "SCAN_FAILED"
  | "NO_CONTACT_DETECTED"
  | "PARTIAL_RESULT";

export interface ScanError {
  code: ScanErrorCode;
  message: string;
  /** Optional partial extraction the backend was still able to return. */
  partial?: ScanResult | undefined;
}

export type CardSide = "front" | "back";

export interface CapturedImage {
  /** Object URL or data URL used purely for preview rendering. */
  previewUrl: string;
  file: File;
}
