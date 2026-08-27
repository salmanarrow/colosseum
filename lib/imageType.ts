/**
 * Work out whether an upload is an image, without trusting the browser.
 *
 * `File.type` is frequently empty — phones sending HEIC, some Android
 * browsers, and files picked from cloud providers all arrive with no MIME
 * type. Rejecting on that alone turned away legitimate receipts, so we fall
 * back to the extension and finally to the file's magic bytes.
 */

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", jpe: "image/jpeg",
  png: "image/png", webp: "image/webp",
  heic: "image/heic", heif: "image/heic",
  gif: "image/gif", bmp: "image/bmp", tif: "image/tiff", tiff: "image/tiff",
};

/** Sniff the container from the first bytes. */
function sniff(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  if (buf.subarray(0, 3).toString("ascii") === "GIF") return "image/gif";
  if (buf.subarray(0, 2).toString("ascii") === "BM") return "image/bmp";
  // HEIC/HEIF and other ISO-BMFF: "ftyp" at offset 4
  if (buf.subarray(4, 8).toString("ascii") === "ftyp") {
    const brand = buf.subarray(8, 12).toString("ascii");
    if (/^(heic|heix|hevc|heim|heis|hevm|mif1|msf1)$/.test(brand)) return "image/heic";
  }
  return null;
}

export type ImageCheck =
  | { ok: true; mime: string; ext: string }
  | { ok: false; reason: string };

export function resolveImage(name: string, declaredType: string, bytes: Buffer): ImageCheck {
  const extRaw = (name.split(".").pop() ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const extMime = EXT_TO_MIME[extRaw];
  const sniffed = sniff(bytes);

  // Prefer what the bytes actually say, then the extension, then the browser.
  const mime =
    sniffed ??
    extMime ??
    (/^image\//.test(declaredType) ? declaredType.toLowerCase() : null);

  if (!mime) {
    return {
      ok: false,
      reason: "That file doesn't look like an image. Please upload a JPG, PNG, WEBP or HEIC screenshot.",
    };
  }

  // Storage rejects anything outside its allow-list, so normalise unusual
  // containers to a type the bucket accepts.
  const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];
  const finalMime = ACCEPTED.includes(mime) ? mime : "image/jpeg";

  const extFromMime =
    finalMime === "image/png" ? "png" :
    finalMime === "image/webp" ? "webp" :
    finalMime === "image/heic" ? "heic" : "jpg";

  // Only keep the original extension if it agrees with the resolved type.
  const ext = EXT_TO_MIME[extRaw] === finalMime ? extRaw : extFromMime;

  return { ok: true, mime: finalMime, ext };
}
