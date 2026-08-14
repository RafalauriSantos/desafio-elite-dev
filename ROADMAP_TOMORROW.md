# 📌 Planejamento de Melhorias — Sessão de Amanhã

Este documento registra as tarefas prioritárias definidas para a próxima sessão de desenvolvimento.

---

## 🎯 1. Redesenho & Polimento do Ingresso para Impressão / PDF
- **Problema Atual:** Ao clicar em "PDF / Imprimir", a página imprime elementos indesejados da interface (menu, cabeçalho, fundos escuros distorcidos).
- **Solução a ser implementada:**
  - Criar um componente de Bilhete Térmico / Boarding Pass estilizado com CSS `@media print` dedicado.
  - Ocultar 100% da interface do aplicativo (`.no-print { display: none !important; }`).
  - Renderizar um voucher clean, com corte de picote visual, dados do evento, QR Code em alta resolução, regras de portaria e dados do titular prontos para download como PDF ou impressão direta A4/cupom térmico.

---

## 📧 2. Envio de Ingressos por E-mail via Resend
- **Objetivo:** Ao concluir a compra aprovada no checkout (`POST /api/checkout`), enviar automaticamente um e-mail transacional para o `userEmail` com:
  - Confirmação de compra e resumo dos assentos reservados.
  - Imagem do QR Code em anexo/embutido para entrada rápida no evento.
  - Botão para adicionar ao Google Calendar / Apple Wallet.
- **Implementação Técnica:**
  - Configuração do `RESEND_API_KEY` nas variáveis de ambiente do Cloudflare Workers (`wrangler.toml` / Secrets).
  - Criação de template de e-mail HTML responsivo e elegante no backend (`server/src/services/email.ts`).
  - Disparo assíncrono via `fetch('https://api.resend.com/emails', ...)` na rota de checkout.

---

## 🗄️ 3. Migração para o Banco Oficial (Verzel DB)
- Execução do script `supabase/schema.sql` no painel do banco isolado.
- Atualização das chaves no `wrangler.toml` e no cliente React.
- Validação completa com a suíte de testes de ponta a ponta.
