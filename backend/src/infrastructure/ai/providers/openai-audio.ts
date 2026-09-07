import OpenAI, { toFile } from "openai";

import { config } from "../../../config/index.js";
import type { AudioTranscribeInput } from "../types.js";

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!client) client = new OpenAI({ apiKey: config.ai.openaiApiKey });
  return client;
}

export async function transcribeAudio(input: AudioTranscribeInput): Promise<string> {
  const file = await toFile(input.buffer, input.filename, { type: input.mimeType });
  const result = await getClient().audio.transcriptions.create({ file, model: "whisper-1" });
  return result.text;
}
