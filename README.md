# 🎟️ Elite Tickets — Plataforma de Eventos e Ingressos

Olá! Eu sou o **Rafael** e este é o projeto que desenvolvi para o **Desafio Elite Dev 2026 da Verzel**.

A proposta foi criar uma plataforma de ponta a ponta para publicação de eventos, reserva de assentos com prevenção real de dupla venda no banco de dados, checkout simulado, ingressos com QR Code assinado criptograficamente e validação rápida na portaria.

---

## 🔗 Aplicação no Ar

- 💻 **Acesse aqui:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)

---

## ⚡ Como Testar (Sem Cadastro)

Para que você possa avaliar todos os fluxos rapidamente sem perder tempo preenchendo cadastros, criei um **alternador de personas no topo da tela**:

| Persona | E-mail de Teste | O que você pode testar |
| :--- | :--- | :--- |
| **Cliente** | `ana.cliente@verzel.com` | Escolher assentos no mapa, simular o pagamento (Aprovado ou Recusado), ampliar o QR Code, salvar em PDF e compartilhar o link. |
| **Portaria** | `portaria@verzel.com` | Ler o QR Code pela câmera ou digitar o código manualmente para ver a máquina de 4 estados em tempo real (*Válido, Já Usado, Inválido e Evento Errado*). |
| **Organizador** | `organizador@verzel.com` | Criar novos eventos ou importar atrações em lote direto da API do **TMDb (ao vivo)** e do catálogo do **Ticketmaster**. |

---

## 🧠 Como Pensei a Arquitetura e as Telas

### 1. Fugindo do "AI Slop" no Design
Eu não queria entregar aquela interface escura genérica cheia de luzes piscando e modais que quebram no celular. 
- **O que escolhi:** Um visual limpo e minimalista (*Swiss Design / Apple Wallet Pass*), com tipografia legível, fundo escuro sólido (`#09090b`), números monoespaçados para assentos e códigos, e **Mobile Bottom Sheets** que sobem suavemente na tela do celular sem que o teclado tampe os botões.
- **O Ingresso:** O passe digital foi desenhado em proporção 2:3 vertical, com QR Code de alto contraste para leitura instantânea na catraca e botão de download/impressão centralizado em PDF A4.

### 2. Concorrência Real no Banco (Sem atalhos em memória)
Controlar reservas apenas na memória do Node.js falharia em qualquer ambiente distribuído ou serverless.
- **Minha decisão:** Criei uma Stored Procedure no PostgreSQL (`reserve_ticket_atomic`) usando `SELECT ... FOR UPDATE ORDER BY id ASC`. 
- **Por que ordenar por ID?** Porque se dois clientes tentarem comprar lotes de assentos cruzados ao mesmo tempo, a ordenação determinística dos IDs evita deadlocks no banco de dados e garante que o segundo cliente receba um erro amigável na hora.

### 3. QR Code com Assinatura HMAC-SHA256
Para garantir que ninguém consiga forjar um ingresso ou trocar o número do assento no payload:
- **Minha decisão:** O servidor assina os dados do bilhete usando **HMAC-SHA256** com a **Web Crypto API** nativa do Cloudflare Workers. Na entrada, a portaria recalcula o hash e valida o bilhete no banco de forma atômica.

### 4. Checkout com Aprovação e Recusa Explícitas
O edital pedia para contemplar tanto a confirmação quanto a recusa:
- No modal de pagamento, incluí botões para **Simular Aprovação** e **Simular Recusa / Falha**.
- Quando o pagamento é recusado, o sistema avisa o motivo da recusa e a Stored Procedure `release_tickets_batch_atomic` devolve imediatamente os assentos de volta ao catálogo.

---

## 🚫 O Que Deixei de Fora e Por Quê

Seguindo a orientação do edital de manter o foco no essencial e bem-feito:
- **Nota Fiscal e Revenda P2P:** Descartei por complexidade fora do escopo do teste.
- **Aplicativo Nativo:** Optei por fazer uma Web App responsiva com suporte a toques e safe-area do iOS, rodando liso no próprio navegador sem exigir download.
- **Pagamento Real:** Mantive a cobrança simulada com cenários determinísticos para facilitar os testes da banca.

---

## 🤖 Minha Relação com a IA Neste Projeto

Como o edital valoriza a transparência, deixo registrado exatamente como trabalhei:

- **Onde usei IA:** Usei IA como copiloto para acelerar a criação de componentes React, rotas do Hono.js e montar a suíte de testes de estresse.
- **O que foi decisão minha:**
  - Definir a paleta e limpar o design para não parecer "gerado por máquina".
  - Identificar que os eventos estavam compartilhando o mesmo mapa de assentos e forçar o isolamento por ID de evento.
  - Exigir a trava pessimista com ordenação no PostgreSQL em vez de concorrência em memória.
  - Escolher a Web Crypto API para assinar o HMAC na borda com latência mínima.

> 📄 Caso queira ver mais reflexões sobre o processo, deixei um diário em [`docs/AI_LOG.md`](docs/AI_LOG.md).

---

## 🛠️ Tecnologias Utilizadas

- **Front-End:** React 18, Vite, TypeScript, Tailwind CSS, Lucide Icons, `html5-qrcode`, `qrcode.react`.
- **Back-End:** Node.js, Hono.js rodando no Cloudflare Workers (Edge).
- **Banco de Dados:** PostgreSQL (Supabase) com Stored Procedures PL/pgSQL e RLS.
- **Criptografia:** HMAC-SHA256 com Web Crypto API.
- **Testes & CI/CD:** Vitest, Playwright, GitHub Actions.

---

## 🚀 Como Rodar Localmente

### 1. Clonar e Instalar
```bash
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev
npm install
```

### 2. Rodar a Aplicação
```bash
# Terminal 1 — Back-End (API local em http://localhost:8787)
npm run dev --prefix server

# Terminal 2 — Front-End (Interface em http://localhost:5173)
npm run dev --prefix client
```

### 3. Rodar os Testes
```bash
# Validação de tipos TypeScript
npm run typecheck

# Testes unitários Vitest
npm test

# Teste de concorrência e estresse (18 cenários / 21 asserções)
node tests/qa_all_scenarios_suite.mjs
```

---

## 📚 Documentação de Apoio

Se quiser aprofundar nos detalhes técnicos e de especificação:
- 📋 [Checklist de Requisitos do Edital](docs/CHECKLIST_ENTREGA.md)
- 🛡️ [Auditoria Técnica e Laudo de Testes](docs/REQUIREMENTS_AUDIT.md)
- 🤖 [Registro de Uso de IA](docs/AI_LOG.md)
- 📜 [Edital do Desafio](docs/DESAFIO_ELITE_DEV_EDITAL.md)

---

Obrigado pelo tempo de vocês avaliando meu código! Qualquer dúvida, estou 100% à disposição.
