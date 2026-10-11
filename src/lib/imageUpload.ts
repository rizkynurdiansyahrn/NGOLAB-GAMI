// Kompres foto dari perangkat menjadi data URL kecil untuk dipakai sebagai
// avatar. Berjalan sepenuhnya di browser (tanpa upload ke server mana pun).
const MAX_SIDE = 256;
const QUALITY = 0.82;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Foto belum dapat dibaca."));
    reader.onerror = () => reject(new Error("Foto belum dapat dibaca."));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto belum dapat dimuat."));
    image.src = src;
  });
}

export async function compressImageFile(
  file: File,
  maxSide: number = MAX_SIDE,
  quality: number = QUALITY
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);
  const image = await loadImage(dataUrl);
  const sourceWidth = image.naturalWidth || maxSide;
  const sourceHeight = image.naturalHeight || maxSide;
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
