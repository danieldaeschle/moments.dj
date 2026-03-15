"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/date-picker";
import { createClient } from "@/lib/supabase/client";
import { compressImage, getImageUrl, extractExifDate } from "@/lib/image-utils";
import type { ExifDateTime } from "@/lib/image-utils";
import { updateMoment, deleteMoment } from "@/app/(app)/actions";
import { toast } from "sonner";
import {
  ArrowLeft,
  CropIcon,
  ImagePlus,
  Loader2,
  X,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { ImageCropper } from "@/components/image-cropper";
import type { MomentWithAuthor } from "@/lib/types";

type Props = {
  moment: MomentWithAuthor;
};

export function EditMomentForm({ moment }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState(moment.title);
  const [text, setText] = useState(moment.text || "");
  const [date, setDate] = useState<string>(moment.moment_date);
  const [time, setTime] = useState<string>(moment.moment_time || "");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [exifPrompt, setExifPrompt] = useState<ExifDateTime | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showImage = imagePreview || (!removeImage && moment.image_path);

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const exif = await extractExifDate(file);
    if (exif) setExifPrompt(exif);
  }

  function handleCropComplete(croppedFile: File) {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setImageFile(croppedFile);
    setRemoveImage(false);
    const url = URL.createObjectURL(croppedFile);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  }

  function handleCropClose() {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

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
      if (removeImage) formData.set("remove_image", "true");
      formData.set("moment_date", date);
      formData.set("moment_time", time);

      const result = await updateMoment(moment.id, formData);
      if (result.error) {
        toast.error(result.error);
        setSaving(false);
      } else {
        toast.success("Moment aktualisiert");
        router.push("/");
      }
    } catch {
      toast.error("Etwas ist schiefgelaufen");
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const result = await deleteMoment(moment.id);
    if (result.error) {
      toast.error(result.error);
      setDeleting(false);
    } else {
      toast.success("Moment gelöscht");
      router.push("/");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 pb-8 pt-4">
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Moment bearbeiten</h1>
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
          <Label>Foto (optional)</Label>
          {showImage ? (
            <div className="relative">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Vorschau"
                  width={480}
                  height={360}
                  className="max-h-48 w-full rounded-lg object-cover"
                />
              ) : (
                <div className="relative aspect-4/3 overflow-hidden rounded-lg">
                  <Image
                    src={getImageUrl(moment.image_path!)}
                    alt={moment.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 512px) 92vw, 480px"
                  />
                </div>
              )}
              <div className="absolute right-2 top-2 flex gap-1.5">
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full shadow-sm"
                  onClick={() => {
                    if (imagePreview) {
                      setCropSrc(imagePreview);
                    } else if (moment.image_path) {
                      setCropSrc(getImageUrl(moment.image_path));
                    }
                  }}
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
                    setRemoveImage(true);
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

      <div className="mt-8 flex gap-2">
        <Button
          variant="destructive"
          onClick={handleDelete}
          disabled={deleting || saving}
          className="h-12 flex-1"
        >
          {deleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          {deleting ? "Lösche..." : "Löschen"}
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="h-12 flex-1 text-base"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Speichere...
            </>
          ) : (
            "Änderungen speichern"
          )}
        </Button>
      </div>
    </div>
  );
}
