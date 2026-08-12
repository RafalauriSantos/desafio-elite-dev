# 🎟️ Plataforma de Eventos e Ingressos — Desafio Elite Dev 2026

Aplicação Full-Stack de Alta Performance desenvolvida para o **Desafio Elite Dev 2026 (Verzel)**. O sistema oferece uma experiência completa de publicação de eventos (sincronizada com catálogos TMDb e Ticketmaster), seleção de assentos numerados em tempo real com concorrência pessimista, checkout simulado, emissão de bilhetes digitais em formato **Apple Wallet Pass** com QR Code criptográfico HMAC-SHA256 e validação atômica na portaria com retorno háptico.

---

## 🔗 Links Oficiais do Projeto em Produção
- 💻 **Front-End (Cloudflare Pages):** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)
- ⚙️ **API Back-End (Cloudflare Workers):** [https://elite-tickets-api.agenddar.workers.dev](https://elite-tickets-api.agenddar.workers.dev)
- 📦 **Repositório GitHub:** [https://github.com/RafalauriSantos/desafio-elite-dev](https://github.com/RafalauriSantos/desafio-elite-dev)
- 📊 **Pipeline CI/CD (GitHub Actions):** [https://github.com/RafalauriSantos/desafio-elite-dev/actions](https://github.com/RafalauriSantos/desafio-elite-dev/actions)

---

## 🏗️ Arquitetura do Sistema

```text
                  ┌────────────────────────┐
                  │ TMDb / Ticketmaster    │ (24 Atrações Curadas)
                  └───────────┬────────────┘
                              │ Importação em Lote
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │ Front-End: React 18 + Vite + TypeScript + Tailwind CSS  │
  │ (Cloudflare Pages - Bottom Sheets & Apple Wallet Pass)   │
  └────────────┬───────────────────────────────▲────────────┘
               │                               │
    Requisições HTTP API             Validação QR / Háptica
               │                               │
  ┌────────────▼───────────────────────────────┴────────────┐
  │ Back-End: Hono.js + TypeScript                       │
  │ (Cloudflare Workers - Serverless Edge Runtime)          │
  └────────────┬───────────────────────────────▲────────────┘
               │                               │
    Assinatura HMAC-SHA256         FOR UPDATE ORDER BY id ASC
               │                               │
  ┌────────────▼───────────────────────────────┴────────────┐
  │ Banco de Dados: PostgreSQL                              │
  │ (Supabase - RLS + PL/pgSQL Stored Procedures)           │
  └─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

- **Front-End:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `qrcode.react`, `html5-qrcode`, Vitest, React Testing Library.
- **Back-End:** Node.js / TypeScript, Hono.js, Cloudflare Workers, Web Crypto API (HMAC-SHA256), Vitest.
- **Banco de Dados:** PostgreSQL (Supabase), Row Level Security (RLS), Stored Procedures com `SELECT ... FOR UPDATE ORDER BY 1 ASC`.
- **Automação & E2E:** Playwright (Chromium Headless E2E Suite em Python).
- **Segurança & CI/CD:** GitHub Actions (Security Audit com Gitleaks, TypeCheck, Test Suite e Deploy Automatizado na Cloudflare).

---

## 🌟 Principais Recursos & Soluções de Engenharia

### 1. Prevenção de Dupla Venda & Deadlocks (Concorrência Pessimista)
A reserva de assentos invoca a Stored Procedure `reserve_tickets_batch_atomic` no PostgreSQL. A função executa um bloqueio exclusivo de linha ordenado por ID (`SELECT ... FOR UPDATE ORDER BY id ASC`), garantindo atomicidade, prevenindo deadlocks e impedindo dupla venda mesmo sob requisições concorrentes massivas.

### 2. Ingressos Anti-Fraude (HMAC-SHA256) & Formato Apple Wallet Pass
Os QR Codes contêm uma hash HMAC-SHA256 gerada na borda combinando `ticket_id`, `event_id`, `seat_id`, `user_email` e a chave secreta do servidor. O passe digital é renderizado em formato vertical **Apple Wallet Pass** (`PrintableTicket.tsx`) com referência mascarada `REF: #7361-5E6D`.

### 3. Operações em Lote (Bulk Operations)
- **Cliente:** Seleção múltipla de poltronas no mapa de assentos (`SeatMap.tsx`) com resumo do valor total acumulado e reserva atômica em lote.
- **Organizador:** Checkboxes no modal de organizador (`OrganizerModal.tsx`) para importação simultânea em lote de atrações das APIs do TMDb e Ticketmaster (`POST /api/events/bulk-import`).

### 4. Validação Háptica & Máquina de 4 Estados na Portaria
A Stored Procedure `validate_ticket_gatekeeper` e o scanner tratam atomicamente os 4 estados do edital:
- 🟢 `VALID` (Acesso liberado + vibração háptica `[80ms]`).
- 🟡 `ALREADY_USED` (Entrada recusada: Ingresso já utilizado + vibração `[100ms, 50ms, 100ms]`).
- 🔴 `INVALID` (Assinatura HMAC alterada ou QR Code forjado).
- 🔵 `WRONG_EVENT` (Ingresso válido, porém de outro espetáculo).

### 5. Esteira CI/CD & Escudo de Segurança (GitHub Actions)
Uma pipeline de 4 estágios encadeados garante a qualidade do código:
1. `security-audit`: Varredura Gitleaks (com `.gitleaks.toml` allowlist) para impedir vazamento de segredos + `npm audit`.
2. `type-check`: Verificação estrita TypeScript (`tsc --noEmit`).
3. `test-suite`: Execução dos testes unitários Vitest e automação Playwright E2E.
4. `deploy-production`: Deploy automático na Cloudflare Pages e Workers após 100% de aprovação.

---

## 👥 Credenciais para Teste (Seed Data)

Com `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` configurados, a aplicação exige sessão Supabase Auth e carrega o papel em `public.profiles`. As contas abaixo são os perfis seed; a senha deve ser definida no painel Auth do projeto, sem ser versionada.

| Role | E-mail | Acesso na Aplicação |
|---|---|---|
| **Organizador** | `organizador@verzel.com` | Painel de publicação e importação em lote. |
| **Cliente 1** | `ana.cliente@verzel.com` | Mapa de assentos, lote e carteira de ingressos. |
| **Cliente 2** | `bruno.cliente@verzel.com` | Mapa de assentos, lote e carteira de ingressos. |
| **Portaria (Gatekeeper)** | `portaria@verzel.com` | Scanner háptico e máquina de 4 estados. |

---

O fluxo de recuperação de senha usa o Supabase Auth. Para entrega de e-mails em produção, configure o Resend como SMTP do Supabase e mantenha a API key fora do frontend. O Worker também aceita `RESEND_API_KEY` e `RESEND_FROM_EMAIL` como secrets para enviar a confirmação do ingresso após o checkout; a ausência desses secrets não interrompe a emissão.

## 🚀 Como Executar Localmente

### Deploy do Worker

O Worker de produção usa o projeto Supabase `zgbhmduzypqfgfuncnhl` (Verzel DB). Os valores públicos/secretos ficam nos bindings da Cloudflare; mantenha-os ao publicar:

```bash
cd server
npx wrangler deploy --keep-vars
```

### Pré-requisitos
- Node.js 20+ instalado.
- Python 3.11+ (para suíte de testes E2E Playwright).

### Execução dos Testes Locais
```bash
# Executar verificação de tipos TypeScript
npm run typecheck

# Executar testes unitários (Vitest)
npm run test

# Executar testes de integração E2E (Playwright)
npm run test:e2e
```

### Executar a Aplicação
```bash
# Executar Back-End API (Worker)
cd server
npm install
npm run dev

# Executar Front-End (Client)
cd ../client
npm install
npm run dev
```

---

## 🤖 Transparência e Uso de IA
O relatório detalhado de engenharia e transparência está disponível em [docs/AI_LOG.md](docs/AI_LOG.md) e [docs/PRD.md](docs/PRD.md).
