# 🎟️ Plataforma de Eventos e Ingressos — Desafio Elite Dev 2026

Aplicação Full-Stack desenvolvida para o **Desafio Elite Dev 2026 (Verzel)**. O sistema permite a gestão de eventos, reserva de assentos em tempo real com trava de concorrência, pagamento simulado, emissão de ingressos com QR Code assinado criptograficamente e validação na portaria.

---

## 🔗 Links do Projeto
- **Repositório GitHub (Privado):** [https://github.com/RafalauriSantos/desafio-elite-dev](https://github.com/RafalauriSantos/desafio-elite-dev)
- **Front-End (Cloudflare Pages):** [https://desafio-elite-dev.pages.dev](https://desafio-elite-dev.pages.dev)
- **API Back-End (Cloudflare Workers):** [https://desafio-elite-dev-api.workers.dev](https://desafio-elite-dev-api.workers.dev)

---

## 🏗️ Arquitetura do Sistema

```text
                  ┌────────────────────────┐
                  │ TMDb / Ticketmaster    │
                  └───────────┬────────────┘
                              │ Importação de Eventos
                              ▼
  ┌─────────────────────────────────────────────────────────┐
  │ Front-End: React 18 + Vite + Tailwind CSS               │
  │ (Cloudflare Pages - Edge Static Hosting)                │
  └────────────┬───────────────────────────────▲────────────┘
               │                               │
    Requisições HTTP API             Validação QR / SSE
               │                               │
  ┌────────────▼───────────────────────────────┴────────────┐
  │ Back-End: Hono.js + TypeScript                       │
  │ (Cloudflare Workers - Serverless Edge Runtime)          │
  └────────────┬───────────────────────────────▲────────────┘
               │                               │
    Assinatura HMAC-SHA256            Trava FOR UPDATE
               │                               │
  ┌────────────▼───────────────────────────────┴────────────┐
  │ Banco de Dados: PostgreSQL                              │
  │ (Supabase - RLS + PL/pgSQL Stored Procedures)           │
  └─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tecnologias Utilizadas

- **Front-End:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `qrcode.react`, `html5-qrcode`.
- **Back-End:** Node.js / TypeScript, Hono.js, Cloudflare Workers, Web Crypto API (HMAC-SHA256).
- **Banco de Dados:** PostgreSQL (Supabase), Row Level Security (RLS), Stored Procedures com `SELECT ... FOR UPDATE`.
- **Infraestrutura:** Cloudflare Pages & Workers (Edge Computing, latência < 20ms).

---

## 🔒 Soluções de Engenharia e Regras Críticas

### 1. Prevenção de Dupla Venda (Concorrência)
Em vez de validar a disponibilidade do assento apenas na camada da aplicação, a reserva invoca a Stored Procedure `reserve_ticket_atomic` no PostgreSQL. A função executa um bloqueio exclusivo de linha (`SELECT ... FOR UPDATE`), garantindo atomicidade e impedindo race conditions sob acessos simultâneos.

### 2. Ingressos Anti-Fraude (HMAC-SHA256)
Os QR Codes contêm um hash gerado na borda (Edge) combinando `ticket_id`, `event_id`, `seat_id`, `client_id` e a chave secreta do servidor. Tentativas de alterar os parâmetros no QR Code são rejeitadas como `INVÁLIDO`.

### 3. Validação Atômica na Portaria
A Stored Procedure `validate_ticket_gatekeeper` altera o status do ingresso para `used` e registra o timestamp da entrada. Tentativas de reaproveitar o mesmo QR Code retornam a mensagem `JÁ UTILIZADO` com a data e hora da primeira leitura.

---

## 👥 Credenciais para Teste (Seed Data)

A base de dados do Supabase possui o script de seed executado com as credenciais abaixo:

| Role | E-mail | Acesso na Aplicação |
|---|---|---|
| **Organizador** | `organizador@verzel.com` | Painel de criação e gestão de eventos. |
| **Cliente 1** | `ana.cliente@verzel.com` | Navegação, mapa de assentos e carteira de ingressos. |
| **Cliente 2** | `bruno.cliente@verzel.com` | Navegação, mapa de assentos e carteira de ingressos. |
| **Portaria (Gatekeeper)** | `portaria@verzel.com` | Scanner de câmera e validação de ingressos. |

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 18+ instalado.
- Conta e projeto configurado no Supabase.

### Passo 1: Clone do Repositório
```bash
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev
```

### Passo 2: Executar o Back-End
```bash
cd server
npm install
npm run dev
# Servidor rodando em http://localhost:8787
```

### Passo 3: Executar o Front-End
```bash
cd ../client
npm install
npm run dev
# Front-End rodando em http://localhost:5173
```

---

## 🤖 Transparência e Uso de IA
O relatório completo de uso de ferramentas de IA está disponível em [docs/AI_LOG.md](docs/AI_LOG.md).  
A IA foi empregada como parceira de raciocínio arquitetural na fase de concepção e na geração de boilerplates. A lógica transacional em PL/pgSQL com trava de concorrência, o algoritmo de assinatura criptográfica HMAC-SHA256 e a máquina de estados do scanner de portaria foram projetados e refinados manualmente para evitar abordagens genéricas ("AI Slop").
