# Services Layer

Encapsulates API calls and external integrations. Components consume
services via hooks (`src/hooks/`) backed by TanStack Query — never call
Supabase directly from components.

## Structure
- `services/<domain>/<domain>.service.ts` — pure functions, throw on error
- `services/<domain>/<domain>.types.ts` — request/response types
- `services/<domain>/<domain>.schema.ts` — Zod validation
