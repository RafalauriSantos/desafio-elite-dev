# 🎟️ Elite Tickets — Plataforma de Eventos e Ingressos

Plataforma de ponta a ponta para publicação de eventos, seleção de assentos com controle de concorrência no PostgreSQL, checkout simulado, emissão de bilhetes com QR Code assinado via HMAC-SHA256 e validação atômica na portaria. Desenvolvido para o **Desafio Elite Dev (Verzel)**.

---

## 🔗 Aplicação no Ar

- 💻 **Acessar Sistema:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)
- ⚡ **API Edge (Cloudflare Workers):** `https://elite-tickets-api.agenddar.workers.dev`

---

## ⚡ Guia Rápido de Avaliação (3 Personas)

O seletor de personas no topo da tela permite testar todos os fluxos sem necessidade de cadastro:

1. **🎟️ Cliente (Reserva e Compra):**
   - Acesse qualquer evento $\rightarrow$ selecione os assentos no mapa interativo com palco centralizado.
   - Avance para o checkout $\rightarrow$ selecione **"Aprovado"** para emitir o ingresso (ou **"Recusado"** para testar o retorno imediato do assento ao estoque).
   - Visualize o bilhete com canhoto físico (*ticket stub*), toque no QR Code para **zoom em tela cheia**, copie o código assinado ou exporte em **PDF de alta resolução**.
2. **🛡️ Portaria (Validação de Acesso):**
   - Acesse a aba **"Portaria"** $\rightarrow$ aponte a câmera para o QR Code (Scanner no padrão Google Lens com feixe laser) ou use a digitação manual.
   - Valida na hora os 4 estados: `Válido` (🟢), `Já Utilizado` (🟠), `Inválido` (🔴) ou `Evento Errado` (🟣).
3. **🎪 Organizador (Gestão e Catálogo Global):**
   - Mude para a persona **"Organizador"** $\rightarrow$ clique em **"Publicar evento"**.
   - Cadastre manualmente ou faça busca em tempo real na API mundial do **TMDb (800k+ filmes)** e shows do **Ticketmaster**, importando atrações com geração atômica dos 80 assentos numerados.

### Usuários de Demonstração (3 Personas)
| Papel | E-mail de Teste | Permissões |
| :--- | :--- | :--- |
| **Organizador** | `organizador@verzel.com` | Publicação e importação ao vivo de eventos |
| **Cliente** | `ana.cliente@verzel.com` | Reserva, compra e gestão de ingressos |
| **Portaria** | `portaria@verzel.com` | Validação de entradas na portaria via scanner |

---

## 🏗️ Arquitetura & Decisões Técnicas

- **Concorrência Pessimista no PostgreSQL:** Stored Procedure `reserve_ticket_atomic` com `SELECT ... FOR UPDATE` para serializar requisições concorrentes. Na reserva em lote, ordenação determinística (`ORDER BY 1 ASC`) para prevenir deadlocks.
- **Anti-Overbooking no DDL:** Índice único parcial `CREATE UNIQUE INDEX idx_unique_active_ticket_seat ON tickets (seat_id) WHERE status IN ('valid', 'used')` que impede duplicação no nível de disco.
- **Back-End Serverless (Hono.js + Cloudflare Workers):** Execução em V8 Isolates distribuídos globalmente com latência sub-50ms e zero cold start.
- **Criptografia HMAC-SHA256:** Assinatura digital do payload via Web Crypto API nativa. A chave secreta reside exclusivamente no Worker.
- **Busca Global ao Vivo no TMDb:** Integração com a API do The Movie Database com chave oficial configurada e mecanismo de resiliência e alta disponibilidade.
- **Despacho Assíncrono de E-mails:** Integração com Resend via `c.executionCtx.waitUntil()`, enviando e-mails reais em background sem atrasar o retorno do checkout.
- **Zero Any no TypeScript:** 100% do código (Client e Server) tipado com interfaces estritas.
- **Zero-Cache Headers (Cloudflare Pages):** Configuração de `_headers` com `Cache-Control: no-cache, no-store, must-revalidate` para `/index.html`, garantindo atualizações instantâneas após cada deploy.

---

## 🎨 Experiência de Interface & Design System (Dark Minimalist)

- **Hierarquia Visual:** Tipografia de autoridade com `Plus Jakarta Sans` para títulos e `JetBrains Mono` para coordenadas e dados técnicos.
- **Bilhete Canhoto Físico (*Ticket Stub*):** Recortes circulares laterais e linha pontilhada de picote inspirados em ingressos físicos de alta fidelidade.
- **Zoom de QR Code em Tela Cheia:** Modal de alto contraste com fundo branco puro para leitura imediata em leitores ópticos e catracas de portaria.
- **Scanner Óptico Google Lens:** Frame único com *corner brackets* esmeralda e linha de varredura laser animada (`@keyframes scan-sweep`), sem molduras duplicadas.
- **Exportação de PDF Vetorial:** Estilização de impressão isolada (`.printable-container`), gerando documentos limpos em folha A4 sem páginas em branco.

---

## 🗄️ Modelo de Dados (PostgreSQL / Supabase)

Toda a estrutura de tabelas, índices e Stored Procedures em PL/pgSQL está versionada em [`supabase/schema.sql`](supabase/schema.sql).

| Tabela | Descrição | Colunas Principais | Chaves & Constraints |
| :--- | :--- | :--- | :--- |
| **`profiles`** | Contas de usuário | `id`, `email`, `name`, `role`, `created_at` | `id PK`, `email UNIQUE` |
| **`events`** | Eventos e shows | `id`, `organizer_id`, `title`, `venue`, `date`, `price`, `banner_url` | `id PK`, `organizer_id FK (profiles)` |
| **`seats`** | Matriz de 80 assentos | `id`, `event_id`, `row_name`, `seat_number`, `category`, `price`, `status`, `locked_until` | `id PK`, `event_id FK (events)` |
| **`tickets`** | Ingressos emitidos | `id`, `event_id`, `seat_id`, `user_email`, `user_name`, `status`, `qr_signature`, `used_at` | `id PK`, `seat_id FK (Índice Único Parcial)` |

---

## 🛠️ Stack Tecnológica

- **Front-End:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `qrcode.react`, `html5-qrcode`.
- **Back-End:** Hono.js, Cloudflare Workers Runtime, Web Crypto API, Resend SDK.
- **Banco de Dados:** PostgreSQL (Supabase), PL/pgSQL Stored Procedures, Row Level Security (RLS).
- **Testes & CI/CD:** Vitest (Unitários), Playwright (E2E), Gitleaks (Secret Scan), GitHub Actions.

---

## 🚀 Execução Local

```bash
# 1. Clonar o repositório
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev

# 2. Instalar dependências
npm install

# 3. Executar em modo de desenvolvimento
npm run dev --prefix client   # Front-End (http://localhost:5173)
npm run dev --prefix server   # API Local (http://localhost:8787)

# 4. Executar suíte de testes e validação
npm run typecheck             # TypeScript estrito (Client + Server)
npm test                      # Testes unitários Vitest (Client + Server)
node tests/qa_all_scenarios_suite.mjs  # Suíte de 18 cenários de concorrência e segurança
```

---

## 📚 Documentação do Projeto

- 📋 **Checklist de Requisitos do Edital:** [`docs/CHECKLIST_ENTREGA.md`](docs/CHECKLIST_ENTREGA.md)
- 📜 **Edital Original da Verzel:** [`docs/DESAFIO_ELITE_DEV_EDITAL.md`](docs/DESAFIO_ELITE_DEV_EDITAL.md)
- 🤖 **Registro de IA e Arquitetura:** [`docs/AI_LOG.md`](docs/AI_LOG.md)
- 📐 **Workflow de Desenvolvimento SDD:** [`docs/SPEC_DRIVEN_WORKFLOW.md`](docs/SPEC_DRIVEN_WORKFLOW.md)
- 🧭 **Grafo de Arquitetura do Sistema:** [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md)
