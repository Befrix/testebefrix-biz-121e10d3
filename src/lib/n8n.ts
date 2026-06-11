// src/lib/n8n.ts

const N8N_BASE_URL = import.meta.env.VITE_N8N_URL; // ex: https://seu-n8n.com

export async function triggerCampaignCreation(payload: {
  organization_id: string;
  niche: string;
  company_name: string;
  segmento: string;
  cargo_alvo: string;
  dores_cliente: string;
  oferta: string;
  tom_voz: string;
}) {
  const res = await fetch(`${N8N_BASE_URL}/webhook/728b45b4-1beb-4dfd-9703-01a3a1cf703d`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function triggerLeadIntake(payload: {
  organization_id: string;
  company_name: string;
  message: string;
  score?: number;
}) {
  const res = await fetch(`${N8N_BASE_URL}/webhook/lead-intake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function triggerRadarSearch(payload: {
  organization_id: string;
  city: string;
  search_term: string;
  radius: number;
}) {
  const res = await fetch(`${N8N_BASE_URL}/webhook/radar-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}
