"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { motion } from "framer-motion";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";

type Props = {
  moment: MomentWithAuthor;
  onSelect: () => void;
};

export function TimelineItem({ moment, onSelect }: Props) {
  return (
    <div className="relative flex items-start">
      {/* Left emoji marker */}
      <div
        data-emoji-marker
        className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-base shadow-sm"
      >
        {moment.profiles.emoji}
      </div>

      {/* Right side – full width */}
      <div className="min-w-0 flex-1 pl-3">
        <ItemCard moment={moment} onSelect={onSelect} />
      </div>
    </div>
  );
}

function ItemCard({
  moment,
  onSelect,
}: {
  moment: MomentWithAuthor;
  onSelect: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card
        className="py-0 gap-1 cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
        onClick={onSelect}
      >
        {moment.image_path && (
          <div className="relative aspect-4/3 overflow-hidden rounded-t-lg">
            <Image
              src={getImageUrl(moment.image_path)}
              alt={moment.title}
              fill
              loading="eager"
              className="object-cover"
              sizes="(max-width: 512px) 80vw, 420px"
            />
          </div>
        )}
        <CardContent className="py-3">
          <p className="mb-2 text-xs text-muted-foreground/70">
            {format(new Date(moment.moment_date + "T00:00:00"), "d. MMM yyyy", {
              locale: de,
            })}
          </p>
          <h3 className="text-sm font-medium leading-snug">{moment.title}</h3>
          {moment.text && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {moment.text}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
