import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type Result = { id: string; label: string; sub?: string; to: string };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const term = q.trim();

  const { data, isFetching } = useQuery({
    queryKey: ["global-search", term, user?.id],
    enabled: open && term.length >= 2,
    queryFn: async () => {
      // PostgREST .or() does not allow commas inside values without escaping.
      const safe = term.replace(/[,()*%]/g, " ").trim();
      const like = `%${safe}%`;
      const [leads, empresas, camp, seq, autom, wf, evt, inv, integ, plans, profs, feedback] = await Promise.all([
        supabase
          .from("leads")
          .select("id, full_name, email, company")
          .or(`full_name.ilike.${like},email.ilike.${like},company.ilike.${like}`)
          .limit(8),
        supabase
          .from("empresas")
          .select("id, company_name, nome_fantasia, cnpj")
          .or(`company_name.ilike.${like},nome_fantasia.ilike.${like}`)
          .limit(6),
        supabase.from("campanhas").select("id, name, channel").ilike("name", like).limit(6),
        supabase.from("sequencias").select("id, name").ilike("name", like).limit(6),
        supabase.from("automacoes").select("id, name").ilike("name", like).limit(6),
        supabase.from("workflows").select("id, name").ilike("name", like).limit(6),
        supabase.from("eventos_uploads").select("id, filename").ilike("filename", like).limit(6),
        supabase.from("invoices").select("id, status, amount_cents").ilike("status", like).limit(6),
        supabase.from("integrations").select("id, provider").ilike("provider", like).limit(6),
        supabase.from("planos").select("id, name, tier").or(`name.ilike.${like},tier.ilike.${like}`).limit(6),
        supabase
          .from("profiles")
          .select("id, full_name, email")
          .or(`full_name.ilike.${like},email.ilike.${like}`)
          .limit(6),
        supabase
          .from("meeting_feedback")
          .select("id, meeting_status, notes")
          .ilike("notes", like)
          .limit(6),
      ]);
      return {
        leads: (leads.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null; company: string | null }>,
        empresas: (empresas.data ?? []) as Array<{ id: string; company_name: string | null; nome_fantasia: string | null; cnpj: string | null }>,
        campanhas: (camp.data ?? []) as Array<{ id: string; name: string; channel: string | null }>,
        sequencias: (seq.data ?? []) as Array<{ id: string; name: string }>,
        automacoes: (autom.data ?? []) as Array<{ id: string; name: string }>,
        workflows: (wf.data ?? []) as Array<{ id: string; name: string }>,
        eventos: (evt.data ?? []) as Array<{ id: string; filename: string }>,
        invoices: (inv.data ?? []) as Array<{ id: string; status: string; amount_cents: number | null }>,
        integracoes: (integ.data ?? []) as Array<{ id: string; provider: string }>,
        planos: (plans.data ?? []) as Array<{ id: string; name: string; tier: string }>,
        usuarios: (profs.data ?? []) as Array<{ id: string; full_name: string | null; email: string | null }>,
        reunioes: (feedback.data ?? []) as Array<{ id: string; meeting_status: string; notes: string | null }>,
      };
    },
  });

  const groups = useMemo(() => {
    if (!data) return [] as Array<{ key: string; title: string; items: Result[] }>;
    return [
      {
        key: "leads",
        title: "Leads",
        items: data.leads.map((l) => ({
          id: l.id,
          label: l.full_name || l.email || "Lead sem nome",
          sub: [l.company, l.email].filter(Boolean).join(" · "),
          to: "/dashboard/leads",
        })),
      },
      {
        key: "empresas",
        title: "Empresas",
        items: data.empresas.map((e) => ({
          id: e.id,
          label: e.nome_fantasia || e.company_name || "Empresa",
          sub: e.cnpj ?? undefined,
          to: "/dashboard/empresa",
        })),
      },
      {
        key: "campanhas",
        title: "Campanhas",
        items: data.campanhas.map((c) => ({ id: c.id, label: c.name, sub: c.channel ?? undefined, to: "/dashboard/campanhas" })),
      },
      {
        key: "sequencias",
        title: "Sequências",
        items: data.sequencias.map((s) => ({ id: s.id, label: s.name, sub: undefined as string | undefined, to: "/dashboard/sequencias" })),
      },
      {
        key: "automacoes",
        title: "Automações",
        items: data.automacoes.map((a) => ({ id: a.id, label: a.name, sub: undefined as string | undefined, to: "/dashboard/automacoes" })),
      },
      {
        key: "workflows",
        title: "Workflows",
        items: data.workflows.map((w) => ({ id: w.id, label: w.name, sub: undefined as string | undefined, to: "/dashboard/automations" })),
      },
      {
        key: "eventos",
        title: "Eventos",
        items: data.eventos.map((e) => ({ id: e.id, label: e.filename, sub: undefined as string | undefined, to: "/dashboard/uploads" })),
      },
      {
        key: "reunioes",
        title: "Reuniões",
        items: data.reunioes.map((r) => ({ id: r.id, label: r.notes ?? "Reunião", sub: r.meeting_status, to: "/dashboard/inbox" })),
      },
      {
        key: "invoices",
        title: "Pagamentos",
        items: data.invoices.map((i) => ({
          id: i.id,
          label: `Fatura ${i.status}`,
          sub: i.amount_cents != null ? `R$ ${(i.amount_cents / 100).toFixed(2)}` : undefined,
          to: "/dashboard/pagamentos",
        })),
      },
      {
        key: "integracoes",
        title: "Integrações",
        items: data.integracoes.map((i) => ({ id: i.id, label: i.provider, sub: undefined as string | undefined, to: "/dashboard/integracoes" })),
      },
      {
        key: "planos",
        title: "Planos",
        items: data.planos.map((p) => ({ id: p.id, label: p.name, sub: p.tier, to: "/dashboard/pagamentos" })),
      },
      {
        key: "usuarios",
        title: "Usuários",
        items: data.usuarios.map((u) => ({
          id: u.id,
          label: u.full_name || u.email || "Usuário",
          sub: u.email ?? undefined,
          to: "/dashboard/empresa",
        })),
      },
    ].filter((g) => g.items.length > 0);
  }, [data]);

  const go = (to: string) => {
    setOpen(false);
    navigate({ to });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="h-9 w-full max-w-sm justify-between gap-2 text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <span className="flex items-center gap-2">
          <Search className="h-4 w-4" /> Buscar na BEFRIX…
        </span>
        <kbd className="hidden rounded border border-border bg-secondary px-1.5 py-0.5 text-2xs font-medium md:inline">⌘K</kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Buscar leads, campanhas, sequências, automações, eventos…" value={q} onValueChange={setQ} />
        <CommandList>
          {term.length < 2 ? (
            <CommandEmpty>Digite ao menos 2 caracteres.</CommandEmpty>
          ) : isFetching ? (
            <CommandEmpty>Buscando…</CommandEmpty>
          ) : groups.length === 0 ? (
            <CommandEmpty>Não encontramos resultados para sua pesquisa.</CommandEmpty>
          ) : (
            groups.map((g, i) => (
              <div key={g.key}>
                {i > 0 && <CommandSeparator />}
                <CommandGroup heading={g.title}>
                  {g.items.map((it) => (
                    <CommandItem key={`${g.key}-${it.id}`} value={`${g.key}-${it.id}-${it.label}`} onSelect={() => go(it.to)}>
                      <div className="flex flex-col">
                        <span className="text-sm">{it.label}</span>
                        {it.sub && <span className="text-xs text-muted-foreground">{it.sub}</span>}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ))
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}