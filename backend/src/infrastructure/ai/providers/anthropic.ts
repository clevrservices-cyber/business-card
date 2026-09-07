import Anthropic from "@anthropic-ai/sdk";

import { config } from "../../../config/index.js";
import { hydrateContact, type RawToolInput } from "../hydrate-contact.js";
import { CONTACT_TOOL_NAME, CONTACT_TOOL_SCHEMA, EXTRACTION_PROMPT_V1 } from "../prompts/extraction-v1.js";
import type { CardImage, VisionExtractInput, VisionExtractOutput } from "../types.js";

let client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: config.ai.anthropicApiKey });
  return client;
}

function imageBlock(image: CardImage) {
  return {
    type: "image" as const,
    source: { type: "base64" as const, media_type: image.mimeType, data: image.base64 },
  };
}

export async function extractCard(input: VisionExtractInput): Promise<VisionExtractOutput> {
  const content: Anthropic.Messages.ContentBlockParam[] = [
    { type: "text", text: "Front of the card:" },
    imageBlock(input.front),
  ];
  if (input.back) {
    content.push({ type: "text", text: "Back of the card:" }, imageBlock(input.back));
  }

  const response = await getClient().messages.create({
    model: config.ai.anthropicModel,
    max_tokens: 4096,
    system: EXTRACTION_PROMPT_V1,
    tools: [CONTACT_TOOL_SCHEMA as unknown as Anthropic.Messages.Tool],
    tool_choice: { type: "tool", name: CONTACT_TOOL_NAME },
    messages: [{ role: "user", content }],
  });

  const toolUse = response.content.find(
    (block): block is Anthropic.Messages.ToolUseBlock => block.type === "tool_use",
  );
  if (!toolUse) {
    throw new Error("Anthropic response did not include the expected return_contact tool call");
  }

  const raw = toolUse.input as RawToolInput;
  return {
    contact: hydrateContact(raw.contact ?? {}),
    confidence: raw.confidence ?? {},
    notes: [],
  };
}
