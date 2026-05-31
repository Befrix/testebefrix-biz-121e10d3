import { Link } from "@tanstack/react-router";
import { Zap } from "lucide-react";
import { GlowOrb } from "@/components/ui/glow-orb";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
      <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
      <GlowOrb className="-top-40 -left-40" variant="primary" size="xl" />
      <GlowOrb className="-bottom-40 -right-40" variant="accent" size="lg" />

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
            <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">BEFRIX</span>
        </Link>

        <div className="w-full max-w-md">
          <div className="glass-strong rounded-2xl border border-border-glow/30 p-8 shadow-glow-soft">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            <div className="mt-8">{children}</div>
          </div>
          {footer && (
            <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}