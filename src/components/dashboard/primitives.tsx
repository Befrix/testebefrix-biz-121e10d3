import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  icon: Icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow-primary">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </motion.div>
  );
}

export function StatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  index = 0,
}: {
  label: string;
  value: string;
  delta?: { value: string; positive?: boolean };
  hint?: string;
  icon?: LucideIcon;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      className="group relative overflow-hidden rounded-2xl glass p-5"
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-primary opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20" />
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-primary-glow" />}
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
      <div className="mt-1 flex items-center gap-2">
        {delta && (
          <span
            className={cn(
              "text-xs font-medium",
              delta.positive === false ? "text-destructive" : "text-success"
            )}
          >
            {delta.value}
          </span>
        )}
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
    </motion.div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl glass p-6", className)}>
      {(title || action) && (
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-semibold">{title}</h2>}
            {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

const TONE_MAP: Record<string, string> = {
  success: "bg-success/15 text-success border-success/25",
  destructive: "bg-destructive/15 text-destructive border-destructive/25",
  warning: "bg-warning/15 text-warning border-warning/25",
  info: "bg-info/15 text-info border-info/25",
  muted: "bg-muted text-muted-foreground border-border",
  primary: "bg-primary/15 text-primary-glow border-primary/25",
};

export function StatusPill({ label, tone = "muted" }: { label: string; tone?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_MAP[tone] ?? TONE_MAP.muted
      )}
    >
      {label}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-4 font-medium">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
