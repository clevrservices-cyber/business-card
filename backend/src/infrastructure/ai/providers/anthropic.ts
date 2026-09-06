import Anthropic from "@anthropic-ai/sdk";

import { config } from "../../../config/index.js";
import { emptyContact, nextId, type ContactRecord, type ConfidenceMap } from "../../../domain/contact.js";
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

/** Raw shape returned by the tool call — looser than ContactRecord (no ids, optional arrays). */
interface RawToolInput {
  contact: Partial<ContactRecord> & {
    emails?: { value: string; label?: string }[];
    phones?: { value: string; type: string }[];
    websites?: { value: string; label?: string }[];
    social_links?: { platform: string; value: string }[];
  };
  confidence: ConfidenceMap;
}

function hydrateContact(raw: RawToolInput["contact"]): ContactRecord {
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
