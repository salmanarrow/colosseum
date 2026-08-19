"use client";

/**
 * Downscale + re-encode an image in the browser before uploading.
 *
 * Why this exists: phone screenshots are routinely 3–8 MB, and a Vercel
 * serverless function refuses request bodies over ~4.5 MB — so the upload
 * failed before it ever reached our code. Shrinking client-side keeps a
 * receipt at a few hundred KB, which is plenty to read a transaction ID,
 * and also normalises odd formats (HEIC etc.) to JPEG.
 *
 * Falls back to the original file if anything goes wrong — never throws.
 */
export async function compressImage(
  file: File,
  { maxDimension = 1600, quality = 0.82, maxBytes = 1_500_000 } = {}
): Promise<File> {
  // Small enough already and a format we know — leave it alone.
  if (file.size <= 400_000 && /^image\/(jpeg|png|webp)$/.test(file.type)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    // Step the quality down until it fits comfortably under the body limit.
    let q = quality;
    let blob: Blob | null = null;
    for (let i = 0; i < 4; i++) {
      blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", q));
      if (!blob || blob.size <= maxBytes) break;
      q -= 0.15;
    }
    if (!blob) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file; // unsupported codec (some HEIC), no canvas, etc.
  }
}
