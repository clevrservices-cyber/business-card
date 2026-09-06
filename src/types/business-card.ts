/**
 * TEMPORARY FRONTEND DATA CONTRACT
 * ---------------------------------
 * These types describe the shape the UI expects from a future backend
 * scan endpoint. They are NOT a database schema and carry no persistence
 * semantics. Adjust freely when the real API is connected.
 */

export type PhoneType = "mobile" | "direct" | "office" | "home" | "fax" | "other";

export type SocialPlatform =
  | "linkedin"
  | "x"
  | "facebook"
  | "instagram"
  | "github"
  | "other";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface PhoneEntry {
  id: string;
  type: PhoneType;
  value: string;
  label?: string;
}

export interface EmailEntry {
  id: string;
  value: string;
  label?: string;
}

export interface WebsiteEntry {
  id: string;
  value: string;
  label?: string;
}

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  value: string;
}

export interface PostalAddress {
  street?: string;
  building?: string;
  suite?: string;
  floor?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface QrCodeEntry {
  id: string;
  format?: string; // e.g. "qr" | "code128"
  detected: boolean;
  content?: string;
  side?: CardSide;
}

export interface ContactData {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  full_name?: string;
  job_title?: string;
  department?: string;
  company?: string;
  tagline?: string;
  emails: EmailEntry[];
  phones: PhoneEntry[];
  websites: WebsiteEntry[];
  address: PostalAddress;
  social_links: SocialLink[];
  qr_codes: QrCodeEntry[];
  notes?: string;
}

/** Confidence keyed by field path, e.g. "full_name", "phones.0", "address.city". */
export type ConfidenceMap = Record<string, ConfidenceLevel | number>;

export interface ScanWarning {
  code: string;
  message: string;
}

export interface ScanResult {
  front_image: string;
  back_image?: string;
  contact: ContactData;
  confidence: ConfidenceMap;
  warnings?: ScanWarning[];
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
  partial?: ScanResult;
}

export type CardSide = "front" | "back";

export interface CapturedImage {
  /** Object URL or data URL used purely for preview rendering. */
  previewUrl: string;
  file: File;
}
