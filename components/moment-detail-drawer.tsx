"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Image from "next/image";
import Link from "next/link";
import { getImageUrl } from "@/lib/image-utils";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  moment: MomentWithAuthor | null;
  isOwn: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MomentDetailDrawer({ moment, isOwn, onOpenChange }: Props) {
  return (
    <Drawer open={!!moment} onOpenChange={onOpenChange}>
      <DrawerContent>
        {moment && (
          <>
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <span>{moment.profiles.emoji}</span>
                <span>{moment.title}</span>
              </DrawerTitle>
            </DrawerHeader>
            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-4">
              {moment.image_path && (
                <div className="relative aspect-4/3 overflow-hidden rounded-lg">
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
                {format(new Date(moment.moment_date + "T00:00:00"), "PPP", {
                  locale: de,
                })}
              </p>
            </div>
            <DrawerFooter>
              {isOwn && (
                <Link
                  href={`/edit/${moment.id}`}
                  onClick={() => onOpenChange(false)}
                  className={cn(
                    buttonVariants(),
                    "h-12 w-full",
                  )}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Bearbeiten
                </Link>
              )}
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
