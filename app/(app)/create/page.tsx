"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import {
  compressImage,
  extractExifDate,
  extractExifLocation,
} from "@/lib/image-utils";
import type { ExifDateTime, ExifLocation } from "@/lib/image-utils";
import { createMoment } from "@/app/(app)/actions";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { SongSearch } from "@/components/song-search";
import { LocationSearch } from "@/components/location-search";
import type { Location } from "@/components/location-search";
import { ArrowLeft, CropIcon, ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { ImageCropper } from "@/components/image-cropper";
import type { Song } from "@/lib/types";

export default function CreateMomentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [time, setTime] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [song, setSong] = useState<Song | null>(null);
  const [location, setLocation] = useState<Location | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [exifPrompt, setExifPrompt] = useState<ExifDateTime | null>(null);
  const [exifLocationPrompt, setExifLocationPrompt] =
    useState<ExifLocation | null>(null);
  const [exifLocationName, setExifLocationName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const exif = await extractExifDate(file);
    if (exif) setExifPrompt(exif);

    const gps = await extractExifLocation(file);
    if (gps) {
      // Reverse geocode to get a human-readable name
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${gps.lat}&lon=${gps.lng}&format=json&accept-language=de&zoom=18`,
          { headers: { "User-Agent": "moments.dj/1.0" } },
        );
        if (res.ok) {
          const data = await res.json();
          const a = data.address;
          const place =
            data.name || a?.amenity || a?.shop || a?.tourism || a?.leisure;
          const area = a?.suburb || a?.city || a?.town || a?.village;
          const name =
            place && area
              ? `${place}, ${area}`
              : place ||
                (a?.road && area
                  ? `${a.road}, ${area}`
                  : data.display_name?.split(",").slice(0, 3).join(",").trim());
          setExifLocationName(name || null);
        }
      } catch {
        /* ignore */
      }
      setExifLocationPrompt(gps);
    }
  }

  function handleCropComplete(croppedFile: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setImageFile(croppedFile);
    const url = URL.createObjectURL(croppedFile);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  }

  function handleCropClose() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function handleSubmit() {
    if (!title.trim()) return;
    setLoading(true);

    try {
      let imagePath: string | null = null;

      if (imageFile) {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Nicht angemeldet");

        const compressed = await compressImage(imageFile);
        const ext = imageFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;

        const [compressedResult, originalResult] = await Promise.all([
          supabase.storage.from("moment-images").upload(path, compressed),
          supabase.storage
            .from("moment-images")
            .upload(`originals/${path}`, imageFile),
        ]);

        if (compressedResult.error) throw compressedResult.error;
        if (originalResult.error) throw originalResult.error;
        imagePath = path;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      if (text.trim()) formData.set("text", text.trim());
      if (imagePath) formData.set("image_path", imagePath);
      formData.set("moment_date", date);
      if (time) formData.set("moment_time", time);
      if (song) {
        formData.set("song_title", song.title);
        formData.set("song_artist", song.artist);
        formData.set("song_deezer_id", song.deezerId);
        formData.set("song_cover_url", song.coverUrl);
        if (song.spotifyUrl) formData.set("song_spotify_url", song.spotifyUrl);
      }
      if (location) {
        formData.set("location_name", location.name);
        formData.set("location_lat", String(location.lat));
        formData.set("location_lng", String(location.lng));
      }

      const result = await createMoment(formData);
      if (result.error) {
        toast.error(result.error);
        setLoading(false);
      } else {
        toast.success("Moment erstellt");
        router.push("/");
      }
    } catch {
      toast.error("Etwas ist schiefgelaufen");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-8 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Neuer Moment</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="moment-title">Titel</Label>
          <Input
            id="moment-title"
            placeholder="Was ist passiert?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Datum</Label>
          <DatePicker
            value={date}
            onChange={setDate}
            time={time}
            onTimeChange={setTime}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="moment-text">Notizen (optional)</Label>
          <Textarea
            id="moment-text"
            placeholder="Füge ein paar Details hinzu..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-none text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Song (optional)</Label>
          <SongSearch value={song} onChange={setSong} />
        </div>
        <div className="space-y-2">
          <Label>Ort (optional)</Label>
          <LocationSearch value={location} onChange={setLocation} />
        </div>
        <div className="space-y-2">
          <Label>Foto (optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Vorschau"
                width={480}
                height={360}
                className="max-h-48 w-full rounded-lg object-cover"
              />
              <div className="absolute right-2 top-2 flex gap-1.5">
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-sm"
                  onClick={() => setCropSrc(imagePreview!)}
                >
                  <CropIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-sm"
                  onClick={() => {
                    setImageFile(null);
                    if (imagePreview) URL.revokeObjectURL(imagePreview);
                    setImagePreview(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-24 w-full items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 text-muted-foreground transition-colors hover:border-muted-foreground/50"
            >
              <ImagePlus className="h-6 w-6" />
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            aria-label={loading ? "Erstelle..." : "Moment erstellen"}
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      </div>

      {cropSrc && (
        <ImageCropper
          imageSrc={cropSrc}
          open={!!cropSrc}
          onClose={handleCropClose}
          onCropComplete={handleCropComplete}
        />
      )}

      {exifPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
          onClick={() => setExifPrompt(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-background p-5 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">
              Das Foto wurde am{" "}
              <span className="font-semibold">
                {new Date(
                  exifPrompt.date + "T" + exifPrompt.time,
                ).toLocaleDateString("de-DE", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}{" "}
                um {exifPrompt.time} Uhr
              </span>{" "}
              aufgenommen. Datum und Uhrzeit übernehmen?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setExifPrompt(null)}
              >
                Nein
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setDate(exifPrompt.date);
                  setTime(exifPrompt.time);
                  setExifPrompt(null);
                }}
              >
                Übernehmen
              </Button>
            </div>
          </div>
        </div>
      )}

      {exifLocationPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50"
          onClick={() => setExifLocationPrompt(null)}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-background p-5 shadow-lg space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-medium">
              Das Foto wurde{" "}
              {exifLocationName ? (
                <>
                  bei <span className="font-semibold">{exifLocationName}</span>
                </>
              ) : (
                "mit GPS-Daten"
              )}{" "}
              aufgenommen. Ort übernehmen?
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setExifLocationPrompt(null)}
              >
                Nein
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  setLocation({
                    name:
                      exifLocationName ||
                      `${exifLocationPrompt.lat.toFixed(4)}, ${exifLocationPrompt.lng.toFixed(4)}`,
                    lat: exifLocationPrompt.lat,
                    lng: exifLocationPrompt.lng,
                  });
                  setExifLocationPrompt(null);
                }}
              >
                Übernehmen
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <Button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          className="h-12 w-full text-base"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Erstelle...
            </>
          ) : (
            "Moment erstellen"
          )}
        </Button>
      </div>
    </div>
  );
}
