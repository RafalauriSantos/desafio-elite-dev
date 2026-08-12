# Product Requirements Document (PRD)

**Projeto:** Plataforma de Eventos e Ingressos — Desafio Elite Dev 2026 (Verzel)  
**Status:** Concluído & Implantado em Produção  
**Versão:** 2.0.0  
**Stack:** React 18 + Vite (Cloudflare Pages) | Node.js + Hono (Cloudflare Workers) | Supabase (PostgreSQL, Auth, RLS, RPC) | GitHub Actions CI/CD  

---

## 1. Visão Geral do Produto
Plataforma end-to-end para publicação de eventos (com importação em lote das APIs do TMDb e Ticketmaster), escolha de assentos numerados em tempo real com concorrência pessimista, checkout simulado, emissão de ingressos digitais em formato **Apple Wallet Pass** com QR Code criptografado (HMAC-SHA256) e validação de acesso na portaria via câmera do dispositivo ou digitação manual com retorno háptico.

---

## 2. Papéis e Autenticação (Roles)
- **Organizador (`organizer`):** Publica eventos individualmente ou via importação em lote com checkboxes de atração do catálogo TMDb/Ticketmaster (24 atrações curadas).
- **Cliente (`client`):** Navega pelo catálogo, seleciona múltiplos assentos no mapa interativo com exibição de letras de fileira (A, B, C, D), efetua reserva e checkout em lote, visualiza e compartilha passes digitais.
- **Portaria (`gatekeeper`):** Lê e valida ingressos na entrada via câmera ou código manual com máquina de 4 estados, retorno vibratório háptico e menu retrátil de testes do edital.

---

## 3. Requisitos Funcionais (RF)
- **RF-01 (API Externa & Importação em Lote):** Importação dinâmica de filmes (TMDb) e shows (Ticketmaster) com seleção múltipla por checkboxes (`POST /api/events/bulk-import`).
- **RF-02 (Navegação & UI Apple):** Catálogo/Feed de eventos com busca instantânea, visualização minimalista monocromática e botões de ação contrastados.
- **RF-03 (Reserva em Lote & Assentos):** Mapa de assentos interativo com suporte a seleção múltipla, cálculo de total acumulado e trava atômica no banco via `SELECT ... FOR UPDATE ORDER BY id ASC` (`reserve_tickets_batch_atomic`).
- **RF-04 (Checkout Mobile Bottom Sheet):** Interface otimizada em Bottom Sheet para dispositivos móveis com suporte a `env(safe-area-inset-bottom)` e atributos de teclado (`inputMode="email"`, `autoComplete`, `autoCapitalize`).
- **RF-05 (Passes Digitais Apple Wallet):** Geração de hash infalsificável via HMAC-SHA256, máscara de referência legível `REF: #7361-5E6D`, exportação em PDF vertical `100mm x 160mm` e sincronização com Google Calendar.
- **RF-06 (Portaria Háptica & 4 Estados):** Leitor de câmera/código manual com máquina de estados de validação (`VALID`, `ALREADY_USED`, `INVALID`, `WRONG_EVENT`), vibração háptica (`navigator.vibrate?.()`) e seletor retrátil de avaliação.

---

## 4. Requisitos Não Funcionais (RNF)
- **RNF-01 (Prevenção de Dupla Venda & Deadlocks):** Garantia ACID e trava exclusiva `SELECT ... FOR UPDATE ORDER BY id ASC` no banco relacional via Stored Procedure `reserve_tickets_batch_atomic`.
- **RNF-02 (Segurança RLS & Anti-Vazamento):** Políticas de Row Level Security (RLS) habilitadas no Supabase e varredura automatizada com Gitleaks (`.gitleaks.toml`).
- **RNF-03 (Execução Edge & Latência):** Deploy do Back-End via Cloudflare Workers (Hono.js) com latência < 20ms e Front-End no Cloudflare Pages (`https://elite-tickets.pages.dev`).
- **RNF-04 (Esteira CI/CD Estrita):** Pipeline no GitHub Actions executando 4 jobs encadeados: `security-audit`, `type-check`, `test-suite` (Vitest + Playwright E2E) e `deploy-production`.
- **RNF-05 (Resiliência Offline/Demo):** Fallback local transparente no cliente para exibição funcional mesmo sem conexão ativa com o servidor.

---

## 5. Arquitetura de Concorrência & Banco de Dados
A Stored Procedure `reserve_tickets_batch_atomic` bloqueia exclusivamente o lote de assentos selecionados:
1. Executa `SELECT * FROM seats WHERE id = v_seat_id FOR UPDATE` ordenado por `id ASC`.
2. Se o status for `sold` ou `locked` (dentro da janela de 10 min), lança exceção com erro `409 Conflict`.
3. Se `available`, atualiza o status para `locked` e vincula ao e-mail do comprador.

---

## 6. Mapa de Exceções & Retorno Háptico

| Código | Diagnóstico | Resposta ao Usuário | Feedback Háptico |
|---|---|---|---|
| `VALID` | Assinatura HMAC válida e bilhete ativo. | "ENTRADA LIBERADA! Ingresso autêntico." | `navigator.vibrate?.([80])` (1 pulso) |
| `ALREADY_USED` | Ingresso com status `used`. | "INGRESSO JÁ UTILIZADO! Entrada recusada." | `navigator.vibrate?.([100, 50, 100])` |
| `INVALID` | Hash HMAC incompatível ou alterada. | "ASSINATURA INVÁLIDA! QR Code forjado." | `navigator.vibrate?.([100, 50, 100])` |
| `WRONG_EVENT` | Pertence a outro espetáculo. | "INGRESSO DE OUTRO EVENTO!" | `navigator.vibrate?.([100, 50, 100])` |
