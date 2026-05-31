import { cn } from "@/lib/utils";

interface GlowOrbProps {
  className?: string;
  variant?: "primary" | "accent";
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeMap = {
  sm: "h-48 w-48",
  md: "h-80 w-80",
  lg: "h-[32rem] w-[32rem]",
  xl: "h-[48rem] w-[48rem]",
};

export function GlowOrb({ className, variant = "primary", size = "lg" }: GlowOrbProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full blur-3xl opacity-40 animate-glow-pulse",
        sizeMap[size],
        variant === "primary" ? "bg-primary/40" : "bg-accent/40",
        className,
      )}
    />
  );
}
