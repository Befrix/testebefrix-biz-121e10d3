import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

const LS_KEY = "befrix.notifications.lastSeen";

const ACTION_LABELS: Record<string, string> = {
  "subscription.upgrade_requested": "Solicitação de upgrade de plano",
  "subscription.downgrade_requested": "Solicitação de downgrade",
  "subscription.cancel_requested": "Cancelamento solicitado",
  "lead.created": "Novo lead capturado",
  "lead.updated": "Lead atualizado",
  "eventos_uploads.created": "Novo upload de eventos",
  "automation.executed": "Automação executada",
  "campanha.created": "Campanha criada",
};

function labelFor(action: string, entity: string) {
  return ACTION_LABELS[action] ?? `${entity} · ${action}`;
}

export function NotificationsBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LS_KEY) ?? new Date(0).toISOString();
  });

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("audit_logs")
        .select("id, action, entity, entity_id, created_at, metadata")
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as Array<{
        id: string;
        action: string;
        entity: string;
        entity_id: string | null;
        created_at: string;
        metadata: Record<string, unknown> | null;
      }>;
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel("notifications-audit")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["notifications"] });
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const unread = useMemo(() => (data ?? []).filter((n) => n.created_at > lastSeen).length, [data, lastSeen]);

  const markAllRead = () => {
    const now = new Date().toISOString();
    localStorage.setItem(LS_KEY, now);
    setLastSeen(now);
  };

  return (
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
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-medium">Notificações</span>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={markAllRead} disabled={unread === 0}>
            <Check className="h-3.5 w-3.5" /> Marcar como lidas
          </Button>
        </div>
        <ScrollArea className="max-h-80">
          {!data || data.length === 0 ? (
            <p className="p-6 text-center text-xs text-muted-foreground">Nenhuma notificação ainda.</p>
          ) : (
            <ul className="divide-y divide-border">
              {data.map((n) => {
                const isUnread = n.created_at > lastSeen;
                return (
                  <li key={n.id} className={cn("px-3 py-2 text-sm", isUnread && "bg-secondary/40")}>
                    <p className="font-medium leading-tight">{labelFor(n.action, n.entity)}</p>
                    <p className="mt-0.5 text-2xs text-muted-foreground">
                      {new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}