# 🎟️ Elite Tickets — Plataforma de Eventos e Ingressos

Plataforma de publicação de eventos, reserva de assentos com controle de concorrência no PostgreSQL, checkout simulado, ingressos com QR Code assinado via HMAC-SHA256 e validação na portaria. Desenvolvido para o **Desafio Elite Dev (Verzel)**.

---

## 🔗 Aplicação no Ar

- 💻 **Aplicação:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)
- ⚡ **API Edge:** `https://elite-tickets-api.agenddar.workers.dev`

---

## ⚡ Guia Rápido de Teste (Personas)

Use o seletor no topo da tela para alternar entre as 3 personas sem necessidade de cadastro:

| Papel | E-mail de Teste | O que testar |
| :--- | :--- | :--- |
| **Cliente** | `ana.cliente@verzel.com` | Seleção de assentos no mapa, checkout simulado, zoom do QR Code e exportação em PDF. |
| **Portaria** | `portaria@verzel.com` | Leitura óptica de QR Code via câmera (validação de 4 estados em tempo real). |
| **Organizador** | `organizador@verzel.com` | Publicação de eventos e importação em lote via TMDb (ao vivo) / Ticketmaster. |

---

## 🏗️ Arquitetura & Decisões Técnicas

- **Concorrência Pessimista:** Stored Procedure `reserve_ticket_atomic` com `SELECT ... FOR UPDATE` no PostgreSQL para prevenir dupla venda e overbooking.
- **Segurança Criptográfica:** QR Code com assinatura HMAC-SHA256 via Web Crypto API nativa do Cloudflare Workers.
- **Validação de Portaria:** Máquina de 4 estados atômica (`VALID`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`).
- **Catálogo Externo:** Integração com busca ao vivo na API do TMDb e catálogo de shows do Ticketmaster.
- **TypeScript Estrito:** 100% tipado com interfaces estritas (Zero `any`).

---

## 🛠️ Stack Tecnológica

- **Front-End:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `html5-qrcode`, `qrcode.react`.
- **Back-End:** Hono.js, Cloudflare Workers Runtime, Web Crypto API.
- **Banco de Dados:** PostgreSQL (Supabase), Stored Procedures PL/pgSQL, Row Level Security (RLS).
- **Testes & CI/CD:** Vitest, Playwright, GitHub Actions.

---

## 🚀 Execução Local

```bash
# Instalar dependências
npm install

# Executar aplicação localmente
npm run dev --prefix client   # Front-End (http://localhost:5173)
npm run dev --prefix server   # API Local (http://localhost:8787)

# Validação e testes
npm run typecheck             # TypeScript estrito
npm test                      # Testes unitários Vitest
```

---

## 📚 Documentação

- 📋 **Checklist de Requisitos:** [`docs/CHECKLIST_ENTREGA.md`](docs/CHECKLIST_ENTREGA.md)
- 📜 **Edital do Desafio:** [`docs/DESAFIO_ELITE_DEV_EDITAL.md`](docs/DESAFIO_ELITE_DEV_EDITAL.md)
- 🤖 **Registro de IA e Decisões:** [`docs/AI_LOG.md`](docs/AI_LOG.md)
- 🧭 **Grafo de Arquitetura:** [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md)
