"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { DatePicker } from "@/components/date-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createCapsule } from "@/app/(app)/capsules/actions";
import { TRIGGER_LABELS } from "@/lib/constants";
import { compressImage } from "@/lib/image-utils";
import { createClient } from "@/lib/supabase/client";
import type { TriggerType } from "@/lib/types";

type Props = {
  recipientName: string;
};

export function CreateCapsuleForm({ recipientName }: Props) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [triggerType, setTriggerType] = useState<TriggerType>("manual");
  const [openAt, setOpenAt] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
    if (!title.trim() || !message.trim()) return;
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
      formData.set("message", message.trim());
      formData.set("trigger_type", triggerType);
      if (imagePath) formData.set("image_path", imagePath);
      if (triggerType === "date") formData.set("open_at", openAt);

      const result = await createCapsule(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Kapsel erstellt");
        router.push("/capsules");
      }
    } catch {
      toast.error("Etwas ist schiefgelaufen");
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
        <h1 className="text-lg font-semibold">Neue Kapsel für {recipientName}</h1>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="capsule-title">Titel</Label>
          <Input
            id="capsule-title"
            placeholder="Gib der Kapsel einen Namen..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="capsule-message">Nachricht</Label>
          <Textarea
            id="capsule-message"
            placeholder="Schreibe deine Nachricht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none text-base"
          />
        </div>

        <div className="space-y-2">
          <Label>Auslöser</Label>
          <Select
            value={triggerType}
            onValueChange={(value) => setTriggerType(value as TriggerType)}
          >
            <SelectTrigger className="h-12 w-full text-base">
              <SelectValue>{TRIGGER_LABELS[triggerType]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manual">{TRIGGER_LABELS.manual}</SelectItem>
              <SelectItem value="date">{TRIGGER_LABELS.date}</SelectItem>
              <SelectItem value="bad_day">{TRIGGER_LABELS.bad_day}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {triggerType === "date" && (
          <div className="space-y-2">
            <Label>Öffnet am</Label>
            <DatePicker value={openAt} onChange={setOpenAt} />
          </div>
        )}

        <div className="space-y-2">
          <Label>Bild (optional)</Label>
          {imagePreview ? (
            <div className="relative">
              <Image
                src={imagePreview}
                alt="Vorschau"
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
          disabled={loading || !title.trim() || !message.trim()}
          className="h-12 w-full text-base"
        >
          {loading ? "Erstelle..." : "Kapsel erstellen"}
        </Button>
      </div>
    </div>
  );
}