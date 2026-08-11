# Product Requirements Document (PRD)

**Projeto:** Plataforma de Eventos e Ingressos — Desafio Elite Dev 2026 (Verzel)  
**Status:** Em Desenvolvimento  
**Versão:** 1.0.0  
**Stack:** React + Vite (Cloudflare Pages) | Node.js + Hono (Cloudflare Workers) | Supabase (PostgreSQL, Auth, RLS, RPC)  

---

## 1. Visão Geral do Produto
Plataforma end-to-end para publicação de eventos, escolha de assentos numerados em tempo real, compra simulada de ingressos com QR Code assinado criptograficamente (HMAC-SHA256) e validação de acesso na portaria via câmera do dispositivo ou digitação manual.

---

## 2. Papéis e Autenticação (Roles)
- **Organizador (`organizer`):** Cria e gerencia eventos, podendo sincronizar títulos via APIs externas (TMDb / Ticketmaster) e acompanhar taxa de ocupação.
- **Cliente (`client`):** Navega pelo catálogo, seleciona assentos no mapa interativo, efetua checkout simulado, visualiza e compartilha ingressos com QR Code.
- **Portaria (`gatekeeper`):** Lê e valida ingressos na entrada via câmera ou código manual, impedindo fraudes e entradas duplicadas.

---

## 3. Requisitos Funcionais (RF)
- **RF-01 (API Externa):** Importação dinâmica de filmes (TMDb) e shows (Ticketmaster).
- **RF-02 (Navegação):** Catálogo/Feed de eventos com busca por nome/local e filtros por categoria.
- **RF-03 (Reserva & Assentos):** Mapa de assentos interativo por categorias (VIP, Premium, Standard) com trava atômica otimista/pessimista no banco via `SELECT ... FOR UPDATE` (retenção de 10 minutos).
- **RF-04 (Checkout Simulado):** Simulação de confirmação e recusa de pagamento.
- **RF-05 (Ingressos & QR Code):** Geração de hash infalsificável via HMAC-SHA256 e link público de compartilhamento do ingresso.
- **RF-06 (Portaria):** Leitor de câmera/código manual com máquina de estados de validação (`VÁLIDO`, `JÁ UTILIZADO`, `ASSINATURA INVÁLIDA/FORJADO`, `EVENTO ERRADO`).

---

## 4. Requisitos Não Funcionais (RNF)
- **RNF-01 (Prevenção de Dupla Venda):** Garantia ACID e trava exclusiva `SELECT ... FOR UPDATE` no banco relacional via Stored Procedure `reserve_ticket_atomic`.
- **RNF-02 (Segurança RLS):** Políticas de Row Level Security (RLS) habilitadas no Supabase.
- **RNF-03 (Execução Edge):** Deploy do Back-End via Cloudflare Workers (Hono.js) com latência < 20ms e Front-End no Cloudflare Pages.
- **RNF-04 (Resiliência Offline/Demo):** Fallback local transparente no cliente para exibição funcional mesmo sem conexão com o servidor.

---

## 5. Arquitetura de Concorrência & Banco de Dados
A Stored Procedure `reserve_ticket_atomic` bloqueia exclusivamente a linha do assento:
1. Executa `SELECT * FROM seats WHERE id = p_seat_id FOR UPDATE`.
2. Se o status for `sold` ou `locked` (dentro da janela de 10 min), rejeita com erro `409 Conflict`.
3. Se `available`, atualiza o status para `locked` e vincula ao comprador.

---

## 6. Mapa de Exceções

| Código | Diagnóstico | Resposta ao Usuário | Ação do Sistema |
|---|---|---|---|
| `SEAT_ALREADY_SOLD` | Assento já vendido. | "Este assento já foi vendido." | Recusa transação e atualiza mapa. |
| `SEAT_LOCKED_BY_OTHER` | Retido por outro usuário. | "Assento em processo de checkout por outro comprador." | Aguarda expiração (10 min). |
| `HMAC_SIGNATURE_INVALID` | Hash HMAC incompatível. | "QR Code Inválido / Assinatura Forjada!" | Nega entrada e alerta portaria. |
| `TICKET_ALREADY_USED` | Ingresso com status `used`. | "Ingresso já utilizado às HH:MM:SS." | Bloqueia entrada dupla (Double-Entry). |
