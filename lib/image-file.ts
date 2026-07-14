/**
 * Downscales an image File client-side and returns a compact data URL. JPEG by
 * default (photos); pass mime "image/png" to preserve transparency (logos).
 */
export async function fileToDataUrl(
  file: File,
  {
    max = 400,
    mime = "image/jpeg",
    quality = 0.85,
  }: { max?: number; mime?: string; quality?: number } = {}
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL(mime, quality);
}
