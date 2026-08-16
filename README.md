# elite-tickets

`elite-tickets` é a plataforma de eventos e bilhetagem desenvolvida para o **Desafio Elite Dev 2026 da Verzel**. Ela conecta organizadores, compradores e portarias em um fluxo atômico ponta a ponta:

```text
Catálogo  →  Reserva de Assento  →  Checkout Simulado  →  Ingresso HMAC  →  Portaria 4 Estados
 TMDb/TM       Postgres Lock         Aprovar / Recusar       Apple Pass        Leitor de Câmera
```

Cada etapa resolve um requisito do edital de forma intencional: catálogo importado via APIs externas, controle de concorrência com bloqueio exclusivo no PostgreSQL, ingressos com QR Code assinado criptograficamente na borda e validação óptica na entrada.

---

## 🔗 Aplicação no Ar

- 💻 **Ambiente de Produção:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)

---

## ⚡ Guia de Teste Rápido (3 Minutos)

Para testar todos os fluxos sem necessidade de cadastro, use o **alternador de personas** no topo da tela:

| Persona | E-mail de Teste | O que testar no fluxo |
| :--- | :--- | :--- |
| **Cliente** | `ana.cliente@verzel.com` | Seleção de assentos no mapa, simulação de pagamento (**Aprovar** e **Recusar**), zoom do QR Code, compartilhamento por link e exportação em PDF. |
| **Portaria** | `portaria@verzel.com` | Leitura de QR Code pela câmera ou digitação manual com retorno dos 4 estados (*Válido, Já Usado, Inválido e Show Errado*). |
| **Organizador** | `organizador@verzel.com` | Publicação de novos eventos e importação em lote via **TMDb (ao vivo)** e catálogo do **Ticketmaster**. |

---

## Por que o sistema foi desenhado assim

### O estado e as travas vivem no banco, não na memória

Soluções em memória falham em ambientes serverless distribuídos como o Cloudflare Workers.

O controle de concorrência é delegado ao PostgreSQL via Stored Procedure `reserve_ticket_atomic` com `SELECT ... FOR UPDATE ORDER BY id ASC`. A ordenação determinística de IDs previne deadlocks quando múltiplos compradores disputam lotes cruzados de assentos no mesmo milissegundo.

### O QR Code é assinado na borda via HMAC-SHA256

Em vez de trafegar identificadores abertos e facilmente forjáveis:

O Cloudflare Worker assina o payload do ingresso usando a **Web Crypto API** (`crypto.subtle`) com chave secreta no servidor. Na validação, a rota da portaria recomputa a assinatura criptográfica e invoca a Stored Procedure no banco de dados para checagem atômica de status e evento.

### Fuga do "AI Slop" — Design System Suíço / Apple Wallet

Interfaces com efeitos visuais exagerados e modais centrais flutuantes costumam quebrar a usabilidade em dispositivos móveis.

A aplicação adota uma estética minimalista em modo escuro (`#09090b`), bilhete digital em proporção 2:3 vertical (*Apple Wallet Pass*), números monoespaçados para assentos e **Mobile Bottom Sheets** que respeitam a safe-area do iOS sem sobreposição de teclado.

### Simulação explícita de aprovação e recusa

No modal de checkout, o usuário pode alternar entre **Simular Aprovação** e **Simular Recusa / Falha**:
- Na aprovação, o bilhete autenticado é emitido com QR Code e enviado em segundo plano por e-mail via Resend.
- Na recusa, a transação retorna `402 Payment Required` e executa a Stored Procedure `release_tickets_batch_atomic`, liberando imediatamente os assentos de volta ao catálogo.

---

## Stack Tecnológica

| Camada | Tecnologia | Justificativa |
| :--- | :--- | :--- |
| **Front-End** | React 18 + Vite + TypeScript + Tailwind CSS | Interface reativa, modular e tipada com componentes reutilizáveis. |
| **Back-End** | Node.js + Hono.js no Cloudflare Workers | Execução serverless na borda (Edge) com rotas modulares e Web Crypto API. |
| **Banco de Dados** | Supabase (PostgreSQL 15) | Stored Procedures PL/pgSQL, travas transacionais e RLS. |
| **Criptografia** | HMAC-SHA256 (Web Crypto API) | Assinatura nativa via Web Crypto API sem expor segredos no front-end. |
| **Leitura Óptica** | `html5-qrcode` + Web Audio API | Leitor contínuo de câmera com fallback manual e feedback sonoro. |
| **Testes & CI/CD** | Vitest + Playwright + GitHub Actions | Testes unitários, testes de concorrência e esteira automatizada. |

---

## Execução Local

### 1. Instalação

```bash
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev
npm install
```

### 2. Iniciar Servidores de Desenvolvimento

```bash
# Terminal 1 — Back-End (API local em http://localhost:8787)
npm run dev --prefix server

# Terminal 2 — Front-End (Vite em http://localhost:5173)
npm run dev --prefix client
```

### 3. Validação e Testes

```bash
# Checagem de tipos estrita (Client + Server)
npm run typecheck

# Testes unitários com Vitest
npm test

# Suíte de concorrência, caos e Red Team (18 cenários / 21 asserções)
node tests/qa_all_scenarios_suite.mjs
```

---

## Transparência no Uso de IA

O desenvolvimento utilizou IA como copiloto de engenharia para acelerar boilerplates de código, rotas do Hono.js e suítes de teste de estresse.

As decisões de arquitetura, o refinamento do design minimalista, o isolamento dos mapas de assentos, a escolha da Web Crypto API e as regras de bloqueio pessimista com ordenação no PostgreSQL foram desenhadas, conduzidas e validadas diretamente pelo desenvolvedor.

> 📄 Detalhes do processo e reflexões estão documentados em [`docs/AI_LOG.md`](docs/AI_LOG.md).

---

## Documentação de Apoio

- 📋 [Checklist de Requisitos do Edital](docs/CHECKLIST_ENTREGA.md)
- 🛡️ [Auditoria Técnica e Laudo de Testes](docs/REQUIREMENTS_AUDIT.md)
- 📜 [Edital do Desafio Elite Dev](docs/DESAFIO_ELITE_DEV_EDITAL.md)

---

Desenvolvido por **Rafael Lauri** para o **Desafio Elite Dev 2026 (Verzel)**.
