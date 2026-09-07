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

export interface TextExtractInput {
  text: string;
  sourceUrl: string;
}

export interface TextExtractOutput {
  contact: Partial<ContactRecord>;
  confidence: ConfidenceMap;
  notes: string[];
}

export type TextExtractProvider = (input: TextExtractInput) => Promise<TextExtractOutput>;

export interface AudioTranscribeInput {
  buffer: Buffer;
  mimeType: string;
  filename: string;
}

export type AudioTranscribeProvider = (input: AudioTranscribeInput) => Promise<string>;

export type CorrectAndSummarizeProvider = (rawText: string) => Promise<string>;
