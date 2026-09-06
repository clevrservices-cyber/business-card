import type { ConfidenceMap, ContactRecord } from "../../domain/contact.js";

export interface CardImage {
  base64: string;
  mimeType: "image/jpeg" | "image/png" | "image/webp";
}

export interface VisionExtractInput {
  front: CardImage;
  back?: CardImage | undefined;
}

export interface VisionExtractOutput {
  contact: ContactRecord;
  confidence: ConfidenceMap;
  /** Provider-level notes, e.g. "no key configured" — surfaced as scan warnings upstream. */
  notes: string[];
}

export type VisionProvider = (input: VisionExtractInput) => Promise<VisionExtractOutput>;
