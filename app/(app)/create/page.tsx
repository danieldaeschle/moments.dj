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
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import Image from "next/image";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
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
        if (!user) throw new Error("Not authenticated");

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
      const d = new Date(date + "T12:00:00");
      formData.set("created_at", d.toISOString());

      const result = await createMoment(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Moment created ✨");
        router.push("/");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
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
        <h1 className="text-lg font-semibold">New moment</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="moment-title">Title</Label>
          <Input
            id="moment-title"
            placeholder="What happened?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Date</Label>
          <DatePicker value={date} onChange={setDate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="moment-text">Notes (optional)</Label>
          <Textarea
            id="moment-text"
            placeholder="Add some details..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="resize-none text-base"
          />
        </div>
        <div className="space-y-2">
          <Label>Photo (optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Preview"
                width={480}
                height={360}
                className="max-h-48 w-full rounded-lg object-cover"
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-2 h-7 w-7 rounded-full"
                onClick={() => {
                  setImageFile(null);
                  if (imagePreview) URL.revokeObjectURL(imagePreview);
                  setImagePreview(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
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

      <div className="mt-8">
        <Button
          onClick={handleSubmit}
          disabled={loading || !title.trim()}
          className="h-12 w-full text-base"
        >
          {loading ? "Creating..." : "Create moment"}
        </Button>
      </div>
    </div>
  );
}
