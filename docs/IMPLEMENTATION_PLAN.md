# Plano de Implementação — Abordagem Evaluator-First (Desafio Elite Dev 2026)

**Base:** Requisitos oficiais da Verzel + Auditoria de Avaliação Técnica  
**Filosofia:** *Zero Atrito para a Banca + Máxima Solidez de Engenharia de Software*

---

## 🎯 Visão Estratégica da Avaliação
A banca avaliadora possui entre 3 e 5 minutos para testar a aplicação de ponta a ponta. O projeto deve permitir que o avaliador execute toda a jornada (**Navegar ➔ Reservar Assento ➔ Pagar/Recusar ➔ Emitir Ingresso HMAC ➔ Validar na Portaria**) sem barreiras de login frustrantes ou necessidade de múltiplos logouts.

---

## 🗺️ As 6 Fases de Execução

### Fase 1 — Experiência do Avaliador & Persona Switcher (UX Pro Max)
**Objetivo:** Permitir que a banca teste todos os 3 papéis do edital com 1 clique, sem bloquear as telas.

- [x] **Header com Seletor de Persona:** Seletor visual no topo (`Ana - Cliente`, `Carlos - Organizador`, `Roberto - Portaria`).
- [x] **Navegação Fluida e Aberta:** Todas as abas essenciais visíveis para testes rápidos (**Eventos**, **Meus Ingressos**, **Portaria** e **Painel do Organizador**).
- [x] **Auth Supabase Híbrido:** O botão de "Entrar / Cadastro" permanece ativo para demonstrar o Supabase Auth real, mas sem bloquear a navegação livre de quem está avaliando.

### Fase 2 — Concorrência Pessimista & Assentos Numerados
**Objetivo:** Proteger a integridade transacional contra dupla venda de ingressos.

- [x] **Mapa de Assentos Interativo:** Seleção de poltronas organizadas por fileiras A–D com cálculo de valor em lote.
- [x] **Procedimento Atômico no Postgres:** Stored Procedure `reserve_tickets_batch_atomic` com bloqueio exclusivo de linha (`SELECT ... FOR UPDATE ORDER BY 1 ASC`) evitando deadlocks e race conditions.
- [x] **Checkout Simulado Aprovado e Recusado:**
  - **Aprovado:** Executa `complete_checkout_batch_atomic`, marca assentos como `sold` e emite ingressos.
  - **Recusado:** Executa `release_tickets_batch_atomic`, liberando imediatamente os assentos de volta para o catálogo.

### Fase 3 — Ingressos Anti-Fraude & Formato Apple Wallet
**Objetivo:** Emissão de bilhetes infalsificáveis e visualmente impecáveis.

- [x] **Assinatura HMAC-SHA256:** Servidor gera hash assinado via Web Crypto API combinando ID do ingresso, evento, assento e chave secreta.
- [x] **Design Apple Wallet Pass:** Passe vertical minimalista com referência mascarada (`REF: #7361-5E6D`), QR Code vetorial nítido e botão de impressão/PDF.
- [ ] **Link Público de Compartilhamento (`/ticket/:id`):** Endpoint que carrega os dados diretamente do backend/banco de dados, funcionando em qualquer navegador ou dispositivo móvel sem depender de `localStorage`.

### Fase 4 — Portaria & Máquina de 4 Estados (Gatekeeper)
**Objetivo:** Validação atômica e em tempo real na entrada do evento.

- [x] **Leitor de Câmera & Digitação Manual:** Leitor contínuo `html5-qrcode` com suporte a câmeras traseira/frontal e fallback para digitação de código.
- [x] **Máquina de 4 Estados do Edital:**
  - 🟢 `VALID` (Acesso Liberado + Vibração Háptica `80ms`).
  - 🟡 `ALREADY_USED` (Ingresso Já Utilizado — Prevenção de Dupla Entrada).
  - 🔴 `INVALID` (Assinatura Adulterada / QR Code Forjado).
  - 🔵 `WRONG_EVENT` (Ingresso Válido, mas Pertencente a Outro Evento).
- [x] **Menu de Testes Rápidos do Edital:** Botões pré-programados para a banca disparar e validar os 4 cenários em menos de 10 segundos.

### Fase 5 — Catálogo Externo & Gestão do Organizador
**Objetivo:** Cumprir o requisito de catálogo externo e publicação de eventos.

- [x] **Catálogo Externo TMDb & Ticketmaster:** Integração com catálogo de filmes e shows, com fallback inteligente para 24 atrações curadas.
- [x] **Importação em Lote pelo Organizador:** Modal com seleção múltipla por checkboxes para publicar eventos com data, local e capacidade definidos.

### Fase 6 — Roteiro de Avaliação de 3 Minutos & Documentação Final
**Objetivo:** Guiar o avaliador com clareza cristalina no README e na documentação.

- [ ] **Roteiro de 3 Minutos no README:** Passo a passo mastigado para a banca testar o fluxo completo em 180 segundos.
- [ ] **Garantia de CI/CD Verde:** Todos os testes unitários (`Vitest`), testes de tipos (`TypeScript`) e automação E2E (`Playwright`) passando com 100% de sucesso.
- [ ] **Atualização do AI_LOG.md e Grafo de Conhecimento:** Registro formal de transparência e arquitetura.
