import { Router, type Request, type Response } from "express";
import multer from "multer";

import { config } from "../../../config/index.js";
import { capabilities } from "../../../infrastructure/ai/registry.js";

const uploadAudio = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxAudioBytes } });

export const transcribeRouter = Router();

transcribeRouter.post(
  "/api/business-card/transcribe",
  uploadAudio.single("audio"),
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ success: false, code: "UPLOAD_FAILED", message: "An audio file is required." });
      return;
    }
    if (capabilities["audio.transcribe"].provider === "stub") {
      res.status(503).json({
        success: false,
        code: "AI_NOT_CONFIGURED",
        message: "Voice transcription is not configured on this server.",
      });
      return;
    }
    try {
      const transcript = await capabilities["audio.transcribe"].run({
        buffer: req.file.buffer,
        mimeType: req.file.mimetype,
        filename: req.file.originalname || "recording.webm",
      });
      const text = await capabilities["text.correctAndSummarize"].run(transcript);
      res.json({ success: true, transcript, text });
    } catch (error) {
      console.error("[transcribe] failed", error);
      res.status(500).json({
        success: false,
        code: "SCAN_FAILED",
        message: "Could not transcribe the recording. Please try again or type manually.",
      });
    }
  },
);
