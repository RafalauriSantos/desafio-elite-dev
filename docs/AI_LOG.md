# Relatório de Transparência no Uso de IA (AI_LOG.md)

**Projeto:** Desafio Elite Dev 2026 (Verzel)  
**Candidato:** Rafael Lauri  
**Data:** Agosto / 2026  

---

## 🛠️ Ferramentas Utilizadas
- **Antigravity AI (Google DeepMind) / Claude:** Auxílio no planejamento de arquitetura, estruturação formal do PRD, geração de schema SQL base, diagramação do grafo de conhecimento (Graphify), automação de testes de concorrência e auditoria de requisitos do edital da Verzel.

---

## 🎯 Divisão de Responsabilidades

### 🤖 Gerado com Auxílio de IA:
- **Boilerplate e Tipagens Base:** Criação inicial dos arquivos de configuração (`wrangler.toml`, `package.json`, `vite.config.ts`, `tailwind.config.js`) e das interfaces TypeScript correspondentes às tabelas relacionais (`EventItem`, `SeatItem`, `TicketItem`).
- **Scripts de Automação de Testes de Caos:** Auxílio na estruturação dos 18 cenários da suíte de teste de concorrência massiva (`tests/qa_all_scenarios_suite.mjs`).
- **Pipeline CI/CD:** Configuração dos workflows do GitHub Actions com jobs encadeados para Gitleaks, TypeCheck, Vitest e deploy automatizado na Cloudflare.
- **Mapeamento do Grafo (Graphify):** Geração e indexação do "segundo cérebro" do projeto em 312 nós e 408 arestas interconectadas.

### ✋ Engenharia e Implementação Manual:
- **Trava de Concorrência Pessimista (`FOR UPDATE`):** Desenvolvimento da Stored Procedure em PL/pgSQL (`reserve_ticket_atomic`) com bloqueio ordenado de linha por ID (`ORDER BY id ASC`), eliminando deadlocks e duplas vendas em cenários de alta concorrência.
- **Assinatura Criptográfica HMAC-SHA256:** Criação do módulo `server/src/crypto.ts` usando a Web Crypto API para geração e conferência de assinaturas de ingressos na borda (Edge).
- **Validação de Entrada na Portaria:** Criação da função atômica `validate_ticket_gatekeeper` para tratamento dos 4 estados do edital (`VALID`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`) e defesa contra ataques de repetição (*Replay Attacks*).
- **Design System Editorial & Passe Digital:** Criação manual do design minimalista (*Anti-AI-Slop*) do ingresso digital em formato vertical (Swiss design / Apple Wallet Pass), eliminando ruídos visuais, refinando alinhamento A4 para PDF e ajustando hierarquia tipográfica.
- **Integração Real de E-mail via Resend:** Implementação do disparo assíncrono em segundo plano no Cloudflare Workers com `c.executionCtx.waitUntil(sendTicketEmail(...))`.
- **Isolamento de Inventário por Evento:** Garantia de particionamento estrito de assentos no banco e na API, evitando colisões de inventário entre eventos importados.
- **Camada de Resiliência Offline / Demo Mode:** Arquitetura de fallback inteligente no cliente React (`client/src/lib/api.ts`) permitindo a demonstração completa da aplicação mesmo em condições de oscilação de rede.
