import cors from "cors";
import express from "express";

import { config } from "./config/index.js";
import { migrate } from "./infrastructure/db/migrate.js";
import { confirmRouter } from "./interfaces/http/routes/confirm.js";
import { lookupsRouter } from "./interfaces/http/routes/lookups.js";
import { scanRouter } from "./interfaces/http/routes/scan.js";
import { transcribeRouter } from "./interfaces/http/routes/transcribe.js";

async function main(): Promise<void> {
  await migrate();

  const app = express();
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use(scanRouter);
  app.use(confirmRouter);
  app.use(lookupsRouter);
  app.use(transcribeRouter);

  app.listen(config.port, () => {
    console.log(`[api] listening on :${config.port} (${config.nodeEnv})`);
  });
}

main().catch((error) => {
  console.error("[api] failed to start", error);
  process.exit(1);
});
