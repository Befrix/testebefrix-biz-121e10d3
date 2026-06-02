import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Building2,
  Mail,
  Phone,
  Linkedin,
  CalendarDays,
  Megaphone,
  MessageSquare,
  Sparkles,
  MapPin,
  Briefcase,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { StatusPill } from "@/components/dashboard/primitives";
import { supabase } from "@/integrations/supabase/client";
import { PIPELINE_STAGES } from "@/lib/dashboard";
import type { Lead } from "@/hooks/use-workspace-data";

function fmt(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd MMM yyyy 'às' HH:mm", { locale: ptBR });
  } catch {
    return "—";
  }
}

export function LeadDetailDrawer({
  lead,
  open,
  onOpenChange,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const leadId = lead?.id;

  const { data: related } = useQuery({
    queryKey: ["lead-related", leadId],
    enabled: !!leadId && open,
    queryFn: async () => {
      const [outreachRes, eventosRes, feedbackRes] = await Promise.all([
        supabase
          .from("outreach_logs")
          .select("id, channel, direction, status, content, created_at, campanha_id")
          .eq("lead_id", leadId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("leads_eventos")
          .select("id, event_type, occurred_at, payload, upload_id")
          .eq("lead_id", leadId!)
          .order("occurred_at", { ascending: false }),
        supabase
          .from("meeting_feedback")
          .select("id, meeting_status, deal_status, deal_value_cents, feedback_date, notes")
          .eq("lead_id", leadId!)
          .order("feedback_date", { ascending: false }),
      ]);
      const outreach = outreachRes.data ?? [];
      const eventos = eventosRes.data ?? [];
      const feedback = feedbackRes.data ?? [];
      const campanhaIds = Array.from(
        new Set(outreach.map((o) => o.campanha_id).filter(Boolean))
      ) as string[];
      let campanhas: { id: string; name: string; channel: string; status: string }[] = [];
      if (campanhaIds.length > 0) {
        const { data } = await supabase
          .from("campanhas")
          .select("id, name, channel, status")
          .in("id", campanhaIds);
        campanhas = data ?? [];
      }
      return { outreach, eventos, feedback, campanhas };
    },
  });

  if (!lead) return null;
  const stage = PIPELINE_STAGES.find((s) => s.leadStatus === lead.status);
  const meta = lead.metadata ?? {};
  const source = (meta as Record<string, unknown>).source as string | undefined;
  const assignedName = (meta as Record<string, unknown>).assigned_name as string | undefined;
  const aiReason = (meta as Record<string, unknown>).ai_reason as string | undefined;
  const aiBestChannel = (meta as Record<string, unknown>).ai_best_channel as string | undefined;

  type TimelineItem = { id: string; ts: string; type: string; label: string; tone: string };
  const timeline: TimelineItem[] = [
    {
      id: `created-${lead.id}`,
      ts: lead.created_at,
      type: "created",
      label: "Lead capturado",
      tone: "primary",
    },
    ...(related?.outreach ?? []).map((o) => ({
      id: `o-${o.id}`,
      ts: o.created_at,
      type: "outreach",
      label: `${o.direction === "outbound" ? "Envio" : "Resposta"} via ${o.channel}`,
      tone: o.direction === "outbound" ? "info" : "success",
    })),
    ...(related?.eventos ?? []).map((e) => ({
      id: `e-${e.id}`,
      ts: e.occurred_at,
      type: "evento",
      label: e.event_type,
      tone: "warning",
    })),
    ...(related?.feedback ?? []).map((f) => ({
      id: `f-${f.id}`,
      ts: f.feedback_date,
      type: "feedback",
      label: `Reunião ${f.meeting_status}${f.deal_status ? ` · ${f.deal_status}` : ""}`,
      tone: f.deal_status === "won" ? "success" : "muted",
    })),
  ].sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader className="space-y-2">
          <SheetTitle className="text-xl">{lead.full_name ?? "Lead sem nome"}</SheetTitle>
          <SheetDescription className="flex flex-wrap items-center gap-2">
            <StatusPill label={stage?.label ?? lead.status} tone="info" />
            {lead.segment && <StatusPill label={lead.segment} tone="primary" />}
            <span className="text-xs text-muted-foreground">score {lead.score}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-sm">
          <Row icon={Building2} label="Empresa" value={lead.company} />
          <Row icon={Briefcase} label="Cargo" value={lead.job_title} />
          <Row icon={Mail} label="E-mail" value={lead.email} />
          <Row icon={Phone} label="Telefone" value={lead.phone} />
          <Row icon={Linkedin} label="LinkedIn" value={lead.linkedin_url} link />
          <Row icon={MapPin} label="Região" value={lead.region} />
          <Row icon={Sparkles} label="Origem" value={source ?? "manual"} />
          <Row icon={Sparkles} label="Responsável" value={assignedName ?? "—"} />
        </div>

        {(aiReason || aiBestChannel) && (
          <div className="mt-3 rounded-xl border border-primary/25 bg-primary/5 p-3 text-xs">
            <p className="mb-1 flex items-center gap-1 font-medium text-primary-glow">
              <Sparkles className="h-3.5 w-3.5" /> IA Score
            </p>
            {aiReason && <p className="text-muted-foreground">{aiReason}</p>}
            {aiBestChannel && (
              <p className="mt-1 text-muted-foreground">
                Melhor canal sugerido: <span className="font-medium">{aiBestChannel}</span>
              </p>
            )}
          </div>
        )}

        <Tabs defaultValue="timeline" className="mt-5">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="interactions">Interações</TabsTrigger>
            <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
            <TabsTrigger value="events">Eventos</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-4 space-y-3">
            {timeline.length === 0 ? (
              <Empty label="Sem atividade ainda." />
            ) : (
              timeline.map((t) => (
                <div key={t.id} className="flex gap-3 rounded-lg border border-border bg-card p-3">
                  <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-muted-foreground">{fmt(t.ts)}</p>
                  </div>
                  <StatusPill label={t.type} tone={t.tone} />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="interactions" className="mt-4 space-y-3">
            {(related?.outreach.length ?? 0) === 0 ? (
              <Empty label="Nenhuma interação registrada." />
            ) : (
              related!.outreach.map((o) => (
                <div key={o.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {o.channel} · {o.direction}
                    </span>
                    <span>{fmt(o.created_at)}</span>
                  </div>
                  {o.content && (
                    <p className="mt-2 line-clamp-3 text-sm text-foreground/90">{o.content}</p>
                  )}
                  <StatusPill label={o.status} tone="info" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="campaigns" className="mt-4 space-y-3">
            {(related?.campanhas.length ?? 0) === 0 ? (
              <Empty label="Lead não está em nenhuma campanha." />
            ) : (
              related!.campanhas.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Megaphone className="h-3.5 w-3.5 text-primary-glow" /> {c.name}
                    </p>
                    <p className="text-xs text-muted-foreground">canal: {c.channel}</p>
                  </div>
                  <StatusPill label={c.status} tone="primary" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="events" className="mt-4 space-y-3">
            {(related?.eventos.length ?? 0) === 0 ? (
              <Empty label="Nenhum evento vinculado." />
            ) : (
              related!.eventos.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium flex items-center gap-1">
                      <CalendarDays className="h-3.5 w-3.5 text-primary-glow" /> {e.event_type}
                    </p>
                    <span className="text-xs text-muted-foreground">{fmt(e.occurred_at)}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  link,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  link?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <span className="w-20 text-muted-foreground">{label}</span>
      {link && value ? (
        <a href={value} target="_blank" rel="noreferrer" className="truncate text-primary-glow hover:underline">
          {value}
        </a>
      ) : (
        <span className="truncate">{value || "—"}</span>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
      {label}
    </div>
  );
}