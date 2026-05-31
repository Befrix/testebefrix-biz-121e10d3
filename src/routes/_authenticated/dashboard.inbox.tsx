import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2, Inbox, Mail, MessageCircle, Linkedin, Send } from "lucide-react";
import { PageHeader, StatusPill, EmptyState } from "@/components/dashboard/primitives";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useWorkspaceData, type Lead, type OutreachLog } from "@/hooks/use-workspace-data";
import { PIPELINE_STAGES } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard/inbox")({
  component: InboxPage,
});

const CHANNEL_ICON: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
};

type Conversation = {
  lead: Lead | null;
  leadId: string;
  messages: OutreachLog[];
  lastAt: string;
  channels: string[];
};

function InboxPage() {
  const { data, isLoading } = useWorkspaceData();
  const [activeId, setActiveId] = useState<string | null>(null);

  const conversations = useMemo<Conversation[]>(() => {
    if (!data) return [];
    const byLead = new Map<string, OutreachLog[]>();
    data.outreach.forEach((o) => {
      const key = o.lead_id ?? "sem-lead";
      if (!byLead.has(key)) byLead.set(key, []);
      byLead.get(key)!.push(o);
    });
    return Array.from(byLead.entries())
      .map(([leadId, messages]) => {
        const sorted = [...messages].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        return {
          leadId,
          lead: data.leads.find((l) => l.id === leadId) ?? null,
          messages: sorted,
          lastAt: sorted[sorted.length - 1]?.created_at ?? "",
          channels: Array.from(new Set(messages.map((m) => m.channel))),
        };
      })
      .sort((a, b) => +new Date(b.lastAt) - +new Date(a.lastAt));
  }, [data]);

  const active = conversations.find((c) => c.leadId === activeId) ?? conversations[0] ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inbox"
        description="Central omnichannel — e-mail, WhatsApp e LinkedIn em um só lugar."
        icon={Inbox}
        action={
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <StatusPill label="E-mail" tone="info" />
            <StatusPill label="WhatsApp" tone="success" />
            <StatusPill label="LinkedIn" tone="primary" />
          </div>
        }
      />

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : conversations.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Inbox vazia"
          description="As conversas das suas campanhas aparecerão aqui, unificadas por canal."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
          {/* Conversation list */}
          <div className="rounded-2xl glass p-2">
            <div className="max-h-[70vh] overflow-y-auto">
              {conversations.map((c) => {
                const isActive = active?.leadId === c.leadId;
                return (
                  <button
                    key={c.leadId}
                    onClick={() => setActiveId(c.leadId)}
                    className={cn(
                      "flex w-full flex-col gap-1 rounded-xl px-3 py-3 text-left transition-colors",
                      isActive ? "bg-secondary" : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium">{c.lead?.full_name ?? "Lead sem nome"}</span>
                      <div className="flex gap-1">
                        {c.channels.map((ch) => {
                          const Icon = CHANNEL_ICON[ch] ?? Mail;
                          return <Icon key={ch} className="h-3.5 w-3.5 text-muted-foreground" />;
                        })}
                      </div>
                    </div>
                    <span className="truncate text-xs text-muted-foreground">
                      {c.messages[c.messages.length - 1]?.content ?? c.lead?.company ?? "Sem mensagens"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Thread */}
          <div className="flex min-h-[60vh] flex-col rounded-2xl glass">
            {active ? (
              <>
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                  <div>
                    <p className="font-medium">{active.lead?.full_name ?? "Lead sem nome"}</p>
                    <p className="text-xs text-muted-foreground">{active.lead?.company ?? "—"}</p>
                  </div>
                  {active.lead && (
                    <StatusPill
                      label={PIPELINE_STAGES.find((s) => s.leadStatus === active.lead!.status)?.label ?? active.lead.status}
                      tone="info"
                    />
                  )}
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  {active.messages.map((m) => {
                    const inbound = m.direction === "inbound";
                    const Icon = CHANNEL_ICON[m.channel] ?? Mail;
                    return (
                      <div key={m.id} className={cn("flex", inbound ? "justify-start" : "justify-end")}>
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm",
                            inbound ? "bg-secondary" : "bg-gradient-to-br from-primary to-accent text-primary-foreground"
                          )}
                        >
                          <div className="mb-1 flex items-center gap-1.5 text-2xs opacity-80">
                            <Icon className="h-3 w-3" />
                            {m.channel} · {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                          </div>
                          {m.content ?? <span className="opacity-70">[sem conteúdo]</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 border-t border-border-subtle p-4">
                  <Input placeholder="Responder (em breve)…" disabled />
                  <Button disabled className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
                Selecione uma conversa
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
