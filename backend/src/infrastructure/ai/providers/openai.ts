import OpenAI from "openai";
import type { ChatCompletionContentPart, ChatCompletionMessageFunctionToolCall } from "openai/resources/chat/completions";

import { config } from "../../../config/index.js";
import { hydrateContact, type RawToolInput } from "../hydrate-contact.js";
import { CONTACT_TOOL_NAME, CONTACT_TOOL_SCHEMA, EXTRACTION_PROMPT_V1 } from "../prompts/extraction-v1.js";
import type { CardImage, VisionExtractInput, VisionExtractOutput } from "../types.js";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: config.ai.openaiApiKey });
  return client;
}

function imagePart(image: CardImage): ChatCompletionContentPart {
  return {
    type: "image_url",
    // Business-card print is small and dense — "high" avoids the model
    // downsampling before it ever reads the text.
    image_url: { url: `data:${image.mimeType};base64,${image.base64}`, detail: "high" },
  };
}

export async function extractCard(input: VisionExtractInput): Promise<VisionExtractOutput> {
  const content: ChatCompletionContentPart[] = [
    { type: "text", text: "Front of the card:" },
    imagePart(input.front),
  ];
  if (input.back) {
    content.push({ type: "text", text: "Back of the card:" }, imagePart(input.back));
  }

  const response = await getClient().chat.completions.create({
    model: config.ai.openaiModel,
    messages: [
      { role: "system", content: EXTRACTION_PROMPT_V1 },
      { role: "user", content },
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
    throw new Error("OpenAI response did not include the expected return_contact tool call");
  }

  const raw = JSON.parse(toolCall.function.arguments) as RawToolInput;
  return {
    contact: hydrateContact(raw.contact ?? {}),
    confidence: raw.confidence ?? {},
    notes: [],
  };
}
