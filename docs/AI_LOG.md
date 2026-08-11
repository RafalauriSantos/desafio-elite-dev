# Relatório Transparente do Uso de IA (AI_LOG.md)

## 1. Visão Geral e Filosofia de Colaboração
Este documento registra de forma transparente o uso de Assistentes de Inteligência Artificial (Google Gemini / ChatGPT) como parceiros de decisão arquitetural, geração de código base e refinamento de segurança no desenvolvimento do **Desafio Elite Dev**.

---

## 2. Decisões Arquiteturais Co-desenhadas com a IA

### 2.1 Prevenção de Dupla Venda (PL/pgSQL `FOR UPDATE`)
- **Discussão:** Avaliação entre locks de aplicação (Redis) vs. travas nativas de banco de dados (PostgreSQL `SELECT ... FOR UPDATE`).
- **Decisão:** Opção pela Stored Procedure atômica `reserve_ticket_atomic` no Supabase para garantir isolamento ACID estrito com overhead mínimo de infraestrutura.

### 2.2 Assinatura Digital de QR Code via Web Crypto API (HMAC-SHA256)
- **Discussão:** Definir formato do QR Code resistente a forjamento e engenharia reversa sem depender de pacotes pesados como `crypto-js`.
- **Decisão:** Utilização nativa do `crypto.subtle` da Web Crypto API para geração de assinatura HMAC-SHA256 combinando `ticket_id`, `event_id`, `client_id` e a chave secreta `HMAC_SECRET`.

### 2.3 Framework Edge (Hono.js no Cloudflare Workers)
- **Discussão:** Comparação entre Express.js em Serverless Tradicional e Hono.js no Cloudflare Workers.
- **Decisão:** Escolha do Hono.js por conta da execução Edge global (< 20ms de latência), ausência de cold starts e suporte nativo às Web Standards.

---

## 3. Registro de Prompting e Implementações Manuais

1. **Geração da Estrutura SQL DDL e Stored Procedures:**
   - IA gerou o schema inicial com RLS e a Stored Procedure `reserve_ticket_atomic`.
   - Ajuste manual: Inclusão da procedure `validate_ticket_gatekeeper` para garantir atualização atômica do estado do ingresso e registro do `used_at`.

2. **Criação do Servidor Hono (`server/src/index.ts`):**
   - IA auxiliou na estruturação dos endpoints REST.
   - Ajuste manual: Implementação do suporte a importação de catálogo (TMDb / Ticketmaster) e rotas dedicadas à portaria.

3. **Front-End React + Tailwind CSS:**
   - IA construiu a hierarquia de componentes (`SeatMap`, `CheckoutModal`, `TicketCard`, `QRScanner`).
   - Ajuste manual: Adição do modo de demonstração local com fallback gracioso em caso de ausência de conexão com o banco de dados.
