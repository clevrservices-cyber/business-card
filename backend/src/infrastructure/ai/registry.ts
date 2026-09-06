import { config } from "../../config/index.js";
import * as anthropicProvider from "./providers/anthropic.js";
import * as stubProvider from "./providers/stub.js";

/**
 * One capability, bound to exactly one active implementation — the same
 * registry pattern used across this workspace's other backends. A missing
 * key degrades to the stub rather than failing every request; swapping in
 * OpenAI/Gemini later is a new providers/*.ts file plus one line here, no
 * call-site changes.
 */
const hasAnthropicKey = Boolean(config.ai.anthropicApiKey);

export const capabilities = {
  "vision.extract": hasAnthropicKey
    ? { provider: "anthropic-claude", run: anthropicProvider.extractCard }
    : { provider: "stub", run: stubProvider.extractCard },
} as const;

export type CapabilityId = keyof typeof capabilities;

export function providerFor(id: CapabilityId): string {
  return capabilities[id].provider;
}
