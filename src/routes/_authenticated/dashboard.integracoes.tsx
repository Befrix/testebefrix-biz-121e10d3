import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Plug, Mail, MessageCircle, Linkedin, Calendar } from "lucide-react";
import { PageHeader, SectionCard, StatusPill } from "@/components/dashboard/primitives";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/dashboard/integracoes")({
  component: IntegracoesPage,
});

const CATALOG = [
  { provider: "email", label: "E-mail (SMTP)", icon: Mail, desc: "Disparo e tracking de e-mails outbound." },
  { provider: "whatsapp", label: "WhatsApp", icon: MessageCircle, desc: "Mensagens e respostas via WhatsApp." },
  { provider: "linkedin", label: "LinkedIn", icon: Linkedin, desc: "Prospecção e conexões automatizadas." },
  { provider: "calendar", label: "Calendário", icon: Calendar, desc: "Agendamento de reuniões e slots." },
];

function IntegracoesPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["integracoes", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("integrations").select("*");
      return (data ?? []) as Array<{ provider: string; enabled: boolean }>;
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Integrações" description="Conecte suas ferramentas para que a BEFRIX possa centralizar informações e acompanhar sua operação de forma mais completa." icon={Plug} />
      <div className="grid gap-4 md:grid-cols-2">
        {CATALOG.map((c) => {
          const conn = data?.find((d) => d.provider === c.provider);
          const enabled = conn?.enabled ?? false;
          return (
            <SectionCard key={c.provider}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary"><c.icon className="h-5 w-5 text-primary-glow" /></div>
                  <div>
                    <p className="font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                </div>
                <StatusPill label={enabled ? "Conectado" : "Desconectado"} tone={enabled ? "success" : "muted"} />
              </div>
              <Button variant="outline" size="sm" className="mt-4 w-full">{enabled ? "Gerenciar" : "Conectar"}</Button>
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
}
