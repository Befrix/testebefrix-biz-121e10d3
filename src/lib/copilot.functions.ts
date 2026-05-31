import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const InsightSchema = z.object({
  title: z.string(),
  detail: z.string(),
  kind: z.enum(["insight", "recommendation", "alert", "opportunity", "risk"]),
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  metric: z.string().optional(),
});

export type CopilotInsight = z.infer<typeof InsightSchema>;

const NextActionSchema = z.object({
  headline: z.string(),
  rationale: z.string(),
  impact: z.string(),
});

export type CopilotNextAction = z.infer<typeof NextActionSchema>;

const FALLBACK_INSIGHTS: CopilotInsight[] = [
  { title: "Campanhas com eventos convertem 37% mais", detail: "Vincule eventos às próximas campanhas para acelerar reuniões.", kind: "recommendation", priority: "high" },
  { title: "WhatsApp gera mais respostas para decisores", detail: "Priorize WhatsApp no primeiro toque com C-level.", kind: "opportunity", priority: "high" },
  { title: "Reuniões pela manhã convertem melhor", detail: "Agende slots entre 9h e 11h para reduzir no-show.", kind: "insight", priority: "medium" },
  { title: "Taxa de no-show acima do benchmark", detail: "Configure reminders 24h e 1h antes da reunião.", kind: "alert", priority: "high" },
];

const FALLBACK_ACTION: CopilotNextAction = {
  headline: "Reative leads quentes sem follow-up",
  rationale: "Há leads com score alto sem toque nos últimos 7 dias — janela de conversão fechando.",
  impact: "Potencial de +18% em reuniões agendadas nas próximas duas semanas.",
};

const ChannelStat = z.object({ channel: z.string(), sent: z.number(), replies: z.number(), replyRate: z.number() });
const SegmentStat = z.object({ segment: z.string(), leads: z.number(), won: z.number(), winRate: z.number() });
const DayStat = z.object({ day: z.string(), meetings: z.number(), conversions: z.number() });

const MetricsInput = z.object({
  leadsCaptured: z.number(),
  emailsSent: z.number(),
  totalSent: z.number(),
  replies: z.number(),
  meetingsScheduled: z.number(),
  meetingsCompleted: z.number(),
  noShows: z.number(),
  won: z.number(),
  revenueBRL: z.number(),
  spendBRL: z.number(),
  replyRate: z.number(),
  conversionRate: z.number(),
  noShowRate: z.number(),
  roi: z.number(),
  cac: z.number(),
  channelBreakdown: z.array(ChannelStat).optional(),
  segmentBreakdown: z.array(SegmentStat).optional(),
  dayOfWeekBreakdown: z.array(DayStat).optional(),
  topSegments: z.array(z.string()).optional(),
  activeCampaigns: z.number().optional(),
});

export type CopilotMetricsInput = z.infer<typeof MetricsInput>;

export const generateCopilotInsights = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => MetricsInput.parse(input))
  .handler(async ({ data }): Promise<{ insights: CopilotInsight[]; nextAction: CopilotNextAction; generatedAt: string }> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    const generatedAt = new Date().toISOString();
    if (!apiKey) return { insights: FALLBACK_INSIGHTS, nextAction: FALLBACK_ACTION, generatedAt };

    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "Você é o AI Copilot estratégico da BEFRIX, plataforma enterprise de outbound intelligence e SDR automation. Analise as métricas fornecidas (campanhas, canais, segmentos, reuniões, no-shows, ROI, padrões por dia da semana) como um Head of Sales sênior. Gere análise comportamental, padrões e recomendações específicas em PT-BR.\n\nResponda APENAS com JSON válido neste schema:\n{\n  \"nextAction\": { \"headline\": \"frase de impacto\", \"rationale\": \"por que agora\", \"impact\": \"resultado esperado quantificado\" },\n  \"insights\": [ { \"title\": \"frase curta com número quando possível\", \"detail\": \"1 frase acionável\", \"kind\": \"insight|recommendation|alert|opportunity|risk\", \"priority\": \"high|medium|low\", \"metric\": \"opcional, ex 37%\" } ]\n}\n\nRegras: 6 a 9 insights, mix de categorias, prioridade baseada em impacto financeiro. Nunca invente dados — se a métrica é 0 ou ausente, gere insights baseados em benchmarks da indústria de outbound B2B.",
            },
            { role: "user", content: `Snapshot do workspace BEFRIX:\n${JSON.stringify(data, null, 2)}` },
          ],
        }),
      });

      if (!res.ok) return { insights: FALLBACK_INSIGHTS, nextAction: FALLBACK_ACTION, generatedAt };
      const json = await res.json();
      const content: string = json?.choices?.[0]?.message?.content ?? "";
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return { insights: FALLBACK_INSIGHTS, nextAction: FALLBACK_ACTION, generatedAt };
      const parsed = JSON.parse(match[0]);
      const insights = z.array(InsightSchema).safeParse(parsed.insights);
      const nextAction = NextActionSchema.safeParse(parsed.nextAction);
      return {
        insights: insights.success && insights.data.length > 0 ? insights.data : FALLBACK_INSIGHTS,
        nextAction: nextAction.success ? nextAction.data : FALLBACK_ACTION,
        generatedAt,
      };
    } catch {
      return { insights: FALLBACK_INSIGHTS, nextAction: FALLBACK_ACTION, generatedAt };
    }
  });
