import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParticipantRow = {
  full_name?: string | null;
  email?: string | null;
  company?: string | null;
  job_title?: string | null;
  phone?: string | null;
  segment?: string | null;
  region?: string | null;
  linkedin_url?: string | null;
};

const FIELD_MAP: Record<string, keyof ParticipantRow> = {
  // name
  nome: "full_name",
  name: "full_name",
  "nome completo": "full_name",
  fullname: "full_name",
  "full name": "full_name",
  participante: "full_name",
  // email
  email: "email",
  "e-mail": "email",
  mail: "email",
  "endereco de email": "email",
  // company
  empresa: "company",
  company: "company",
  organizacao: "company",
  organização: "company",
  // job title
  cargo: "job_title",
  cargo_funcao: "job_title",
  titulo: "job_title",
  título: "job_title",
  position: "job_title",
  "job title": "job_title",
  role: "job_title",
  // phone
  telefone: "phone",
  phone: "phone",
  celular: "phone",
  whatsapp: "phone",
  // segment
  segmento: "segment",
  segment: "segment",
  setor: "segment",
  industria: "segment",
  indústria: "segment",
  // region
  cidade: "region",
  city: "region",
  estado: "region",
  uf: "region",
  regiao: "region",
  região: "region",
  // linkedin
  linkedin: "linkedin_url",
  "linkedin url": "linkedin_url",
  perfil_linkedin: "linkedin_url",
};

function normalizeKey(k: string): string {
  return k
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function mapRow(raw: Record<string, unknown>): ParticipantRow {
  const out: ParticipantRow = {};
  for (const [rawKey, rawValue] of Object.entries(raw)) {
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;
    const key = normalizeKey(rawKey);
    const field = FIELD_MAP[key];
    if (!field) continue;
    const value = String(rawValue).trim();
    if (!value) continue;
    out[field] = value;
  }
  return out;
}

export async function parseParticipantFile(file: File): Promise<ParticipantRow[]> {
  const name = file.name.toLowerCase();
  const isCsv = name.endsWith(".csv");
  const isXlsx = name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!isCsv && !isXlsx) throw new Error("Formato não suportado. Use CSV ou XLSX.");

  if (isCsv) {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    if (parsed.errors.length > 0) {
      const first = parsed.errors[0];
      throw new Error(`Erro ao ler CSV: ${first.message}`);
    }
    return (parsed.data ?? []).map(mapRow).filter((r) => Object.keys(r).length > 0);
  }

  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Planilha vazia");
  const sheet = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  return rows.map(mapRow).filter((r) => Object.keys(r).length > 0);
}