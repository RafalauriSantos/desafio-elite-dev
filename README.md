# 🎟️ Elite Tickets — Plataforma de Eventos e Ingressos

Aplicação desenvolvida para o **Desafio Elite Dev (Verzel)**. Permite a publicação de eventos por organizadores (integrado a catálogos externos), seleção de assentos em tempo real com bloqueio de concorrência, checkout simulado, emissão de bilhetes digitais com QR Code criptografado (HMAC-SHA256) e validação na portaria.

---

## 🔗 Links do Projeto no Ar

- 💻 **Aplicação Web:** [https://elite-tickets.pages.dev](https://elite-tickets.pages.dev)
- ⚙️ **API Serverless:** [https://elite-tickets-api.agenddar.workers.dev](https://elite-tickets-api.agenddar.workers.dev)
- 📦 **Repositório GitHub:** [https://github.com/RafalauriSantos/desafio-elite-dev](https://github.com/RafalauriSantos/desafio-elite-dev)

---

## ⚡ Como Avaliar em 2 Minutos

Para facilitar a correção sem necessidade de login manual, use o **seletor de personas** no topo da tela:

1. **🎟️ Como Cliente:**
   - Escolha qualquer evento no catálogo e clique em **"Ver assentos"**.
   - Selecione poltronas no mapa e clique em **"Ir para Pagamento"**.
   - No modal de checkout, escolha **"Aprovado"** para gerar o ingresso com QR Code (ou **"Recusado"** para ver o assento voltar ao estoque imediatamente).
2. **🛡️ Como Portaria:**
   - Acesse a aba **"Portaria"**.
   - Aponte a câmera para o QR Code emitido (ou use a digitação manual).
   - O sistema valida na hora: `Válido`, `Já Utilizado`, `Inválido` ou `Evento Errado`, com retorno de vibração no smartphone.
3. **🎪 Como Organizador:**
   - Alterne a persona para **"Organizador"**.
   - Clique em **"Publicar evento"** e importe atrações direto da API do **TMDb** ou catálogo curado.

---

## 🧠 Decisões Técnicas de Engenharia

- **Por que Cloudflare Workers + Hono.js no Back-End?**
  Optamos por uma arquitetura Edge Serverless para garantir resposta sub-50ms e deploy global sem custos de infraestrutura ociosa.
- **Por que `SELECT ... FOR UPDATE` no Postgres?**
  Para resolver a concorrência na raiz. A reserva é processada via Stored Procedure atômica com ordenação de IDs (`ORDER BY id ASC`), impedindo dupla venda e deadlocks mesmo sob requisições simultâneas.
- **Por que HMAC-SHA256 no QR Code?**
  O QR Code não guarda apenas um ID simples; ele carrega uma assinatura criptográfica gerada no servidor via Web Crypto API, impedindo forja ou adulteração de dados.
- **Por que Design Minimalista (Swiss Design)?**
  Fugimos de interfaces genéricas com excesso de gradientes e efeitos desnecessários (*AI Slop*). O bilhete foi desenhado no padrão Apple Wallet / editorial suíço, focado na clareza para leitura rápida na portaria e com impressão perfeita em PDF A4.
- **Envio Real de E-mails:**
  Integração em segundo plano com a API do **Resend** para entrega assíncrona da confirmação sem travar o tempo de resposta do checkout.

---

## 🛠️ Stack Tecnológica

- **Front-End:** React, Vite, TypeScript, Tailwind CSS, Lucide Icons, `qrcode.react`, `html5-qrcode`.
- **Back-End:** TypeScript, Hono.js, Cloudflare Workers Runtime, Web Crypto API.
- **Banco de Dados:** PostgreSQL (Supabase) com Stored Procedures em PL/pgSQL e Row Level Security (RLS).
- **Testes & CI/CD:** Vitest, Playwright (E2E), Gitleaks e GitHub Actions com deploy automático.

---

## 🚀 Como Executar Localmente

### 1. Clonar e Instalar Dependências
```bash
git clone https://github.com/RafalauriSantos/desafio-elite-dev.git
cd desafio-elite-dev
npm install
```

### 2. Rodar a Aplicação
```bash
# Iniciar o Front-End
cd client && npm run dev

# Iniciar a API Localmente
cd server && npm run dev
```

### 3. Rodar os Testes
```bash
npm run typecheck    # Verificação estrita de TypeScript
npm run test         # Testes unitários (Client + Server)
npm run test:e2e     # Testes E2E com Playwright
```

---

## 📚 Documentação Adicional

- 📜 **Enunciado Original da Verzel:** [`docs/DESAFIO_ELITE_DEV_EDITAL.md`](docs/DESAFIO_ELITE_DEV_EDITAL.md)
- 📋 **Checklist de Itens Entregues:** [`docs/CHECKLIST_ENTREGA.md`](docs/CHECKLIST_ENTREGA.md)
- 🤖 **Transparência no Uso de IA:** [`docs/AI_LOG.md`](docs/AI_LOG.md)
- 🧭 **Grafo de Arquitetura (Graphify):** [`graphify-out/GRAPH_REPORT.md`](graphify-out/GRAPH_REPORT.md)
