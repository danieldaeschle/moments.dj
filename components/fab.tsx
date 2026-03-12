"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Props = {
  onClick: () => void;
};

export function FAB({ onClick }: Props) {
  return (
    <Button
      onClick={onClick}
      size="icon"
      className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
