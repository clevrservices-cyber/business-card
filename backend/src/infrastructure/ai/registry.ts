import { config } from "../../config/index.js";
import * as anthropicProvider from "./providers/anthropic.js";
import * as openaiProvider from "./providers/openai.js";
import * as openaiAudioProvider from "./providers/openai-audio.js";
import * as openaiTextProvider from "./providers/openai-text.js";
import * as stubProvider from "./providers/stub.js";

/**
 * One capability, bound to exactly one active implementation — the same
 * registry pattern used across this workspace's other backends. First
 * configured key wins (OpenAI, then Anthropic); a missing key on both
 * degrades to the stub rather than failing every request. Adding another
 * provider is a new providers/*.ts file plus one more branch here, no
 * call-site changes.
 *
 * text.extractContact / audio.transcribe / text.correctAndSummarize are
 * OpenAI-only (no Anthropic implementation) — they still degrade to the
 * stub cleanly when OPENAI_API_KEY is unset.
 */
const hasOpenAiKey = Boolean(config.ai.openaiApiKey);
const hasAnthropicKey = Boolean(config.ai.anthropicApiKey);

export const capabilities = {
  "vision.extract": hasOpenAiKey
    ? { provider: "openai-gpt4o", run: openaiProvider.extractCard }
    : hasAnthropicKey
      ? { provider: "anthropic-claude", run: anthropicProvider.extractCard }
      : { provider: "stub", run: stubProvider.extractCard },
  "text.extractContact": hasOpenAiKey
    ? { provider: "openai-text", run: openaiTextProvider.extractContactFromText }
    : { provider: "stub", run: stubProvider.extractContactFromText },
  "audio.transcribe": hasOpenAiKey
    ? { provider: "openai-whisper", run: openaiAudioProvider.transcribeAudio }
    : { provider: "stub", run: stubProvider.transcribeAudio },
  "text.correctAndSummarize": hasOpenAiKey
    ? { provider: "openai-text", run: openaiTextProvider.correctAndSummarize }
    : { provider: "stub", run: stubProvider.correctAndSummarize },
} as const;

export type CapabilityId = keyof typeof capabilities;

export function providerFor(id: CapabilityId): string {
  return capabilities[id].provider;
}
