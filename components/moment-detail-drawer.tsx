"use client";

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
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { deleteMoment, updateMoment } from "@/app/(app)/actions";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/image-utils";
import { toast } from "sonner";
import { format } from "date-fns";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";
import { Trash2, Pencil, X, ImagePlus, CalendarDays } from "lucide-react";
import { useState, useRef, useEffect } from "react";

type Props = {
  moment: MomentWithAuthor | null;
  isOwn: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MomentDetailDrawer({ moment, isOwn, onOpenChange }: Props) {
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [date, setDate] = useState<Date>(() => new Date());
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (moment && !editing) {
      setTitle(moment.title);
      setText(moment.text || "");
      setDate(new Date(moment.created_at));
      setImageFile(null);
      setRemoveImage(false);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moment, editing]);

  function startEditing() {
    if (!moment) return;
    setTitle(moment.title);
    setText(moment.text || "");
    setDate(new Date(moment.created_at));
    setImageFile(null);
    setRemoveImage(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setEditing(true);
  }

  function cancelEditing() {
    setEditing(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setRemoveImage(false);
    const url = URL.createObjectURL(file);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(url);
  }

  async function handleSave() {
    if (!moment || !title.trim()) return;
    setSaving(true);

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
      if (removeImage) formData.set("remove_image", "true");
      const d = new Date(date);
      d.setHours(12, 0, 0, 0);
      formData.set("created_at", d.toISOString());

      const result = await updateMoment(moment.id, formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        setEditing(false);
        onOpenChange(false);
        toast.success("Moment updated");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!moment) return;
    setDeleting(true);
    const result = await deleteMoment(moment.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Moment deleted");
      onOpenChange(false);
    }
    setDeleting(false);
  }

  function handleClose(open: boolean) {
    if (!open) {
      setEditing(false);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    onOpenChange(open);
  }

  const showImage = editing
    ? imagePreview || (!removeImage && moment?.image_path)
    : moment?.image_path;

  return (
    <Drawer open={!!moment} onOpenChange={handleClose}>
      <DrawerContent>
        {moment && (
          <>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <span>{moment.profiles.emoji}</span>
                {editing ? (
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-8 text-base font-semibold"
                  />
                ) : (
                  <span>{moment.title}</span>
                )}
              </DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4">
              {editing ? (
                <>
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Popover
                      open={datePickerOpen}
                      onOpenChange={setDatePickerOpen}
                    >
                      <PopoverTrigger className="flex h-12 w-full items-center gap-2 rounded-md border bg-background px-3 text-base text-foreground">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        {format(date, "d MMM yyyy")}
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={(d) => {
                            if (d) setDate(d);
                            setDatePickerOpen(false);
                          }}
                          defaultMonth={date}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (optional)</Label>
                    <Textarea
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      rows={3}
                      className="resize-none text-base"
                      placeholder="Add some details..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Photo (optional)</Label>
                    {showImage ? (
                      <div className="relative">
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-h-48 w-full rounded-lg object-cover"
                          />
                        ) : (
                          <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                            <Image
                              src={getImageUrl(moment.image_path!)}
                              alt={moment.title}
                              fill
                              className="object-cover"
                              sizes="(max-width: 512px) 92vw, 480px"
                            />
                          </div>
                        )}
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-2 top-2 h-7 w-7 rounded-full"
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
                </>
              ) : (
                <>
                  {moment.image_path && (
                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
                      <Image
                        src={getImageUrl(moment.image_path)}
                        alt={moment.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 512px) 92vw, 480px"
                      />
                    </div>
                  )}
                  {moment.text && (
                    <p className="whitespace-pre-wrap text-sm text-foreground">
                      {moment.text}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(moment.created_at), "PPpp")}
                  </p>
                </>
              )}
            </div>
            <DrawerFooter>
              {isOwn &&
                (editing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={cancelEditing}
                      className="h-12 flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving || !title.trim()}
                      className="h-12 flex-1"
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={startEditing}
                      className="h-12 flex-1"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={deleting}
                      className="h-12 flex-1"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deleting ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                ))}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
