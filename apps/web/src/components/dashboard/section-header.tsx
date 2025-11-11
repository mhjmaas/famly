import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  viewAllLabel: string;
  viewAllHref: string;
}

export function SectionHeader({
  title,
  viewAllLabel,
  viewAllHref,
}: SectionHeaderProps) {
  return (
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
      <CardTitle className="text-xl font-bold">{title}</CardTitle>
      <Link
        href={viewAllHref}
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "gap-2",
        )}
      >
        {viewAllLabel}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </CardHeader>
  );
}
