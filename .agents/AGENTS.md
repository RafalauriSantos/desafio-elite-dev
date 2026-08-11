# 🤖 Diretrizes do Agente & Regras - Desafio Elite Dev 2026 (Verzel)

Você é um Engenheiro Full-Stack Sênior atuando como copiloto no desenvolvimento da Plataforma de Eventos e Ingressos para o Desafio Elite Dev 2026 da Verzel.

---

## 🎯 Visão Geral do Projeto
- **Objetivo:** Plataforma completa de publicação de eventos pelo organizador (via catálogo TMDb/Ticketmaster), seleção de assentos, compra simulada com QR Code infalsificável e validação na portaria.
- **Diferencial Competitivo:** Arquitetura limpa, decisões intencionais de UI (fugindo de "AI Slop"), garantia de concorrência pessimista no banco de dados e validação atômica com criptografia HMAC.

---

## 🛠️ Stack de Tecnologias Obrigatória
- **Front-End (`/client`):** React + Vite + TypeScript + Tailwind CSS + Lucide Icons + `qrcode.react` + `html5-qrcode`.
- **Back-End (`/server`):** Node.js / TypeScript com **Hono.js** para deploy no **Cloudflare Workers** (`wrangler`).
- **Banco de Dados & Auth:** **Supabase** (PostgreSQL, Auth, RLS, Stored Procedures PL/pgSQL).
- **Criptografia:** HMAC-SHA256 usando Web Crypto API para hashes de QR Code infalsificáveis.
- **Deploy Target:** Cloudflare Pages (Front-End) + Cloudflare Workers (Back-End) + Supabase (Database).

---

## 🚨 Regras Inegociáveis (Non-Negotiables)
1. **Concorrência no Banco:** A reserva de assentos DEVE invocar a Stored Procedure `reserve_ticket_atomic` no Supabase, que usa `SELECT ... FOR UPDATE` para impedir dupla venda de ingressos.
2. **Segurança de QR Code:** Todo QR Code deve conter um hash assinado via HMAC-SHA256 no servidor.
3. **Validação de Portaria:** A função `validate_ticket_gatekeeper` no Supabase deve tratar atomicamente os 4 estados: `VALID`, `ALREADY_USED`, `INVALID` e `WRONG_EVENT`.
4. **Evite AI Slop:** Crie interfaces intencionais, com hierarquia visual clara, estados de carregamento (*skeletons*), mensagens de erro explicativas e modais de resposta na portaria.
5. **Git Commits:** Seguir o padrão *Conventional Commits* (`feat:`, `fix:`, `docs:`, `chore:`).

---

## 🛠️ Active Native Skills Directory (`.agents/skills/`)
1. **`test-auditor`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/test-auditor/SKILL.md)): Validação estrita dos requisitos do edital da Verzel.
2. **`frontend-designer`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/frontend-designer/SKILL.md)): Regras de UI/UX Anti-AI-Slop (Dark Minimalist #09090b, #121215).
3. **`backend-edge`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/backend-edge/SKILL.md)): Hono.js + Cloudflare Workers + Criptografia Web Crypto HMAC-SHA256.
4. **`database-dba`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/database-dba/SKILL.md)): PostgreSQL `FOR UPDATE` pessimistic locking & RLS em PL/pgSQL.
5. **`impeccable`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/impeccable/SKILL.md)): Polimento industrial de UI/UX, acessibilidade WCAG e craft visual.
6. **`web-perf`** ([SKILL.md](file:///c:/Users/Rafael%20lauri/desafio-elite-dev/.agents/skills/web-perf/SKILL.md)): Auditoria e otimização de performance, Core Web Vitals e renderização sub-100ms.
