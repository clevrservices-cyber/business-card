import { z } from "zod";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8090),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-5"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  MAX_UPLOAD_MB: z.coerce.number().positive().default(15),
  CORS_ORIGIN: z.string().default("http://localhost:3020"),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error("[config] invalid environment:", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databaseUrl: env.DATABASE_URL,
  maxUploadBytes: env.MAX_UPLOAD_MB * 1024 * 1024,
  // Comma-separated in the env var (e.g. local dev origin + the Lovable-hosted
  // production frontend at once). "*" is passed through as-is — the `cors`
  // package only treats the bare string specially, not a one-element array.
  corsOrigin: env.CORS_ORIGIN === "*" ? "*" : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  ai: {
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    anthropicModel: env.ANTHROPIC_MODEL,
    openaiApiKey: env.OPENAI_API_KEY,
    openaiModel: env.OPENAI_MODEL,
  },
};
