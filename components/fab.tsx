import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const isDev = process.env.NODE_ENV === "development";

type Props = {
  href: string;
};

export function FAB({ href }: Props) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ size: "icon" }),
        "fixed right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        isDev ? "bottom-22" : "bottom-6",
      )}
    >
      <Plus className="h-6 w-6" />
    </Link>
  );
}
