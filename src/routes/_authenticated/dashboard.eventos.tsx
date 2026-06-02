import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Loader2,
  CalendarDays,
  Plus,
  Upload,
  Users,
  Building2,
  Sparkles,
  Megaphone,
  Trash2,
  FileSpreadsheet,
  Activity,
} from "lucide-react";
import { PageHeader, SectionCard, EmptyState, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatNumber, formatPercent } from "@/lib/dashboard";
import {
  createEventWithParticipants,
  deleteEvent,
  getEventDashboard,
  listEvents,
} from "@/lib/eventos.functions";
import { parseParticipantFile, type ParticipantRow } from "@/lib/event-parser";
import { usePlan } from "@/hooks/use-plan";
import { FeatureGate } from "@/components/plan/feature-gate";

export const Route = createFileRoute("/_authenticated/dashboard/eventos")({
  component: EventosPage,
});

type EventRow = {
  id: string;
  filename: string;
  status: string;
  rows_count: number;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

function EventosPage() {
  const plan = usePlan();
  return (
    <div className="space-y-8">
      <PageHeader
        title="Eventos"
        description="Importe participantes de feiras, congressos e meetups. Os leads são enriquecidos automaticamente."
        icon={CalendarDays}
      />
      <FeatureGate
        flag="eventos"
        title="Eventos disponíveis no plano Pro"
        description={plan.plan?.features.cta_upgrade ?? "Faça upgrade para importar participantes de eventos."}
      >
        <EventosContent />
      </FeatureGate>
    </div>
  );
}

function EventosContent() {
  const list = useServerFn(listEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: () => list(),
  });
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const events = (data?.events ?? []) as EventRow[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {formatNumber(events.length)} {events.length === 1 ? "evento" : "eventos"} cadastrados
        </p>
        <Button onClick={() => setOpenCreate(true)} className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary">
          <Plus className="h-4 w-4" /> Novo Evento
        </Button>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-32">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Nenhum evento cadastrado"
          description="Crie seu primeiro evento e importe a lista de participantes (CSV ou XLSX)."
          action={
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="h-4 w-4" /> Criar evento
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <EventCard key={e.id} event={e} onOpen={() => setSelectedId(e.id)} />
          ))}
        </div>
      )}

      <CreateEventDialog open={openCreate} onOpenChange={setOpenCreate} />
      <EventDetailDrawer
        eventId={selectedId}
        open={!!selectedId}
        onOpenChange={(v) => !v && setSelectedId(null)}
      />
    </div>
  );
}

function EventCard({ event, onOpen }: { event: EventRow; onOpen: () => void }) {
  const meta = (event.metadata ?? {}) as Record<string, unknown>;
  const tone =
    event.status === "completed" ? "success" : event.status === "failed" ? "destructive" : "warning";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="text-left rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-glow-soft"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{(meta.event_name as string) ?? event.filename}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {(meta.event_date as string) ?? new Date(event.created_at).toLocaleDateString("pt-BR")}
            {meta.city ? ` · ${meta.city}` : ""}
          </p>
        </div>
        <StatusPill label={event.status} tone={tone} />
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {formatNumber(event.rows_count)} participantes
        </span>
        {meta.organizer ? (
          <span className="truncate">org. {meta.organizer as string}</span>
        ) : null}
      </div>
      {meta.segment ? (
        <div className="mt-3">
          <StatusPill label={meta.segment as string} tone="primary" />
        </div>
      ) : null}
    </button>
  );
}

function CreateEventDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const create = useServerFn(createEventWithParticipants);
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [city, setCity] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [segment, setSegment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParticipantRow[] | null>(null);
  const [parsing, setParsing] = useState(false);

  const reset = () => {
    setEventName("");
    setEventDate("");
    setCity("");
    setOrganizer("");
    setSegment("");
    setFile(null);
    setParsed(null);
  };

  const handleFile = async (f: File | null) => {
    setFile(f);
    setParsed(null);
    if (!f) return;
    setParsing(true);
    try {
      const rows = await parseParticipantFile(f);
      if (rows.length === 0) throw new Error("Nenhum participante reconhecido.");
      setParsed(rows);
      toast.success(`${rows.length} participantes detectados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ler arquivo");
      setFile(null);
    } finally {
      setParsing(false);
    }
  };

  const mut = useMutation({
    mutationFn: () => {
      if (!parsed || !file) throw new Error("Selecione um arquivo válido");
      return create({
        data: {
          event_name: eventName.trim(),
          event_date: eventDate,
          city: city.trim() || null,
          organizer: organizer.trim() || null,
          segment: segment.trim() || null,
          filename: file.name,
          participants: parsed,
        },
      });
    },
    onSuccess: (r) => {
      toast.success(`Evento criado · ${r.leads_created} leads importados`);
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["workspace-data"] });
      reset();
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  const canSubmit = eventName.trim() && eventDate && parsed && parsed.length > 0 && !mut.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-2xl glass-strong">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary-glow" /> Novo evento
          </DialogTitle>
          <DialogDescription>
            Cadastre o evento e faça upload da lista de participantes (CSV ou XLSX). Os leads serão criados e enviados para enriquecimento via N8N.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className="mb-1.5 block text-xs">Nome do evento *</Label>
            <Input value={eventName} onChange={(e) => setEventName(e.target.value)} placeholder="Ex: Web Summit Rio 2026" maxLength={200} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Data *</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Cidade</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Rio de Janeiro" maxLength={120} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Organizador</Label>
            <Input value={organizer} onChange={(e) => setOrganizer(e.target.value)} placeholder="Web Summit" maxLength={200} />
          </div>
          <div>
            <Label className="mb-1.5 block text-xs">Segmento</Label>
            <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="Tech / SaaS" maxLength={120} />
          </div>

          <div className="sm:col-span-2 space-y-2">
            <Label className="block text-xs">Lista de participantes (CSV ou XLSX) *</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-sm hover:bg-secondary/50">
              <Upload className="h-4 w-4 text-primary-glow" />
              <span>
                {file ? file.name : "Clique para selecionar arquivo"}
              </span>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {parsing && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Lendo arquivo…
              </p>
            )}
            {parsed && (
              <p className="text-xs text-success">
                {parsed.length} participantes prontos para importar
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Cabeçalhos reconhecidos: Nome, Email, Empresa, Cargo, Telefone, Segmento, Cidade, LinkedIn.
            </p>
          </div>
        </div>

        <Button
          disabled={!canSubmit}
          onClick={() => mut.mutate()}
          className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary"
        >
          {mut.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Importando…
            </>
          ) : (
            <>
              <FileSpreadsheet className="h-4 w-4" /> Criar evento e importar
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function EventDetailDrawer({
  eventId,
  open,
  onOpenChange,
}: {
  eventId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const get = useServerFn(getEventDashboard);
  const del = useServerFn(deleteEvent);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["event-dashboard", eventId],
    enabled: !!eventId && open,
    queryFn: () => get({ data: { id: eventId! } }),
  });

  const removeMut = useMutation({
    mutationFn: () => del({ data: { id: eventId! } }),
    onSuccess: () => {
      toast.success("Evento removido");
      qc.invalidateQueries({ queryKey: ["events"] });
      onOpenChange(false);
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Erro"),
  });

  if (!eventId) return null;
  const meta = (data?.event?.metadata ?? {}) as Record<string, unknown>;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        {isLoading || !data ? (
          <div className="grid place-items-center py-32">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-xl">{(meta.event_name as string) ?? data.event.filename}</SheetTitle>
              <SheetDescription className="flex flex-wrap items-center gap-2">
                <StatusPill label={data.event.status} tone={data.event.status === "completed" ? "success" : "warning"} />
                {meta.event_date ? <span className="text-xs">{meta.event_date as string}</span> : null}
                {meta.city ? <span className="text-xs">· {meta.city as string}</span> : null}
                {meta.organizer ? <span className="text-xs">· {meta.organizer as string}</span> : null}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              <StatTile icon={Users} label="Participantes" value={formatNumber(data.stats.participants)} />
              <StatTile icon={Building2} label="Empresas" value={formatNumber(data.stats.companies)} />
              <StatTile icon={Sparkles} label="Leads" value={formatNumber(data.stats.leads_created)} />
              <StatTile icon={Activity} label="Enriquec." value={formatPercent(data.stats.enrichment_rate)} />
              <StatTile icon={Megaphone} label="Campanhas" value={formatNumber(data.stats.campaigns)} />
            </div>

            <SectionCard title="Leads importados" className="mt-6 p-0">
              <div className="max-h-80 overflow-auto">
                {data.leads.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhum lead vinculado.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Empresa</TableHead>
                        <TableHead>Cargo</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.leads.slice(0, 100).map((l) => (
                        <TableRow key={l.id}>
                          <TableCell className="text-sm font-medium">{l.full_name ?? "—"}</TableCell>
                          <TableCell className="text-sm">{l.company ?? "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{l.job_title ?? "—"}</TableCell>
                          <TableCell className="text-right font-mono text-sm">{l.score}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </SectionCard>

            <SectionCard title="Campanhas geradas" className="mt-4">
              {data.campaigns.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma campanha vinculada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {data.campaigns.map((c) => (
                    <div key={c.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">canal: {c.channel}</p>
                      </div>
                      <StatusPill label={c.status} tone="primary" />
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <div className="mt-6 flex justify-end">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-4 w-4" /> Excluir evento
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir evento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      O registro do evento será removido. Os leads importados permanecerão na base.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={removeMut.isPending}
                      onClick={() => removeMut.mutate()}
                    >
                      Excluir
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-secondary/30 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary-glow" />
        <span>{label}</span>
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
