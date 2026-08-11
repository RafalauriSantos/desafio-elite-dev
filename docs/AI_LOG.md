# Relatório de Transparência no Uso de IA (AI_LOG.md)

**Projeto:** Desafio Elite Dev 2026 (Verzel)  
**Candidato:** Rafa  
**Data:** Agosto / 2026  

---

## 🛠️ Ferramentas Utilizadas
- **Gemini / Claude / Antigravity AI:** Auxílio no planejamento de arquitetura, estruturação formal do PRD, geração de schema SQL base, diagramação de grafo de conhecimento (Graphify) e acompanhamento passo a passo.

---

## 🎯 Divisão de Responsabilidades

### 🤖 Gerado com Auxílio de IA:
- Boilerplate inicial dos arquivos de configuração (`wrangler.toml`, `package.json`, `vite.config.ts`, `tailwind.config.js`).
- Definição dos tipos TypeScript (`EventItem`, `SeatItem`, `TicketItem`, `TicketPayload`) a partir do schema relacional.
- Estruturação das tabelas DDL e definições de chaves estrangeiras.
- Mapeamento e exportação do Grafo de Conhecimento para o Obsidian via Graphify (144 notas interconectadas).

### ✋ Engenharia e Implementação Manual:
- **Trava de Concorrência (`FOR UPDATE`):** Criação da Stored Procedure em PL/pgSQL (`reserve_ticket_atomic`) com bloqueio exclusivo de linha no assento para eliminar dupla venda em cenários de tráfego intenso.
- **Assinatura Criptográfica HMAC-SHA256:** Implementação no módulo `server/src/crypto.ts` via Web Crypto API para geração e verificação infalsificável do QR Code.
- **Validação de Entrada na Portaria:** Stored Procedure `validate_ticket_gatekeeper` para verificação atômica de integridade, atualização do estado do ingresso para `used` e prevenção de reuso (Double-Entry Protection).
- **Políticas RLS no Supabase:** Escrita das políticas de Row Level Security para isolamento e proteção dos dados por perfil (Organizador, Cliente, Portaria).
- **Decisão Arquitetural Edge First:** Definição da stack com execução na borda via Cloudflare (Pages + Workers) garantindo respostas com latência ultrabaixa (< 50ms).
- **Resiliência Offline / Demo Mode:** Camada de fallback inteligente no cliente React (`client/src/lib/api.ts`) permitindo a demonstração completa da aplicação mesmo sem conexão ao servidor.
