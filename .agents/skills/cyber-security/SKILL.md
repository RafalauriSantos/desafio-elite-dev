---
name: cyber-security
description: Diretrizes de Cibersegurança, Proteção de Borda, Validação Criptográfica e Defesa contra Fraudes.
---

# 🛡️ Skill: Cibersegurança & Proteção de Borda (Cybersecurity & Defense)

Ao implementar ou alterar rotas no servidor Hono.js ou consultas no Supabase, siga rigorosamente este protocolo de segurança da informação:

## 1. Assinatura Digital & Proteção contra Forjamento de QR Code
- **HMAC-SHA256 Exclusivo:** Todo QR Code gerado pelo servidor DEVE ser assinado usando `crypto.subtle.sign` com a chave secreta de servidor (`HMAC_SECRET`).
- **Comparação em Tempo Constante (Timing-Attack Defense):** A validação da assinatura digital na portaria DEVE utilizar comparação em tempo constante para evitar inferência por medição de tempo de execução.

## 2. Defesa na Borda (Edge Rate Limiting & Anti-Brute-Force)
- **Limitação de Requisições na Portaria:** As rotas de validação de QR Code (`POST /api/gatekeeper/validate`) DEVEM possuir limite de requisições por IP para impedir escaneamento ou força-bruta automatizada.
- **Sanitização de Inputs (Anti-XSS & SQL Injection):** Todos os campos de texto inseridos pelo organizador ou cliente devem ser higienizados antes da persistência no banco.

## 3. Isolamento Rígido de Acesso (Supabase RLS)
- Habilitar **Row Level Security (RLS)** em todas as tabelas PostgreSQL (`profiles`, `events`, `seats`, `tickets`).
- Clientes autenticados só podem consultar seus próprios ingressos. Apenas a role `gatekeeper` tem permissão operacional de consultar o status global para validação de acesso.
