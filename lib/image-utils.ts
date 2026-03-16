import imageCompression from "browser-image-compression";
import exifr from "exifr";

export async function compressImage(file: File): Promise<File> {
  return imageCompression(file, {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1600,
    useWebWorker: true,
  });
}

export function getImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/moment-images/${path}`;
}

export function getOriginalImageUrl(path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/moment-images/originals/${path}`;
}

export type ExifDateTime = {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:MM"
};

export type ExifLocation = {
  lat: number;
  lng: number;
};

export async function extractExifDate(
  file: File,
): Promise<ExifDateTime | null> {
  try {
    const exif = await exifr.parse(file, ["DateTimeOriginal", "CreateDate"]);
    const dt: Date | undefined = exif?.DateTimeOriginal ?? exif?.CreateDate;
    if (!dt || !(dt instanceof Date) || isNaN(dt.getTime())) return null;

    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const d = String(dt.getDate()).padStart(2, "0");
    const hh = String(dt.getHours()).padStart(2, "0");
    const mm = String(dt.getMinutes()).padStart(2, "0");

    return { date: `${y}-${m}-${d}`, time: `${hh}:${mm}` };
  } catch {
    return null;
  }
}

export async function extractExifLocation(
  file: File,
): Promise<ExifLocation | null> {
  try {
    const exif = await exifr.gps(file);
    if (
      !exif ||
      typeof exif.latitude !== "number" ||
      typeof exif.longitude !== "number"
    )
      return null;
    return { lat: exif.latitude, lng: exif.longitude };
  } catch {
    return null;
  }
}
