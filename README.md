# 🎟️ Elite Tickets — Plataforma de Eventos e Ingressos

> **Desafio Elite Dev 2026 (Verzel)**  
> Plataforma de publicação de eventos, reserva de assentos com concorrência pessimista no PostgreSQL, checkout simulado, ingressos com QR Code assinado via HMAC-SHA256 e validação atômica na portaria.

---

## 🔗 Aplicação no Ar

- 💻 **Acessar Sistema:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)

---

## ⚡ Guia Rápido de Teste (Personas de Acesso)

Para facilitar e agilizar a avaliação pela banca da Verzel sem exigir cadastros, foi implementado um **Alternador de Personas** no topo da tela:

| Papel | E-mail de Teste | O que testar no fluxo |
| :--- | :--- | :--- |
| **Cliente** | `ana.cliente@verzel.com` | Seleção de assentos no mapa interativo, checkout simulado (Aprovado e Recusado), zoom do QR Code, compartilhamento por link e exportação em PDF A4. |
| **Portaria** | `portaria@verzel.com` | Leitura óptica de QR Code via câmera do dispositivo ou digitação manual com retorno háptico (validação dos 4 estados: *Válido, Já Usado, Inválido e Show Errado*). |
| **Organizador** | `organizador@verzel.com` | Publicação de novos eventos e importação em lote via API do **TMDb (ao vivo)** e catálogo curado do **Ticketmaster**. |

---

## 🎯 1. O Que Foi Feito (Escopo Entregue)

Todas as funcionalidades obrigatórias e os principais diferenciais recomendados pelo edital foram implementados de ponta a ponta:

1. **Front-End Intencional & Responsivo:**
   - Navegação por catálogo de eventos com busca em tempo real (título/local) e filtros por categoria (Filmes / Shows / Todos).
   - Mapa de assentos interativo particionado por evento com setores (VIP, Premium, Standard), fileiras numeradas (A–H, 1–10) e cálculo dinâmico de total.
   - Modal de checkout com simulação de Cartão de Crédito e Pix, tratando confirmação e recusa com devolução imediata do assento ao estoque.
   - Carteira "Meus Ingressos" com bilhete digital vertical em alta fidelidade (*Swiss Design / Apple Wallet Pass*), zoom de QR Code para leitura rápida na catraca e botão de compartilhamento por link.
   - Tela de portaria com leitor óptico por câmera (`html5-qrcode`), digitação manual alternativa, seletor de evento/portão geral e menu retrátil com os 4 estados de teste.

2. **Back-End & Concorrência no Banco de Dados:**
   - Integração com APIs externas: busca ao vivo na API do **TMDb** e catálogo do **Ticketmaster**.
   - Autenticação e RBAC com 3 papéis distintos (`organizer`, `client`, `gatekeeper`).
   - Bloqueio pessimista via Stored Procedure em PL/pgSQL no PostgreSQL (`SELECT ... FOR UPDATE ORDER BY id ASC`), eliminando 100% de duplas vendas e deadlocks.
   - Ingressos com QR Code assinado via **HMAC-SHA256** no servidor com Web Crypto API nativa do Cloudflare Workers.
   - Validação atômica de portaria tratando os 4 estados (`VALID`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`).
   - Compartilhamento público de ingresso via link direto (`?ticket=UUID`) sem necessidade de autenticação.

3. **Diferenciais & Overdelivery:**
   - Envio assíncrono real de e-mails com o voucher do ingresso via **API do Resend** (`c.executionCtx.waitUntil`).
   - Retorno háptico com vibração física no celular da portaria para feedback de acesso.
   - Exportação e impressão em PDF A4 perfeitamente centralizada via CSS print.
   - Suíte de 18 cenários de testes automatizados de concorrência e caos (21 asserções).
   - Pipeline de CI/CD completa no GitHub Actions com TypeCheck estrito, Vitest, Playwright e Deploy automático.

---

## 🚫 2. O Que NÃO Foi Feito e o que Foi Descartado (Decisões de Trade-off)

Seguindo a recomendação explícita do edital de que *"o escopo é pequeno de propósito e o que interessa é como você pensa"*, alguns itens foram deliberadamente descartados para manter a arquitetura enxuta, confiável e focada na experiência central:

| Item Descartado | Motivo da Decisão / Trade-off |
| :--- | :--- |
| **Nota Fiscal Eletrônica (NFS-e)** | Descartado conforme dispensa no edital; complexidade tributária desnecessária para um fluxo de pagamento simulado. |
| **Revenda secundária P2P** | Descartado para manter a integridade estrita da titularidade do ingresso e focar na prevenção de fraudes via HMAC. |
| **Aplicativo Nativo (iOS/Android)** | Substituído por uma **PWA Web responsiva com suporte a Mobile Bottom Sheets** e touch events nativos, rodando direto no navegador sem necessidade de download em app stores. |
| **Transação Financeira Real** | O edital especificava cobrança simulada. Optou-se por um checkout transparente com gatilhos determinísticos de aprovação e recusa para validação de testes. |

---

## 💡 3. Por Que o Sistema é Assim? (Decisões de Design & Arquitetura)

### A. Fuga do "AI Slop" — Design System Suíço / Apple Wallet
Muitos sistemas gerados por IA possuem interfaces genéricas, efeitos luminosos excessivos e modais instáveis no celular.
- **Decisão:** Optou-se por uma paleta sóbria em Dark Mode (`#09090b` / `#111113`), tipografia com números monoespaçados para assentos e referências, contraste WCAG AA/AAA e bilhete digital inspirado no design limpo do **Apple Wallet Pass**.
- **Resultado:** Interface profissional, estável em qualquer tamanho de tela e sem distrações visuais.

### B. Concorrência no Banco vs. Concorrência em Memória
Soluções ingênuas tentam controlar reservas na memória do Node.js. Em uma arquitetura Serverless (Cloudflare Workers) ou distribuída, isso geraria duplas vendas imediatas.
- **Decisão:** O controle de estoque foi delegado exclusivamente ao PostgreSQL (Supabase) via Stored Procedure `reserve_ticket_atomic` com `SELECT ... FOR UPDATE ORDER BY id ASC`.
- **Resultado:** Garantia transacional ACID mesmo sob rajadas de requisições simultâneas.

### C. Assinatura HMAC-SHA256 na Borda
Em vez de trafegar dados abertos no QR Code, o servidor assina o payload do ingresso com uma chave secreta no Cloudflare Workers usando Web Crypto API.
- **Decisão:** O QR Code contém uma assinatura criptográfica. A portaria recalcula o HMAC e valida o bilhete no banco em uma única transação atômica.
- **Resultado:** Impossível forjar ingressos ou alterar o número do assento/evento no QR Code.

### D. Alternador de Personas no Topo
Em vez de exigir que os avaliadores façam login, logout e troca de contas para testar os 3 papéis, foi embutido um seletor visual no topo.
- **Decisão:** Troca instantânea de contexto (Cliente, Organizador e Portaria) com 1 clique, preservando os dados no banco.
- **Resultado:** Experiência de avaliação fluida e sem atritos.

---

## 🤖 4. Transparência no Uso de Inteligência Artificial

Em total consonância com as diretrizes do edital da Verzel, o processo de desenvolvimento utilizou IA como acelerador e copiloto de engenharia:

- **Onde a IA foi utilizada:**
  - Geração de boilerplate de código TypeScript, rotas do Hono.js e componentes React base.
  - Criação da suíte de testes de estresse e concorrência (`tests/qa_all_scenarios_suite.mjs`).
  - Estruturação inicial das Stored Procedures em PL/pgSQL.

- **O que foi feito e decidido humanamente (Curadoria & Engenharia):**
  - **Refinamento Visual:** Remoção de componentes poluídos, redefinição de contraste e ajuste manual do layout do passe digital para impressão em PDF A4.
  - **Correção Lógica de Negócio:** Identificação e isolamento do mapa de assentos para evitar que eventos importados compartilhassem IDs de poltronas.
  - **Arquitetura de Segurança:** Escolha da Web Crypto API para HMAC-SHA256 e ordenação determinística de IDs para prevenção de deadlocks no banco.
  - **Integração Real de E-mails:** Adição da API do Resend em segundo plano no Cloudflare Workers.

> 📄 O registro detalhado de decisões e artefatos de IA está documentado em [`docs/AI_LOG.md`](docs/AI_LOG.md).

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Front-End** | React 18, Vite, TypeScript, Tailwind CSS | Performance extrema, tipagem estrita (Zero `any`) e bundle otimizado. |
| **Back-End** | Node.js, Hono.js, Cloudflare Workers | Execução serverless na borda (Edge) com latência < 20ms e Web Crypto API nativa. |
| **Banco de Dados** | Supabase (PostgreSQL 15) | Stored Procedures PL/pgSQL, transações atômicas e Row Level Security (RLS). |
| **Criptografia** | HMAC-SHA256 (Web Crypto) | Hashes assinadas no servidor para prevenção absoluta de falsificação. |
| **Leitura Óptica** | `html5-qrcode` + Web Audio API | Leitor de câmera responsivo com bipes sintetizados e feedback háptico. |
| **Testes & CI/CD** | Vitest, Playwright, GitHub Actions | Testes unitários, E2E e esteira de automação com 4 jobs encadeados. |

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js 18+ e npm instalados.

### 1. Clonar o Repositório e Instalar Dependências
```bash
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev
npm install
```

### 2. Configurar Variáveis de Ambiente
Os ambientes já possuem fallbacks configurados para testes locais e desenvolvimento. Caso deseje apontar para o Supabase:
- No diretório `client/.env`:
  ```env
  VITE_API_URL=http://localhost:8787
  VITE_SUPABASE_URL=sua_url_supabase
  VITE_SUPABASE_ANON_KEY=sua_anon_key
  ```
- No diretório `server/.dev.vars` (Cloudflare Wrangler):
  ```env
  SUPABASE_URL=sua_url_supabase
  SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
  HMAC_SECRET=sua_chave_secreta_hmac
  RESEND_API_KEY=sua_chave_resend (opcional)
  ```

### 3. Inicializar o Banco de Dados (Caso use banco próprio)
O script DDL completo com as tabelas, seeds de teste e Stored Procedures com trava pessimista está localizado em:
[`supabase/schema.sql`](supabase/schema.sql).

### 4. Executar em Modo de Desenvolvimento
```bash
# Terminal 1 — Back-End (Cloudflare Worker Local via Wrangler)
npm run dev --prefix server   # Rodará em http://localhost:8787

# Terminal 2 — Front-End (Vite Dev Server)
npm run dev --prefix client   # Rodará em http://localhost:5173
```

### 5. Executar Validações e Testes
```bash
# 1. Checagem estrita de tipos TypeScript (Client + Server)
npm run typecheck

# 2. Testes unitários com Vitest
npm test

# 3. Suíte de Auditoria no Banco Real
node tests/live_db_audit.mjs

# 4. Suíte Extrema de Concorrência e Caos (18 Cenários / 21 Asserções)
node tests/qa_all_scenarios_suite.mjs
```

---

## 📚 Documentação Complementar

- 📋 [**Checklist de Entrega & Comparativo do Edital**](docs/CHECKLIST_ENTREGA.md)
- 🛡️ [**Matriz de Rastreabilidade de Requisitos**](docs/REQUIREMENTS_AUDIT.md)
- 🤖 [**Registro Completo de Transparência de IA**](docs/AI_LOG.md)
- 📜 [**Edital Original do Desafio**](docs/DESAFIO_ELITE_DEV_EDITAL.md)
- 🧭 [**Grafo de Arquitetura da Solução**](graphify-out/GRAPH_REPORT.md)

---

Desenvolvido por **Rafael Lauri** para o **Desafio Elite Dev 2026 (Verzel)**.
