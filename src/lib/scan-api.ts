/**
 * BACKEND INTEGRATION POINT
 * -------------------------
 * `scanBusinessCard` is the single boundary between this frontend and the
 * backend (../../backend). It posts a multipart upload to
 * POST {VITE_API_URL}/api/business-card/scan and resolves to `ScanResult` or
 * rejects with a `ScanApiError`. Nothing else in the UI needs to change.
 */

import type { ScanError, ScanErrorCode, ScanResult } from "@/types/business-card";

/**
 * Empty by default = same origin. The frontend and backend run on different
 * origins in this deployment (see docker-compose.yml), so set VITE_API_URL to
 * the backend's absolute URL in that case.
 */
const API_BASE = import.meta.env["VITE_API_URL"] ?? "";

export class ScanApiError extends Error {
  code: ScanErrorCode;
  partial?: ScanResult | undefined;

  constructor(error: ScanError) {
    super(error.message);
    this.name = "ScanApiError";
    this.code = error.code;
    this.partial = error.partial;
  }
}

interface ScanSuccessBody {
  success: true;
  contact: ScanResult["contact"];
  confidence: ScanResult["confidence"];
  warnings?: ScanResult["warnings"];
}

interface ScanErrorBody {
  success: false;
  code: ScanErrorCode;
  message: string;
  partial?: {
    contact: ScanResult["contact"];
    confidence: ScanResult["confidence"];
    warnings?: ScanResult["warnings"];
  };
}

export interface ScanBusinessCardOptions {
  signal?: AbortSignal | undefined;
}

/**
 * Sends the captured card images for extraction.
 */
export async function scanBusinessCard(
  frontImage: File,
  backImage?: File | undefined,
  options: ScanBusinessCardOptions = {},
): Promise<ScanResult> {
  const frontUrl = URL.createObjectURL(frontImage);
  const backUrl = backImage ? URL.createObjectURL(backImage) : undefined;

  const body = new FormData();
  body.append("front", frontImage);
  if (backImage) body.append("back", backImage);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/business-card/scan`, {
      method: "POST",
      body,
      signal: options.signal ?? null,
    });
  } catch (err) {
    throw new ScanApiError({
      code: "UPLOAD_FAILED",
      message: err instanceof Error ? err.message : "Could not reach the server.",
    });
  }

  const json = await response.json().catch(() => undefined);

  if (!response.ok || !json || json.success === false) {
    const errorBody = json as ScanErrorBody | undefined;
    throw new ScanApiError({
      code: errorBody?.code ?? "SCAN_FAILED",
      message: errorBody?.message ?? "The card could not be processed. Please try again.",
      partial: errorBody?.partial
        ? {
            front_image: frontUrl,
            back_image: backUrl,
            contact: errorBody.partial.contact,
            confidence: errorBody.partial.confidence,
            warnings: errorBody.partial.warnings,
          }
        : undefined,
    });
  }

  const success = json as ScanSuccessBody;
  return {
    front_image: frontUrl,
    back_image: backUrl,
    contact: success.contact,
    confidence: success.confidence,
    warnings: success.warnings,
  };
}

/**
 * Final hand-off of the reviewed contact.
 */
export async function confirmContact(contact: unknown): Promise<void> {
  const response = await fetch(`${API_BASE}/api/business-card/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(contact),
  });

  if (!response.ok) {
    throw new Error("Could not send the confirmed contact.");
  }
}
