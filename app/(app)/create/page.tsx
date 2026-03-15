"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-utils";
import { createMoment } from "@/app/(app)/actions";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { ArrowLeft, CropIcon, ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { ImageCropper } from "@/components/image-cropper";

export default function CreateMomentPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [loading, setLoading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    if (fileInputRef.current) fileInputRef.current.value = "";
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

        const { error: uploadError } = await supabase.storage
          .from("moment-images")
          .upload(path, compressed);

        if (uploadError) throw uploadError;
        imagePath = path;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      if (text.trim()) formData.set("text", text.trim());
      if (imagePath) formData.set("image_path", imagePath);
      formData.set("moment_date", date);

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
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => router.back()}
        >
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
          <DatePicker value={date} onChange={setDate} />
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
          {imagePreview ? (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Vorschau"
                width={480}
                height={360}
                className="max-h-48 w-full rounded-lg object-cover"
              />
              <div className="absolute right-2 top-2 flex gap-1">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full"
                  onClick={() => setCropSrc(imagePreview!)}
                >
                  <CropIcon className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-7 w-7 rounded-full"
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
