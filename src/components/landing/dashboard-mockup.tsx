import { motion } from "framer-motion";
import { Activity, ArrowUpRight, Bot, Mail, Sparkles, TrendingUp } from "lucide-react";

const bars = [38, 52, 44, 68, 58, 82, 74, 92, 86, 96, 88, 100];

export function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Glow behind */}
      <div className="absolute inset-x-10 -top-10 h-80 bg-gradient-to-b from-primary/30 via-accent/20 to-transparent blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 40, rotateX: 8 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        className="relative glass-strong rounded-2xl border border-border-glow/40 shadow-2xl shadow-primary/10 overflow-hidden"
      >
        {/* Window chrome */}
        <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-warning/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
          </div>
          <div className="rounded-md bg-surface px-3 py-1 text-[10px] font-mono text-muted-foreground">
            app.befrix.io / pipeline
          </div>
          <div className="w-12" />
        </div>

        {/* Body */}
        <div className="grid grid-cols-12 gap-4 p-4 md:p-6">
          {/* Sidebar */}
          <div className="col-span-3 hidden flex-col gap-1 md:flex">
            {["Pipeline", "Sequências", "Inbox", "Leads", "Relatórios"].map((l, i) => (
              <div
                key={l}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-xs ${
                  i === 0 ? "bg-primary/15 text-foreground" : "text-muted-foreground"
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-60" />
                {l}
              </div>
            ))}
          </div>

          {/* Main */}
          <div className="col-span-12 md:col-span-9 space-y-4">
            {/* KPIs */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Reuniões", value: "1.284", delta: "+38%", icon: TrendingUp },
                { label: "Open rate", value: "62%", delta: "+12%", icon: Mail },
                { label: "AI Replies", value: "947", delta: "+24%", icon: Bot },
              ].map((k, i) => (
                <motion.div
                  key={k.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                  className="rounded-lg border border-border bg-surface/60 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {k.label}
                    </span>
                    <k.icon className="h-3.5 w-3.5 text-primary-glow" />
                  </div>
                  <div className="mt-2 flex items-end justify-between">
                    <span className="text-xl font-semibold">{k.value}</span>
                    <span className="text-[10px] font-medium text-success">{k.delta}</span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Chart */}
            <div className="rounded-lg border border-border bg-surface/60 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Performance — últimos 12 dias</p>
                  <p className="mt-0.5 text-base font-semibold">Pipeline gerado</p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-1 text-[10px] font-medium text-success">
                  <ArrowUpRight className="h-3 w-3" /> +47% MoM
                </span>
              </div>
              <div className="mt-4 flex h-28 items-end gap-1.5">
                {bars.map((h, i) => (
                  <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ delay: 0.8 + i * 0.04, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="flex-1 rounded-t-sm bg-gradient-to-t from-primary/60 to-accent/80"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Floating cards */}
      <motion.div
        initial={{ opacity: 0, x: -30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -left-4 top-1/3 hidden w-56 rounded-xl glass-strong border border-border-glow/30 p-3 shadow-glow-soft md:block animate-float"
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-accent/20">
            <Sparkles className="h-3.5 w-3.5 text-accent-glow" />
          </div>
          <div>
            <p className="text-[11px] font-medium">Lead score atualizado</p>
            <p className="text-[10px] text-muted-foreground">Acme Inc · 92/100</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 1.2, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="absolute -right-4 bottom-10 hidden w-60 rounded-xl glass-strong border border-border-glow/30 p-3 shadow-glow-soft md:block animate-float"
        style={{ animationDelay: "1.5s" }}
      >
        <div className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-success/20">
            <Activity className="h-3.5 w-3.5 text-success" />
          </div>
          <div>
            <p className="text-[11px] font-medium">Reunião agendada</p>
            <p className="text-[10px] text-muted-foreground">Nordic SaaS · 14:30</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}