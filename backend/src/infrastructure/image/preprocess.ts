import sharp from "sharp";

export interface PreprocessedImage {
  buffer: Buffer;
  mimeType: "image/jpeg";
}

const MAX_DIMENSION = 1600;
/** Below this per-channel stdev, the image reads as flat/low-contrast (heuristic, not exact). */
const LOW_CONTRAST_STDEV = 40;

/**
 * Applied conditionally, not unconditionally (spec: don't blindly transform
 * every image). Always orientation-corrects and caps the resolution — that's
 * cheap, always beneficial, and keeps the vision request small; contrast
 * normalization only kicks in when the image actually measures as flat.
 *
 * No perspective/rotation auto-correction here — that needs real corner
 * detection, which is a separate module to add later, not faked with a
 * heuristic that would silently warp a card that didn't need it.
 */
export async function preprocessImage(original: Buffer): Promise<PreprocessedImage> {
  const metadata = await sharp(original).metadata();
  const stats = await sharp(original).stats();

  let pipeline = sharp(original).rotate(); // auto-orient from EXIF, then strip it

  const needsResize = (metadata.width ?? 0) > MAX_DIMENSION || (metadata.height ?? 0) > MAX_DIMENSION;
  if (needsResize) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    });
  }

  const isLowContrast = stats.channels.every((channel) => channel.stdev < LOW_CONTRAST_STDEV);
  if (isLowContrast) {
    pipeline = pipeline.normalize();
  }

  const buffer = await pipeline.jpeg({ quality: 85 }).toBuffer();
  return { buffer, mimeType: "image/jpeg" };
}
