"use client";

import type { MomentWithAuthor } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { format } from "date-fns";
import { motion } from "framer-motion";
import Image from "next/image";
import { getImageUrl } from "@/lib/image-utils";

type Props = {
  moment: MomentWithAuthor;
  isOwn: boolean;
  onSelect: () => void;
};

export function TimelineItem({ moment, isOwn, onSelect }: Props) {
  return (
    <div className="relative flex">
      {/* Left side */}
      <div className="w-[calc(50%-20px)] pr-3">
        {!isOwn && <ItemCard moment={moment} onSelect={onSelect} />}
      </div>

      {/* Center emoji marker */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-background text-base shadow-sm">
        {moment.profiles.emoji}
      </div>

      {/* Right side */}
      <div className="w-[calc(50%-20px)] pl-3">
        {isOwn && <ItemCard moment={moment} onSelect={onSelect} />}
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
              className="object-cover"
              sizes="(max-width: 512px) 45vw, 220px"
            />
          </div>
        )}
        <CardContent className={moment.image_path ? "pt-2 pb-2" : "pt-3 pb-2"}>
          <h3 className="text-sm font-medium leading-snug">{moment.title}</h3>
          {moment.text && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {moment.text}
            </p>
          )}
          <p className="mt-1.5 text-[10px] text-muted-foreground/70">
            {format(new Date(moment.created_at), "d MMM yyyy")}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
