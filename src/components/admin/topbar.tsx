import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";
import { Bell, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { listAdminNotifications, adminSearch } from "@/lib/admin.functions";
import { cn } from "@/lib/utils";

const LS_KEY = "befrix.admin.notifications.lastSeen";

const ACTION_LABELS: Record<string, string> = {
  "subscription.upgrade_requested": "Solicitação de upgrade",
  "subscription.downgrade_requested": "Solicitação de downgrade",
  "subscription.cancel_requested": "Cancelamento solicitado",
  "subscription.plan_changed": "Alteração de plano",
  "lead.created": "Novo lead capturado",
  "lead.updated": "Lead atualizado",
  "eventos_uploads.created": "Novo upload de eventos",
  "automation.executed": "Automação executada",
  "automation.failed": "Erro em automação",
  "campanha.created": "Campanha criada",
  "plano.update": "Plano atualizado",
  "platform_admin.grant": "Admin concedido",
  "platform_admin.revoke": "Admin revogado",
  "document_accepted": "Termo aceito",
  "satisfaction_survey": "Pesquisa de satisfação",
};

function routeFor(action: string): string {
  if (action?.startsWith("subscription") || action?.startsWith("plano") || action?.startsWith("invoice")) return "/admin/pagamentos";
  if (action?.startsWith("eventos") || action?.startsWith("upload")) return "/admin/eventos";
  if (action?.startsWith("automation") || action?.startsWith("workflow")) return "/admin/logs";
  if (action?.startsWith("lead") || action?.startsWith("campanha")) return "/admin/clientes";
  if (action?.startsWith("platform_admin")) return "/admin/usuarios";
  if (action === "document_accepted") return "/admin/aceites";
  return "/admin/logs";
}

export function AdminTopbar() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const notifFn = useServerFn(listAdminNotifications);
  const searchFn = useServerFn(adminSearch);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
  });

  const { data: notifData } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => notifFn(),
  });

  const { data: searchData, isFetching: searching } = useQuery({
    queryKey: ["admin-search", q],
    queryFn: () => searchFn({ data: { q } }),
    enabled: q.trim().length >= 2,
  });

  useEffect(() => {
    const ch = supabase
      .channel("admin-audit-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const notifications = notifData?.notifications ?? [];
  const unread = useMemo(() => notifications.filter((n) => n.created_at > lastSeen).length, [notifications, lastSeen]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LS_KEY, now);
    setLastSeen(now);
  };

  const handleNotificationClick = (n: (typeof notifications)[number]) => {
    setOpen(false);
    navigate({ to: routeFor(n.action) });
  };

  const groups = searchData?.results
    ? (Object.entries(searchData.results) as Array<[string, Array<{ id: string; label: string; sub?: string | null; href: string }>]>)
    : [];
  const totalResults = groups.reduce((s, [, arr]) => s + arr.length, 0);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-4 lg:px-8">
        <Popover open={searchOpen} onOpenChange={setSearchOpen}>
          <PopoverTrigger asChild>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => { setQ(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Buscar clientes, empresas, usuários, leads, pagamentos…"
                className="pl-9"
              />
            </div>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[640px] max-w-[92vw] p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
            <ScrollArea className="max-h-[60vh]">
              {q.trim().length < 2 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Digite ao menos 2 caracteres para pesquisar.</p>
              ) : searching ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Buscando…</p>
              ) : totalResults === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Nenhum resultado para “{q}”.</p>
              ) : (
                <div className="divide-y divide-border">
                  {groups.map(([key, items]) =>
                    items.length === 0 ? null : (
                      <div key={key} className="p-2">
                        <p className="px-2 py-1 text-2xs uppercase tracking-wider text-muted-foreground">{key}</p>
                        <ul>
                          {items.map((it) => (
                            <li key={`${key}-${it.id}`}>
                              <button
                                className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left text-sm hover:bg-secondary/60"
                                onClick={() => {
                                  setSearchOpen(false);
                                  setQ("");
                                  navigate({ to: it.href });
                                }}
                              >
                                <div className="min-w-0">
                                  <p className="truncate font-medium">{it.label}</p>
                                  {it.sub && <p className="truncate text-xs text-muted-foreground">{it.sub}</p>}
                                </div>
                                <span className="text-xs text-primary">Abrir →</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="relative h-9 w-9">
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-2xs font-bold text-primary-foreground">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-medium">Notificações da plataforma</span>
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead} disabled={unread === 0}>
                <Check className="h-3.5 w-3.5" /> Marcar como lidas
              </Button>
            </div>
            <ScrollArea className="max-h-[28rem]">
              {notifications.length === 0 ? (
                <p className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação ainda.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => {
                    const isUnread = n.created_at > lastSeen;
                    const label = ACTION_LABELS[n.action] ?? `${n.entity} · ${n.action}`;
                    return (
                      <li key={n.id} className={cn("px-3 py-2", isUnread && "bg-secondary/40")}>
                        <button
                          onClick={() => handleNotificationClick(n)}
                          className="block w-full text-left"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium leading-tight">{label}</p>
                            {n.status && <Badge variant="outline" className="text-2xs">{n.status}</Badge>}
                          </div>
                          <div className="mt-1 grid grid-cols-2 gap-x-2 text-2xs text-muted-foreground">
                            <span className="truncate"><span className="text-foreground/70">Empresa:</span> {n.empresa}</span>
                            <span className="truncate"><span className="text-foreground/70">Cliente:</span> {n.cliente}</span>
                            <span className="col-span-2"><span className="text-foreground/70">Tipo:</span> {n.entity}{n.tipo ? ` · ${n.tipo}` : ""}</span>
                          </div>
                          <p className="mt-1 text-2xs text-muted-foreground">
                            {new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </p>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  );
}