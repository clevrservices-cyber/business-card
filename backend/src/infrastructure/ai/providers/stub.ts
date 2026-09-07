import { emptyContact } from "../../../domain/contact.js";
import type {
  AudioTranscribeInput,
  TextExtractInput,
  TextExtractOutput,
  VisionExtractInput,
  VisionExtractOutput,
} from "../types.js";

/**
 * Runs when no ANTHROPIC_API_KEY is configured. Returns an empty contact
 * rather than throwing — a missing key degrades the feature, it never takes
 * the endpoint down (same rule as this workspace's other capability registries).
 */
export async function extractCard(_input: VisionExtractInput): Promise<VisionExtractOutput> {
  return {
    contact: emptyContact(),
    confidence: {},
    notes: [
      "Vision extraction is not configured on this server (no ANTHROPIC_API_KEY) — " +
        "no fields were extracted. Configure a key or fill in the contact by hand.",
    ],
  };
}

export async function extractContactFromText(_input: TextExtractInput): Promise<TextExtractOutput> {
  return {
    contact: {},
    confidence: {},
    notes: ["Text extraction is not configured on this server (no OPENAI_API_KEY)."],
  };
}

export async function transcribeAudio(_input: AudioTranscribeInput): Promise<string> {
  throw new Error("Voice transcription is not configured on this server (no OPENAI_API_KEY).");
}

export async function correctAndSummarize(rawText: string): Promise<string> {
  return rawText;
}
