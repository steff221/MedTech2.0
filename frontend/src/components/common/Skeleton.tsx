import { cn } from "@/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton animate-shimmer rounded-lg", className)} />;
}
