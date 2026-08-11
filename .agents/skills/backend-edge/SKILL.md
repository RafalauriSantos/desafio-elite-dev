---
name: backend-edge
description: Diretrizes de Back-End Serverless em Cloudflare Workers + Hono.js + HMAC Criptográfico.
---

# ⚡ Skill: Especialista em Back-End Serverless & Criptografia Edge

Ao implementar ou alterar arquivos dentro de `server/src/`, garanta o cumprimento dos seguintes padrões de servidor:

## 1. Arquitetura Hono.js no Cloudflare Workers
- Todas as rotas devem ser declaradas usando a instância do Hono (`app.get`, `app.post`).
- Configure middlewares globais para tratamento de CORS e capturador de erros centralizado (`app.onError`).
- Garanta suporte a runtime do Node usando a Web Crypto API nativa do ambiente Edge (`crypto.subtle`).

## 2. Assinatura Digital do QR Code (HMAC-SHA256)
O módulo `server/src/crypto.ts` DEVE seguir esta regra de segurança:
- O hash do QR Code NÃO PODE ser um ID simples em texto puro.
- A função de geração de token deve concatenar `ticket_id`, `event_id`, `client_id` e a chave secreta `HMAC_SECRET` do servidor.
- A validação deve re-calcular o hash usando a mesma chave secreta e comparar em tempo constante para evitar ataques de timing.

## 3. Integração com Banco de Dados
- Utilize o cliente `@supabase/supabase-js` autenticado via Service Role / Bearer Token.
- Chamadas de reservas de ingressos DEVEM invocar a RPC `reserve_ticket_atomic`.
- Chamadas de validação da portaria DEVEM invocar a RPC `validate_ticket_gatekeeper`.
