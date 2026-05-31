import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const ScoreLeadsInput = z.object({
  limit: z.number().int().min(1).max(50).default(20),
});

const ScoredLead = z.object({
  id: z.string(),
  score: z.number().int().min(0).max(100),
  reason: z.string(),
  best_channel: z.enum(["email", "whatsapp", "linkedin"]),
});

const ScoringResponse = z.object({ leads: z.array(ScoredLead) });

export const scoreLeadsWithAI = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => ScoreLeadsInput.parse(i))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: leads } = await supabase
      .from("leads")
      .select("id, full_name, company, job_title, segment, region, score")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (!leads || leads.length === 0) return { scored: 0, leads: [] };

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY ausente");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              'Você é o lead-scoring engine da BEFRIX. Avalie cada lead B2B de 0 a 100 considerando senioridade do cargo, fit de segmento e completude dos dados. Escolha o melhor canal (email/whatsapp/linkedin). Responda APENAS JSON: {"leads":[{"id":"","score":0,"reason":"","best_channel":"email"}]}.',
          },
          { role: "user", content: JSON.stringify(leads) },
        ],
      }),
    });

    if (res.status === 429) throw new Error("Rate limit da IA. Tente novamente em alguns segundos.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    if (!res.ok) throw new Error(`Falha IA (${res.status})`);

    const json = await res.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "";
    const match = content.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Resposta IA inválida");

    const parsed = ScoringResponse.safeParse(JSON.parse(match[0]));
    if (!parsed.success) throw new Error("Schema IA inválido");

    let updated = 0;
    for (const s of parsed.data.leads) {
      const { error } = await supabase
        .from("leads")
        .update({
          score: s.score,
          metadata: { ai_reason: s.reason, ai_best_channel: s.best_channel, scored_at: new Date().toISOString() },
        })
        .eq("id", s.id);
      if (!error) updated++;
    }

    return { scored: updated, leads: parsed.data.leads };
  });
