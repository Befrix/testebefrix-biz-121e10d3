import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Calendar,
  ChartLine,
  Clock,
  LineChart,
  Mail,
  PlayCircle,
  Radar,
  Sparkles,
  Target,
  TrendingUp,
  UserPlus,
  Upload,
  Settings2,
  CreditCard,
  Workflow,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GlowOrb } from "@/components/ui/glow-orb";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { DashboardMockup } from "@/components/landing/dashboard-mockup";
import { AnimatedCounter } from "@/components/landing/animated-counter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BEFRIX — Automatize seu outbound com IA" },
      { name: "description", content: "Capte leads qualificados, personalize campanhas e aumente reuniões automaticamente com a plataforma de SDR automation da BEFRIX." },
      { property: "og:title", content: "BEFRIX — Automatize seu outbound com IA" },
      { property: "og:description", content: "Plataforma enterprise de outbound automation, IA preditiva e revenue intelligence." },
    ],
  }),
  component: Index,
});

const benefits = [
  { icon: Bot, title: "IA para prospecção", desc: "Agentes autônomos pesquisam, escrevem e fazem follow-up em escala." },
  { icon: Target, title: "Lead scoring", desc: "Pontuação preditiva que prioriza contas com maior probabilidade de fechamento." },
  { icon: Workflow, title: "Automação SDR", desc: "Sequências multi-canal em e-mail, LinkedIn e voz com lógica condicional." },
  { icon: ChartLine, title: "Analytics realtime", desc: "Dashboards de pipeline, conversão e forecast atualizados em tempo real." },
  { icon: Brain, title: "Inteligência preditiva", desc: "Modelos próprios que antecipam intenção de compra e churn." },
  { icon: Sparkles, title: "Copywriting com IA", desc: "Mensagens personalizadas por persona, indústria e estágio do funil." },
];

const intelligence = [
  { icon: Radar, title: "Análise comportamental", desc: "Tracking de engajamento e padrões de leitura em cada touchpoint." },
  { icon: TrendingUp, title: "Tendências de mercado", desc: "Sinais de intent agregados de milhares de fontes públicas." },
  { icon: Clock, title: "Melhor horário de contato", desc: "IA identifica a janela ideal de resposta por lead." },
  { icon: Target, title: "Segmentos de maior conversão", desc: "Clusters automáticos baseados em fit + intent." },
  { icon: LineChart, title: "Insights de IA", desc: "Recomendações acionáveis para SDRs e gestores em tempo real." },
];

const steps = [
  { icon: UserPlus, title: "Crie sua conta", desc: "Setup em menos de 2 minutos. Comece grátis." },
  { icon: Settings2, title: "Configure seu ICP", desc: "Defina persona, indústria e gatilhos de compra ideais." },
  { icon: CreditCard, title: "Escolha seu plano", desc: "Flexível e escalável conforme seu volume de prospecção." },
  { icon: Upload, title: "Importe eventos", desc: "Conecte CRM, calendário e fontes de dados em um clique." },
  { icon: Bot, title: "Automatize prospecção", desc: "Deixe nossos agentes IA gerar pipeline 24/7." },
];

const faqs = [
  { q: "Como a IA da BEFRIX gera leads qualificados?", a: "Nossos agentes combinam intent data, análise comportamental e modelos preditivos próprios para identificar contas in-market e iniciar conversas personalizadas automaticamente." },
  { q: "Posso integrar com meu CRM atual?", a: "Sim. Suportamos integrações nativas com Salesforce, HubSpot, Pipedrive, RD Station e via API/Zapier para qualquer outra ferramenta." },
  { q: "Quanto tempo leva para implementar?", a: "A maioria dos clientes está rodando campanhas em menos de 24 horas. Onboarding guiado + suporte dedicado em planos Business e Enterprise." },
  { q: "Os dados dos meus leads ficam seguros?", a: "100%. Somos LGPD/GDPR compliant, com criptografia em trânsito e repouso, SSO e controles de acesso granulares." },
  { q: "Como funciona a cobrança?", a: "Mensal ou anual, baseado em volume de leads ativos e usuários. Sem fidelidade — cancele quando quiser." },
];

const logos = ["Nordic SaaS", "Acme Inc", "Volt Labs", "Helix", "Northwind", "Lumen"];

const stats = [
  { value: 3.4, suffix: "x", label: "Mais reuniões" },
  { value: 62, suffix: "%", label: "Open rate médio" },
  { value: 1284, label: "Leads gerados/mês" },
  { value: 47, suffix: "%", label: "Aumento de pipeline" },
];

function Index() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Navbar />

      {/* HERO */}
      <section className="relative overflow-hidden pt-32 pb-24">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-70" />
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
        <GlowOrb className="-top-40 left-1/2 -translate-x-1/2" variant="primary" size="xl" />
        <GlowOrb className="top-1/2 -right-40" variant="accent" size="lg" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <Badge variant="outline" className="glass mb-6 gap-1.5 border-border-glow px-3 py-1 text-xs font-medium">
              <Sparkles className="h-3 w-3 text-accent" />
              IA · SDR Automation · Revenue Intelligence
            </Badge>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl text-balance text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl"
          >
            Automatize seu outbound{" "}
            <span className="text-gradient-primary">com IA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl"
          >
            Capte leads qualificados, personalize campanhas e aumente reuniões
            automaticamente — em escala enterprise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90">
              <Link to="/register">
                Quero ser cliente
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="glass border-border hover:bg-surface-elevated"
            >
              <a
                href={`https://wa.me/5511999999999?text=${encodeURIComponent("Olá, gostaria de agendar uma demonstração da BEFRIX.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <PlayCircle className="mr-1 h-4 w-4" />
                Agendar demonstração
              </a>
            </Button>
          </motion.div>

          <div className="mt-20 w-full">
            <DashboardMockup />
          </div>

          {/* Stats */}
          <div className="mt-20 grid w-full grid-cols-2 gap-6 border-y border-border-subtle py-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-semibold tracking-tight md:text-4xl">
                  <span className="text-gradient-primary">
                    <AnimatedCounter value={s.value} suffix={s.suffix} />
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground md:text-sm">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-10 w-full">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Times de receita que confiam na BEFRIX
            </p>
            <div className="mt-6 grid grid-cols-3 items-center gap-6 opacity-60 md:grid-cols-6">
              {logos.map((l) => (
                <div
                  key={l}
                  className="text-center text-sm font-semibold tracking-tight text-muted-foreground"
                >
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS */}
      <section id="recursos" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Benefícios"
            title="Tudo que seu time de receita precisa"
            subtitle="Uma plataforma única, integrada e inteligente para acelerar pipeline."
          />
          <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {benefits.map((b, i) => (
              <FeatureCard key={b.title} {...b} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* MARKET INTELLIGENCE */}
      <section id="inteligencia" className="relative py-28">
        <div className="pointer-events-none absolute inset-0 bg-mesh opacity-40" />
        <GlowOrb className="left-1/2 top-0 -translate-x-1/2" variant="accent" size="lg" />

        <div className="relative mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Market Intelligence"
            title="Inteligência de mercado em tempo real"
            subtitle="Insights preditivos que transformam dados em pipeline."
          />
          <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {intelligence.map((b, i) => (
              <FeatureCard key={b.title} {...b} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section id="automacao" className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHeading
            eyebrow="Como funciona"
            title="Do setup ao primeiro lead em minutos"
            subtitle="Cinco passos para colocar sua máquina de outbound no ar."
          />

          <div className="relative mt-16 grid grid-cols-1 gap-6 md:grid-cols-5">
            {/* connecting line */}
            <div className="pointer-events-none absolute left-0 right-0 top-7 hidden h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent md:block" />
            {steps.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow-primary">
                  <s.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <p className="mt-4 text-center text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Passo {i + 1}
                </p>
                <h3 className="mt-1 text-center text-base font-semibold">{s.title}</h3>
                <p className="mt-2 text-center text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative py-28">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHeading
            eyebrow="FAQ"
            title="Perguntas frequentes"
            subtitle="Tudo o que você precisa saber antes de começar."
          />
          <Accordion type="single" collapsible className="mt-12 w-full">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-border-subtle"
              >
                <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="relative py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl glass-strong border border-border-glow/40 p-12 md:p-20 text-center">
            <GlowOrb className="-top-40 left-1/2 -translate-x-1/2" variant="primary" size="lg" />
            <GlowOrb className="-bottom-40 right-0" variant="accent" size="md" />
            <div className="relative">
              <h2 className="mx-auto max-w-3xl text-balance text-4xl font-semibold tracking-tight md:text-6xl">
                Pronto para gerar mais oportunidades com{" "}
                <span className="text-gradient-primary">menos esforço</span>?
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-muted-foreground md:text-lg">
                Centralize prospecção, automação, inteligência comercial e acompanhamento de resultados em uma única plataforma.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">⚡ Implantação guiada</span>
                <span className="inline-flex items-center gap-1.5">🤖 Automação com IA</span>
                <span className="inline-flex items-center gap-1.5">📈 Escalabilidade para sua operação</span>
                <span className="inline-flex items-center gap-1.5">🔒 Dados centralizados e seguros</span>
              </div>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" className="bg-gradient-to-r from-primary to-accent text-primary-foreground shadow-glow-primary hover:opacity-90">
                  <Link to="/register">Quero ser cliente <ArrowRight className="ml-1 h-4 w-4" /></Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="glass border-border">
                  <Link to="/planos">Ver planos</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto max-w-2xl text-center"
    >
      <p className="text-xs font-mono uppercase tracking-widest text-primary-glow">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight md:text-5xl">
        {title}
      </h2>
      <p className="mt-4 text-muted-foreground md:text-lg">{subtitle}</p>
    </motion.div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  desc,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      className="group relative overflow-hidden rounded-2xl glass p-6 transition-all hover:border-border-glow hover:shadow-glow-soft"
    >
      <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-border">
        <Icon className="h-5 w-5 text-primary-glow" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <div className="pointer-events-none absolute -bottom-px left-6 right-6 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
    </motion.div>
  );
}
