import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Zap, LogOut, Menu, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { NAV_ITEMS, NAV_GROUPS } from "@/lib/dashboard";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="flex flex-col gap-6">
      {NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <p className="px-3 pb-2 text-2xs font-semibold uppercase tracking-widest text-muted-foreground">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {NAV_ITEMS.filter((i) => i.group === group.key).map((item) => {
              const active =
                item.to === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-gradient-to-b from-primary to-accent"
                    />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0", active && "text-primary-glow")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  const { user, signOut } = useAuth();
  return (
    <div className="flex h-full flex-col">
      <Link to="/dashboard" onClick={onNavigate} className="flex items-center gap-2 px-3 py-1">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
          <Zap className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
        </div>
        <div>
          <span className="block text-base font-semibold leading-none tracking-tight">BEFRIX</span>
          <span className="block text-2xs text-muted-foreground">Outbound Intelligence</span>
        </div>
      </Link>

      <div className="mt-8 flex-1 overflow-y-auto pr-1">
        <NavLinks onNavigate={onNavigate} />
      </div>

      <div className="mt-4 border-t border-border-subtle pt-4">
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-secondary/40 px-3 py-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={() => signOut()}>
          <LogOut className="h-4 w-4" /> Sair
        </Button>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border-subtle bg-sidebar/80 px-4 py-5 backdrop-blur-xl lg:block">
        <SidebarBody />
      </aside>

      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border-subtle bg-background/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-glow-primary">
            <Zap className="h-4 w-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="text-base font-semibold tracking-tight">BEFRIX</span>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 bg-sidebar px-4 py-5">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarBody onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
