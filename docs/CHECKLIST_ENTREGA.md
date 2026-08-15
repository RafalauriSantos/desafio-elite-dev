# 📋 Checklist de Entrega — Desafio Elite Dev

Este documento resume a correspondência entre o que o edital da Verzel pediu e o que foi implementado na plataforma **Elite Tickets**.

---

## 🎯 1. Requisitos do Edital vs. Implementação

| Requisito do Edital | O que foi Entregue | Arquivo / Módulo Principal |
| :--- | :--- | :--- |
| **Busca e navegação no catálogo** | Catálogo em tempo real com busca por texto e filtro de categorias | `client/src/pages/Catalog.tsx` |
| **Criação e gestão de eventos** | Modal de publicação com importação de dados externos | `client/src/components/OrganizerModal.tsx` |
| **Importação de catálogo externo** | Integração com a API do **TMDb** e catálogo curado de 24 atrações | `server/src/index.ts` |
| **Reserva por mapa de assentos** | Mapa interativo com 80 assentos particionados por evento | `client/src/components/SeatMap.tsx` |
| **Prevenção de dupla venda** | Stored Procedure com `SELECT ... FOR UPDATE ORDER BY id ASC` | `supabase/schema.sql` |
| **Checkout simulado** | Confirmação e recusa com devolução imediata do assento ao estoque | `client/src/components/CheckoutModal.tsx` |
| **Meus Ingressos com QR** | Carteira de ingressos com QR Code de alta densidade | `client/src/pages/MyTickets.tsx` |
| **QR Code infalsificável** | Assinatura HMAC-SHA256 gerada no servidor com chave secreta | `server/src/crypto.ts` |
| **Compartilhar ingresso por link** | Link direto (`?ticket=UUID`) com visualização pública sem login | `server/src/index.ts` |
| **Tela de portaria (4 estados)** | Validação atômica de `Válido`, `Já Usado`, `Inválido` e `Show Errado` | `client/src/pages/Gatekeeper.tsx` |
| **Scanner por câmera e manual** | Leitor via câmera (`html5-qrcode`) e formulário com teclado | `client/src/components/QRScanner.tsx` |
| **Autenticação com 3 papéis** | Suporte a `Organizador`, `Cliente` e `Portaria` com RBAC | `server/src/index.ts` |
| **Deploy em produção** | Front-End na Cloudflare Pages e API no Cloudflare Workers | [elite-tickets.pages.dev](https://elite-tickets.pages.dev) |

---

## 🚀 2. Entregas Extras de Engenharia (Overdelivery)

1. **Passe Digital no Padrão Suíço (Apple Wallet Pass):** Bilhete vertical (proporção 2:3), sem poluição visual e com centralização para impressão em PDF A4.
2. **Envio Real de E-mails (Resend API):** Disparo assíncrono em segundo plano (`c.executionCtx.waitUntil`) com template HTML idêntico ao bilhete.
3. **Retorno Háptico na Portaria:** O leitor vibra o celular fisicamente para indicar aprovação (`[80ms]`) ou recusa.
4. **Persona Switcher:** Alternador no topo da tela para a banca testar as 3 jornadas sem fricção de login.
5. **Suíte de Testes de Concorrência e Caos:** 21 testes automatizados cobrindo tentativas de compra simultânea, injeção de payload e ataque de repetição.
6. **Esteira CI/CD no GitHub Actions:** 4 estágios automatizados (Gitleaks, TypeScript Typecheck, Vitest/Playwright, Deploy na Cloudflare).
