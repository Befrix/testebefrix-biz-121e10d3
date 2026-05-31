import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { GlowOrb } from "@/components/ui/glow-orb";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/planos")({
  head: () => ({
    meta: [
      { title: "Planos — BEFRIX" },
      { name: "description", content: "Planos flexíveis para times de receita de todos os tamanhos. Comece grátis." },
    ],
  }),
  component: PlanosPage,
});

const plans = [
  {
    name: "Starter",
    price: "R$ 497",
    period: "/mês",
    desc: "Para times pequenos começando com outbound automatizado.",
    features: [
      "Até 1.000 leads ativos",
      "2 usuários",
      "IA SDR (5k mensagens/mês)",
      "Sequências multi-canal",
      "Suporte por e-mail",
    ],
    cta: "Começar grátis",
    highlight: false,
  },
  {
    name: "Business",
    price: "R$ 1.497",
    period: "/mês",
    desc: "Para times de receita escalando pipeline com IA.",
    features: [
      "Até 10.000 leads ativos",
      "10 usuários",
      "IA SDR ilimitada",
      "Lead scoring preditivo",
      "Integrações CRM",
      "Suporte prioritário",
    ],
    cta: "Quero ser cliente",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "Para grandes operações de receita com SLA dedicado.",
    features: [
      "Leads ilimitados",
      "Usuários ilimitados",
      "SSO + SCIM",
      "API + Webhooks",
      "CSM dedicado",
      "SLA 99.9%",
    ],
    cta: "Falar com vendas",
    highlight: false,
  },
];

function PlanosPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />

      <section className="relative pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
        <GlowOrb className="-top-40 left-1/2 -translate-x-1/2" variant="primary" size="xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <Badge variant="outline" className="glass mb-6 gap-1.5 border-border-glow px-3 py-1 text-xs">
            <Sparkles className="h-3 w-3 text-accent" /> Planos
          </Badge>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-6xl">
            Escale na <span className="text-gradient-primary">velocidade que precisar</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-muted-foreground md:text-lg">
            Planos transparentes. Sem fidelidade. Cancele quando quiser.
          </p>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {plans.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "relative rounded-2xl p-8 text-left transition-all",
                  p.highlight
                    ? "glass-strong border-2 border-primary/60 shadow-glow-primary"
                    : "glass border border-border hover:border-border-glow",
                )}
              >
                {p.highlight && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
                    Mais popular
                  </Badge>
                )}
                <h3 className="text-lg font-semibold">{p.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold tracking-tight">{p.price}</span>
                  <span className="text-sm text-muted-foreground">{p.period}</span>
                </div>
                <Button
                  asChild
                  className={cn(
                    "mt-6 w-full",
                    p.highlight
                      ? "bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90"
                      : "",
                  )}
                  variant={p.highlight ? "default" : "outline"}
                >
                  <Link to="/register">{p.cta}</Link>
                </Button>
                <ul className="mt-8 space-y-3">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}