import jsQR from "jsqr";
import sharp from "sharp";

import { nextId, type CardSide, type QrCodeEntry } from "../../domain/contact.js";

/**
 * Independent of the vision model on purpose (spec: QR detection must not be
 * gated on AI extraction) — pure image decoding, no API call.
 */
export async function detectQrCode(buffer: Buffer, side: CardSide): Promise<QrCodeEntry> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength);
  const result = jsQR(pixels, info.width, info.height);

  if (!result) return { id: nextId(), detected: false, side };
  return { id: nextId(), detected: true, format: "qr", content: result.data, side };
}
