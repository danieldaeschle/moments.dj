"use client";

import { useState, useRef, useEffect } from "react";
import type { MomentWithAuthor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { createClient } from "@/lib/supabase/client";
import { compressImage, getImageUrl } from "@/lib/image-utils";
import { updateMoment } from "@/app/(app)/actions";
import { toast } from "sonner";
import { CalendarDays, ImagePlus, X } from "lucide-react";

type Props = {
  moment: MomentWithAuthor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditMomentDrawer({ moment, open, onOpenChange }: Props) {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingImage, setExistingImage] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moment && open) {
      setTitle(moment.title);
      setText(moment.text || "");
      setDate(new Date(moment.created_at).toISOString().slice(0, 10));
      setExistingImage(moment.image_path);
      setRemoveImage(false);
      setImageFile(null);
      setImagePreview(null);
    }
  }, [moment, open]);

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const url = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  }

  function handleRemoveImage() {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExistingImage(null);
    setRemoveImage(true);
  }

  async function handleSubmit() {
    if (!moment || !title.trim()) return;
    setLoading(true);

    try {
      let newImagePath: string | null = null;

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
        newImagePath = path;
      }

      const formData = new FormData();
      formData.set("title", title.trim());
      if (text.trim()) formData.set("text", text.trim());
      if (newImagePath) formData.set("image_path", newImagePath);
      if (removeImage) formData.set("remove_image", "true");
      const d = new Date(date + "T12:00:00");
      formData.set("created_at", d.toISOString());

      const result = await updateMoment(moment.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        onOpenChange(false);
        toast.success("Moment updated ✨");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const displayImage =
    imagePreview ||
    (existingImage && !removeImage ? getImageUrl(existingImage) : null);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Edit moment</DrawerTitle>
        </DrawerHeader>
        <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4">
          <div className="space-y-2">
            <Label htmlFor="edit-moment-title">Title</Label>
            <Input
              id="edit-moment-title"
              placeholder="What happened?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 text-base"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-moment-date">Date</Label>
            <div
              data-vaul-no-drag
              className="relative flex h-12 w-full cursor-pointer items-center rounded-md border bg-background px-3 text-base text-foreground"
              onClick={() => dateInputRef.current?.showPicker()}
            >
              <span className="flex-1">
                {new Date(date + "T12:00:00").toLocaleDateString()}
              </span>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <input
                ref={dateInputRef}
                id="edit-moment-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="absolute inset-0 opacity-0"
                tabIndex={-1}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-moment-text">Notes (optional)</Label>
            <Textarea
              id="edit-moment-text"
              placeholder="Add some details..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none text-base"
            />
          </div>
          <div className="space-y-2">
            <Label>Photo (optional)</Label>
            {displayImage ? (
              <div className="relative">
                <img
                  src={displayImage}
                  alt="Preview"
                  className="max-h-48 w-full rounded-lg object-cover"
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-2 top-2 h-7 w-7 rounded-full"
                  onClick={handleRemoveImage}
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
        <DrawerFooter>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="h-12 text-base"
          >
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
