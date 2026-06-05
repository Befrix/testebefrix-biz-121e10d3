// BEFRIX dashboard shared config & helpers

import {
  LayoutDashboard,
  Users,
  Megaphone,
  ListOrdered,
  BarChart3,
  BrainCircuit,
  Inbox,
  CalendarDays,
  Upload,
  Plug,
  CreditCard,
  Workflow,
  Building2,
  FileText,
  Radar,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: "overview" | "outbound" | "intelligence" | "ops";
};

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, group: "overview" },
  { to: "/dashboard/leads", label: "Leads", icon: Users, group: "outbound" },
  { to: "/dashboard/campanhas", label: "Campanhas", icon: Megaphone, group: "outbound" },
  { to: "/dashboard/sequencias", label: "Sequências", icon: ListOrdered, group: "outbound" },
  { to: "/dashboard/automacoes", label: "Automações", icon: Workflow, group: "outbound" },
  { to: "/dashboard/automations", label: "Workflow Builder", icon: Workflow, group: "outbound" },
  { to: "/dashboard/inbox", label: "Inbox", icon: Inbox, group: "intelligence" },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, group: "intelligence" },
  { to: "/dashboard/inteligencia", label: "Inteligência", icon: BrainCircuit, group: "intelligence" },
  { to: "/dashboard/radar", label: "Radar BEFRIX", icon: Radar, group: "intelligence" },
  { to: "/dashboard/eventos", label: "Eventos", icon: CalendarDays, group: "ops" },
  { to: "/dashboard/uploads", label: "Importação de Eventos", icon: Upload, group: "ops" },
  { to: "/dashboard/integracoes", label: "Integrações", icon: Plug, group: "ops" },
  { to: "/dashboard/empresa", label: "Meu Perfil", icon: Building2, group: "ops" },
  { to: "/dashboard/documentos", label: "Documentos", icon: FileText, group: "ops" },
  { to: "/dashboard/pagamentos", label: "Pagamentos", icon: CreditCard, group: "ops" },
];

export const NAV_GROUPS: { key: NavItem["group"]; label: string }[] = [
  { key: "overview", label: "Visão geral" },
  { key: "outbound", label: "Outbound" },
  { key: "intelligence", label: "Inteligência" },
  { key: "ops", label: "Operações" },
];

// SDR Pipeline stages
export const PIPELINE_STAGES = [
  { key: "new", label: "Novo Lead", leadStatus: "new" },
  { key: "contacted", label: "Contato", leadStatus: "contacted" },
  { key: "qualified", label: "Qualificado", leadStatus: "qualified" },
  { key: "meeting", label: "Reunião Agendada", leadStatus: "meeting" },
  { key: "proposal", label: "Proposta", leadStatus: "proposal" },
  { key: "won", label: "Fechado", leadStatus: "won" },
  { key: "lost", label: "Perdido", leadStatus: "lost" },
] as const;

export const MEETING_STATUSES = [
  { key: "scheduled", label: "Agendada", tone: "info" },
  { key: "completed", label: "Concluída", tone: "success" },
  { key: "no_show", label: "No-show", tone: "destructive" },
  { key: "rescheduled", label: "Reagendada", tone: "warning" },
  { key: "cancelled", label: "Cancelada", tone: "muted" },
] as const;

export const DEAL_STATUSES = [
  { key: "proposal", label: "Proposta enviada" },
  { key: "negotiation", label: "Negociação" },
  { key: "won", label: "Fechado" },
  { key: "lost", label: "Perdido" },
] as const;

export const CHANNELS = [
  { key: "email", label: "E-mail" },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "linkedin", label: "LinkedIn" },
] as const;

export function formatCurrencyBRL(cents: number | null | undefined): string {
  const value = (cents ?? 0) / 100;
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatNumber(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString("pt-BR");
}

export function formatPercent(n: number | null | undefined, digits = 1): string {
  return `${(n ?? 0).toFixed(digits)}%`;
}
