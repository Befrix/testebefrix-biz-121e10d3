import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Users, Building2, CreditCard, Receipt, Calendar, ScrollText, Settings, ShieldCheck, LogOut, FileCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/clientes", label: "Clientes", icon: Building2 },
  { to: "/admin/usuarios", label: "Usuários", icon: Users },
  { to: "/admin/planos", label: "Planos", icon: CreditCard },
  { to: "/admin/pagamentos", label: "Pagamentos", icon: Receipt },
  { to: "/admin/eventos", label: "Eventos", icon: Calendar },
  { to: "/admin/logs", label: "Logs", icon: ScrollText },
  { to: "/admin/aceites", label: "Aceites", icon: FileCheck },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { signOut, user } = useAuth();
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-card/40 backdrop-blur lg:flex lg:flex-col">
      <div className="flex h-16 items-center gap-2 border-b border-border px-5">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold tracking-tight">Admin Platform</span>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-3">
        <p className="px-2 pb-2 text-xs text-muted-foreground truncate">{user?.email}</p>
        <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
    </aside>
  );
}