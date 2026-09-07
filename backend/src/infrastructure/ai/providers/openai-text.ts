import OpenAI from "openai";
import type { ChatCompletionMessageFunctionToolCall } from "openai/resources/chat/completions";

import { config } from "../../../config/index.js";
import { hydrateContact, type RawToolInput } from "../hydrate-contact.js";
import { CONNECTION_SUMMARY_PROMPT_V1 } from "../prompts/connection-summary-v1.js";
import { CONTACT_TOOL_NAME, CONTACT_TOOL_SCHEMA, TEXT_EXTRACTION_PROMPT_V1 } from "../prompts/text-extraction-v1.js";
import type { TextExtractInput, TextExtractOutput } from "../types.js";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: config.ai.openaiApiKey });
  return client;
}

export async function extractContactFromText(input: TextExtractInput): Promise<TextExtractOutput> {
  const response = await getClient().chat.completions.create({
    model: config.ai.openaiTextModel,
    messages: [
      { role: "system", content: TEXT_EXTRACTION_PROMPT_V1 },
      { role: "user", content: `Page URL: ${input.sourceUrl}\n\nPage text:\n${input.text}` },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: CONTACT_TOOL_NAME,
          description: CONTACT_TOOL_SCHEMA.description,
          parameters: CONTACT_TOOL_SCHEMA.input_schema,
        },
      },
    ],
    tool_choice: { type: "function", function: { name: CONTACT_TOOL_NAME } },
  });

  const toolCall = response.choices[0]?.message.tool_calls?.find(
    (call): call is ChatCompletionMessageFunctionToolCall => call.type === "function",
  );
  if (!toolCall) {
    return { contact: {}, confidence: {}, notes: ["No tool call returned."] };
  }

  const raw = JSON.parse(toolCall.function.arguments) as RawToolInput;
  return { contact: hydrateContact(raw.contact ?? {}), confidence: raw.confidence ?? {}, notes: [] };
}

export async function correctAndSummarize(rawText: string): Promise<string> {
  const response = await getClient().chat.completions.create({
    model: config.ai.openaiTextModel,
    messages: [
      { role: "system", content: CONNECTION_SUMMARY_PROMPT_V1 },
      { role: "user", content: rawText },
    ],
    temperature: 0.3,
  });
  return response.choices[0]?.message.content?.trim() || rawText;
}
