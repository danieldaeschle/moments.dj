"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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

const CROP_STAGE_GUTTER = 24;

export function ImageCropper({
  imageSrc,
  open,
  onClose,
  onCropComplete,
}: Props) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [stageSize, setStageSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const updateStageSize = () => {
      setStageSize({
        width: stage.clientWidth,
        height: stage.clientHeight,
      });
    };

    updateStageSize();

    const observer = new ResizeObserver(updateStageSize);
    observer.observe(stage);

    return () => observer.disconnect();
  }, [open]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setImageSize({
        width: e.currentTarget.naturalWidth,
        height: e.currentTarget.naturalHeight,
      });

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

  const displaySize =
    imageSize && stageSize ? getContainSize(imageSize, stageSize) : null;

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex h-dvh flex-col bg-black">
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-base font-semibold text-white">Bild zuschneiden</h2>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div
        ref={stageRef}
        className="flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-2"
      >
        <div className="flex h-full w-full items-center justify-center overflow-hidden [&_.ReactCrop__child-wrapper]:overflow-visible">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            style={displaySize ?? undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Zuschneiden"
              crossOrigin="anonymous"
              onLoad={onImageLoad}
              className="block"
              style={displaySize ?? undefined}
            />
          </ReactCrop>
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-4 py-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          Abbrechen
        </Button>
        <Button onClick={handleConfirm} disabled={!completedCrop}>
          <Check className="mr-1.5 h-4 w-4" />
          Zuschneiden
        </Button>
      </div>
    </div>,
    document.body,
  );
}

function getContainSize(
  imageSize: { width: number; height: number },
  stageSize: { width: number; height: number },
) {
  const availableWidth = Math.max(stageSize.width - CROP_STAGE_GUTTER * 2, 1);
  const availableHeight = Math.max(stageSize.height - CROP_STAGE_GUTTER * 2, 1);
  const widthRatio = availableWidth / imageSize.width;
  const heightRatio = availableHeight / imageSize.height;
  const scale = Math.min(widthRatio, heightRatio, 1);

  return {
    width: Math.floor(imageSize.width * scale),
    height: Math.floor(imageSize.height * scale),
  };
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
