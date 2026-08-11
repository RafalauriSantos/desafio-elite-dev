# 🎟️ Ticketing & Event Management Platform (Desafio Elite Dev)

Uma plataforma completa de alta performance para reserva de assentos em tempo real, venda de ingressos com validação anti-fraude via QR Code assinado por HMAC-SHA256 e controle de acesso portaria (Gatekeeper).

---

## 🏗️ Arquitetura do Sistema

A solução foi projetada para garantir **resiliência a alta concorrência (Race Conditions)**, **segurança em transações de ingressos** e **experiência fluida ao usuário (UI/UX de nível premium)**.

```
desafio-elite-dev/
├── .gitignore                 # Exclusões do Git na raiz
├── README.md                  # Documentação principal e defesa de decisões
├── docs/
│   ├── PRD.md                 # Especificação técnica e requisitos
│   └── AI_LOG.md              # Relatório transparente do uso de IA
├── supabase/
│   └── schema.sql             # SQL DDL, RLS, RPC (FOR UPDATE) e Seed
├── server/                    # Back-End (Cloudflare Workers + Hono.js)
│   ├── src/
│   │   ├── index.ts           # Endpoints da API e roteamento
│   │   └── crypto.ts          # Assinatura HMAC-SHA256 do QR Code
│   ├── wrangler.toml          # Configuração do Worker
│   └── package.json
└── client/                    # Front-End (React + Vite + Tailwind)
    ├── src/
    │   ├── components/        # SeatMap, QRScanner, CheckoutModal, TicketCard
    │   ├── pages/             # Catalog, EventDetails, MyTickets, Gatekeeper
    │   ├── lib/               # Clientes Supabase e API
    │   ├── App.tsx
    │   └── main.tsx
    └── package.json
```

---

## 🚀 Tecnologias Utilizadas & Defesa de Decisões

### 1. Back-End: Cloudflare Workers + Hono.js
- **Por quê Cloudflare Workers?** Execução Edge com latência ultrabaixa (< 20ms globalmente) e custo inicial zero para escalabilidade horizontal automática.
- **Por quê Hono.js?** Framework ultraleve para Edge Runtimes (TypeScript first, com footprint diminuto ~14KB, suporte nativo a Web Standards e excelente suporte a middlewares).

### 2. Banco de Dados: Supabase (PostgreSQL) + RPC (`FOR UPDATE`)
- **Prevenção de Race Conditions:** Em eventos com alta demanda, múltiplos usuários tentam selecionar o mesmo assento simultaneamente.
- **Solução (Pessimistic Locking):** Função RPC em PL/pgSQL `reserve_seat_with_lock` executando `SELECT ... FOR UPDATE` com expiração de trava temporária (ex: 10 minutos). Se o assento estiver ocupado ou bloqueado por outra reserva ativa, o banco recusa a transação imediatamente com garantia ACID.

### 3. Validação de Acesso Anti-Fraude: HMAC-SHA256
- **Problema de QR Codes Estáticos:** QR Codes simples sem assinatura podem ser facilmente alterados, clonados ou forjados.
- **Solução:** O QR Code contém uma carga assinada digitalmente no servidor contendo `{ ticketId, eventId, seatId, timestamp, nonce, hash }`. O servidor valida a assinatura com chave secreta HMAC-SHA256 e impede reuso (double-entry).

### 4. Front-End: React 18 + Vite + Tailwind CSS + Glassmorphism UX
- **SeatMap Interativo:** Grid visual dinâmico com indicação de assentos disponíveis, selecionados, bloqueados e reservados.
- **Gatekeeper Scanner:** Leitor de QR Code integrado com câmera via biblioteca web canvas e validador de entrada em tempo real.
- **Design System:** Tema escuro futurista com acentos dinâmicos (violeta neon / esmeralda), blur glassmorphic e micro-animações.

---

## 🛠️ Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js >= 18.x
- npm ou pnpm

### 1. Configurar e Executar o Servidor (Back-End)
```bash
cd server
npm install
npm run dev
```

### 2. Configurar e Executar o Cliente (Front-End)
```bash
cd client
npm install
npm run dev
```
Acesse `http://localhost:5173` no seu navegador.

### 3. Banco de Dados (Supabase)
Execute as instruções SQL em `supabase/schema.sql` no SQL Editor do seu projeto Supabase ou ambiente local PostgreSQL.

---

## 📄 Documentação Detalhada
- [Especificação Técnica & PRD](docs/PRD.md)
- [Relatório do uso de IA (AI_LOG)](docs/AI_LOG.md)
