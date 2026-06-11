import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Lead = {
  id: string;
  full_name: string | null;
  email: string | null;
  company: string | null;
  job_title: string | null;
  segment: string | null;
  region: string | null;
  status: string;
  score: number;
  created_at: string;
  phone: string | null;
  linkedin_url: string | null;
  metadata: Record<string, unknown> | null;
};

export type OutreachLog = {
  id: string;
  channel: string;
  direction: string;
  status: string;
  created_at: string;
  lead_id: string | null;
  content: string | null;
};

export type Feedback = {
  id: string;
  lead_id: string | null;
  meeting_status: string;
  deal_status: string | null;
  deal_value_cents: number | null;
  feedback_date: string;
};

export type Campaign = {
  id: string;
  name: string;
  status: string;
  campaign_type: string | null;
  niche: string | null;
  total_sent: number;
  total_replies: number;
  total_meetings: number;
  created_at: string;
};

export function useWorkspaceData() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["workspace-data", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [leadsRes, outreachRes, feedbackRes, campanhasRes, financeiroRes] = await Promise.all([
        supabase.from("leads").select("*").order("created_at", { ascending: false }),
        supabase.from("outreach_logs").select("*").order("created_at", { ascending: false }),
        supabase.from("meeting_feedback").select("*").order("feedback_date", { ascending: false }),
        supabase
          .from("campaigns")
          .select("id, name, status, campaign_type, niche, total_sent, total_replies, total_meetings, created_at")
          .order("created_at", { ascending: false }),
        supabase.from("financeiro").select("*"),
      ]);

      const leads = (leadsRes.data ?? []) as Lead[];
      const outreach = (outreachRes.data ?? []) as OutreachLog[];
      const feedback = (feedbackRes.data ?? []) as Feedback[];
      const campanhas = (campanhasRes.data ?? []) as Campaign[];
      const financeiro = financeiroRes.data ?? [];

      // KPIs
      const emailsSent = outreach.filter((o) => o.direction === "outbound" && o.channel === "email").length;
      const totalSent = outreach.filter((o) => o.direction === "outbound").length;
      const replies = outreach.filter((o) => o.direction === "inbound").length;
      const meetingsScheduled = feedback.length;
      const meetingsCompleted = feedback.filter((f) => f.meeting_status === "completed").length;
      const meetingsRescheduled = feedback.filter((f) => f.meeting_status === "rescheduled").length;
      const noShows = feedback.filter((f) => f.meeting_status === "no_show").length;
      const won = feedback.filter((f) => f.deal_status === "won").length;
      const revenueCents = feedback
        .filter((f) => f.deal_status === "won")
        .reduce((sum, f) => sum + (f.deal_value_cents ?? 0), 0);
      const spendCents = financeiro
        .filter((f) => (f as { type: string }).type === "expense")
        .reduce((sum, f) => sum + ((f as { amount_cents: number }).amount_cents ?? 0), 0);

      const replyRate = totalSent > 0 ? (replies / totalSent) * 100 : 0;
      const conversionRate = meetingsScheduled > 0 ? (won / meetingsScheduled) * 100 : 0;
      const noShowRate = meetingsScheduled > 0 ? (noShows / meetingsScheduled) * 100 : 0;
      const cpl = leads.length > 0 && spendCents > 0 ? spendCents / leads.length : 0;
      const cac = won > 0 && spendCents > 0 ? spendCents / won : 0;
      const roi = spendCents > 0 ? ((revenueCents - spendCents) / spendCents) * 100 : 0;

      return {
        leads,
        outreach,
        feedback,
        campanhas,
        financeiro,
        kpis: {
          leadsCaptured: leads.length,
          emailsSent,
          totalSent,
          replies,
          meetingsScheduled,
          meetingsCompleted,
          meetingsRescheduled,
          noShows,
          won,
          revenueCents,
          spendCents,
          replyRate,
          conversionRate,
          noShowRate,
          cpl,
          cac,
          roi,
        },
      };
    },
  });
}
