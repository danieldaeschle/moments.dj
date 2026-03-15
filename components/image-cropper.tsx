"use client";

import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

type Props = {
  imageSrc: string;
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedFile: File) => void;
};

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const initialCrop: Crop = {
        unit: "%",
        x: 0,
        y: 0,
        width: 100,
        height: 100,
      };
      setCrop(initialCrop);
    },
    [],
  );

  async function handleConfirm() {
    if (!completedCrop || !imgRef.current) return;

    const file = await getCroppedImage(imgRef.current, completedCrop);
    onCropComplete(file);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-semibold text-white">Bild zuschneiden</h2>
        <button
          onClick={onClose}
          className="rounded-full p-1.5 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4">
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={imageSrc}
            alt="Zuschneiden"
            crossOrigin="anonymous"
            onLoad={onImageLoad}
            className="max-h-[calc(100vh-10rem)] max-w-full object-contain"
          />
        </ReactCrop>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          Abbrechen
        </Button>
        <Button size="sm" onClick={handleConfirm} disabled={!completedCrop}>
          <Check className="mr-1.5 h-4 w-4" />
          Zuschneiden
        </Button>
      </div>
    </div>,
    document.body,
  );
}

async function getCroppedImage(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<File> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = Math.floor(crop.width * scaleX);
  canvas.height = Math.floor(crop.height * scaleY);

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    canvas.width,
    canvas.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas toBlob failed"));
          return;
        }
        resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.92,
    );
  });
}
