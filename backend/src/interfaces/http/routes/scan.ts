import { Router, type NextFunction, type Request, type Response } from "express";
import multer, { MulterError } from "multer";
import sharp from "sharp";

import { config } from "../../../config/index.js";
import type { CardSide, ScanWarning } from "../../../domain/contact.js";
import { mergeContactSides } from "../../../domain/merge-sides.js";
import { normalizeContactPhones } from "../../../domain/normalize-phone.js";
import { validateContact } from "../../../domain/validate.js";
import { capabilities } from "../../../infrastructure/ai/registry.js";
import type { CardImage } from "../../../infrastructure/ai/types.js";
import { query } from "../../../infrastructure/db/pool.js";
import { preprocessImage } from "../../../infrastructure/image/preprocess.js";
import { detectQrCode } from "../../../infrastructure/qr/detect.js";
import { enrichContactFromQrUrl, isFetchableUrl } from "../../../infrastructure/qr/url-enrich.js";
import { parseVCard } from "../../../infrastructure/qr/vcard.js";

const ALLOWED_MIME: Record<string, CardImage["mimeType"]> = {
  "image/jpeg": "image/jpeg",
  "image/png": "image/png",
  "image/webp": "image/webp",
};

type ScanErrorCode =
  | "IMAGE_UNPROCESSABLE"
  | "UNSUPPORTED_FORMAT"
  | "UPLOAD_FAILED"
  | "SCAN_FAILED"
  | "NO_CONTACT_DETECTED";

class UploadError extends Error {
  constructor(
    readonly code: ScanErrorCode,
    message: string,
  ) {
    super(message);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes },
});

export const scanRouter = Router();

scanRouter.post(
  "/api/business-card/scan",
  (req: Request, res: Response, next: NextFunction) => {
    upload.fields([
      { name: "front", maxCount: 1 },
      { name: "back", maxCount: 1 },
    ])(req, res, (err: unknown) => {
      if (err instanceof MulterError) {
        return respondError(res, 400, "UPLOAD_FAILED", err.message);
      }
      if (err) return next(err);
      next();
    });
  },
  async (req: Request, res: Response) => {
    const start = Date.now();
    const files = req.files as
      | { front?: Express.Multer.File[]; back?: Express.Multer.File[] }
      | undefined;
    const frontFile = files?.front?.[0];
    const backFile = files?.back?.[0];

    if (!frontFile) {
      return respondError(res, 400, "UPLOAD_FAILED", "A front image is required.");
    }

    try {
      const front = await loadImage(frontFile, "front");
      const back = backFile ? await loadImage(backFile, "back") : undefined;

      const [preppedFront, preppedBack, qrFront, qrBack] = await Promise.all([
        preprocessImage(front),
        back ? preprocessImage(back) : Promise.resolve(undefined),
        detectQrCode(front, "front" as CardSide),
        back ? detectQrCode(back, "back" as CardSide) : Promise.resolve(undefined),
      ]);

      const qrEntries = [qrFront, qrBack].filter((e): e is NonNullable<typeof e> => Boolean(e));
      const vCardText = qrEntries.find((e) => e.content && /BEGIN:VCARD/i.test(e.content))?.content;
      const vCardContact = vCardText ? parseVCard(vCardText) : undefined;
      // Only worth fetching a QR-linked URL when the QR wasn't already a vCard.
      const qrUrlCandidate = !vCardContact
        ? qrEntries.find((e) => e.content && isFetchableUrl(e.content))?.content
        : undefined;

      const capability = capabilities["vision.extract"];
      // No data dependency between the vision call and QR-URL enrichment —
      // run them concurrently so a QR link's fetch+extract latency never
      // stacks on top of the vision call's.
      const [vlmResult, qrUrlContact] = await Promise.all([
        capability.run({
          front: { base64: preppedFront.buffer.toString("base64"), mimeType: preppedFront.mimeType },
          back: preppedBack
            ? { base64: preppedBack.buffer.toString("base64"), mimeType: preppedBack.mimeType }
            : undefined,
        }),
        qrUrlCandidate ? enrichContactFromQrUrl(qrUrlCandidate) : Promise.resolve(undefined),
      ]);
      const qrContact = vCardContact ?? qrUrlContact;

      const merged = mergeContactSides({
        vlmContact: vlmResult.contact,
        vlmConfidence: vlmResult.confidence,
        qrEntries,
        qrContact,
      });

      const normalized = normalizeContactPhones(merged.contact);
      const warnings: ScanWarning[] = [
        ...vlmResult.notes.map((message) => ({ code: "AI_NOT_CONFIGURED", message })),
        ...merged.warnings,
        ...validateContact(normalized),
      ];

      const qrDetected = qrEntries.some((e) => e.detected);
      const durationMs = Date.now() - start;
      const isEmpty =
        !normalized.first_name &&
        !normalized.last_name &&
        !normalized.full_name &&
        !normalized.company &&
        normalized.emails.length === 0 &&
        normalized.phones.length === 0 &&
        normalized.websites.length === 0;

      const scanId = await recordScan({
        status: isEmpty ? "failed" : "completed",
        provider: capability.provider,
        qrDetected,
        rawExtraction: vlmResult.contact,
        contact: normalized,
        confidence: merged.confidence,
        warnings,
        durationMs,
      });

      if (isEmpty) {
        return respondError(
          res,
          422,
          "NO_CONTACT_DETECTED",
          "No contact information could be read from this card.",
          { success: true, scan_id: scanId, contact: normalized, confidence: merged.confidence, warnings },
        );
      }

      res.json({
        success: true,
        scan_id: scanId,
        contact: normalized,
        confidence: merged.confidence,
        warnings,
        processing: {
          front_processed: true,
          back_processed: Boolean(back),
          qr_detected: qrDetected,
          provider: capability.provider,
        },
      });
    } catch (error) {
      if (error instanceof UploadError) {
        return respondError(res, 400, error.code, error.message);
      }
      console.error("[scan] failed", error);
      await recordScan({
        status: "failed",
        provider: "unknown",
        qrDetected: false,
        errorMessage: (error as Error).message,
        durationMs: Date.now() - start,
      }).catch(() => undefined);
      respondError(res, 500, "SCAN_FAILED", "The card could not be processed. Please try again.");
    }
  },
);

async function loadImage(file: Express.Multer.File, side: "front" | "back"): Promise<Buffer> {
  if (!ALLOWED_MIME[file.mimetype]) {
    throw new UploadError(
      "UNSUPPORTED_FORMAT",
      `The ${side} image's format (${file.mimetype}) is not supported. Use JPEG, PNG, or WebP.`,
    );
  }
  try {
    await sharp(file.buffer).metadata();
  } catch {
    throw new UploadError("IMAGE_UNPROCESSABLE", `The ${side} image could not be read.`);
  }
  return file.buffer;
}

function respondError(
  res: Response,
  status: number,
  code: ScanErrorCode,
  message: string,
  partial?: Record<string, unknown>,
): void {
  res.status(status).json({ success: false, code, message, ...(partial ? { partial } : {}) });
}

interface RecordScanInput {
  status: "completed" | "failed";
  provider: string;
  qrDetected: boolean;
  rawExtraction?: unknown;
  contact?: unknown;
  confidence?: unknown;
  warnings?: unknown;
  errorMessage?: string;
  durationMs: number;
}

async function recordScan(input: RecordScanInput): Promise<string | undefined> {
  const rows = await query<{ id: string }>(
    `INSERT INTO scans (status, vision_provider, qr_detected, raw_extraction, contact, confidence, warnings, error_message, duration_ms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      input.status,
      input.provider,
      input.qrDetected,
      input.rawExtraction ? JSON.stringify(input.rawExtraction) : null,
      input.contact ? JSON.stringify(input.contact) : null,
      input.confidence ? JSON.stringify(input.confidence) : null,
      JSON.stringify(input.warnings ?? []),
      input.errorMessage ?? null,
      input.durationMs,
    ],
  );
  return rows[0]?.id;
}
