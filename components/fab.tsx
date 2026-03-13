"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const isDev = process.env.NODE_ENV === "development";

type Props = {
  onClick: () => void;
};

export function FAB({ onClick }: Props) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className={`fixed right-6 z-50 h-14 w-14 rounded-full shadow-lg ${isDev ? "bottom-22" : "bottom-6"}`}
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
