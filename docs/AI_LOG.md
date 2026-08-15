# 🤖 Transparência e Uso de IA — Desafio Elite Dev

**Candidato:** Rafael Lauri  
**Projeto:** Elite Tickets  

---

## 🎯 Como usei IA neste projeto

O próprio enunciado do desafio destacou que valoriza o uso consciente de IA, e não a geração automática de soluções genéricas sem critério (*AI Slop*). 

Minha postura foi utilizar IA como um **assistente de alta produtividade**, mantendo total autoria e controle sobre a arquitetura, regras de negócio e decisões de design.

---

## ⚡ Onde usei IA para acelerar:
- **Setup e Boilerplate:** Criação das configurações iniciais de `wrangler.toml`, `vite.config.ts`, `tailwind.config.js` e definições básicas de tipos TypeScript.
- **Estruturação de Testes:** Apoio na escrita do esqueleto de testes unitários com Vitest e cenários de automação com Playwright.
- **Indexação de Conhecimento:** Criação do grafo de arquitetura com Graphify para documentar relações entre módulos.

---

## ✋ O que foi pensado, desenhado e implementado por mim:
1. **Concorrência Segura no Banco:** Decidi criar a Stored Procedure em PL/pgSQL (`reserve_ticket_atomic`) usando `SELECT ... FOR UPDATE` ordenado por ID (`ORDER BY id ASC`). Isso garante que duas pessoas tentando o mesmo assento no mesmo milissegundo nunca gerem duplicidade ou deadlock.
2. **Criptografia Anti-Fraude (HMAC-SHA256):** Implementei a assinatura dos ingressos na borda usando Web Crypto API, impedindo que alguém gere um QR Code falso copiando apenas o JSON do ingresso.
3. **Máquina de 4 Estados da Portaria:** Estruturei a validação para cobrir os 4 estados exigidos (`Válido`, `Já Utilizado`, `Inválido` e `Evento Errado`), com atualização atômica no banco para evitar reaproveitamento de ingressos.
4. **Design Editorial (Anti-AI-Slop):** Recusei os layouts genéricos com excesso de sombras e gradientes roxos. Desenhei um bilhete digital limpo, no padrão Swiss / Apple Wallet Pass, com alinhamento rigoroso para impressão em PDF A4.
5. **Integração Real com Resend:** Implementei o envio de e-mails assíncrono em segundo plano no Worker (`c.executionCtx.waitUntil`), mantendo a confirmação de compra instantânea na tela.
6. **Persona Switcher:** Criei o alternador de perfis no topo da aplicação para que a banca possa testar as 3 jornadas (Cliente, Portaria, Organizador) em segundos, sem fricção de login.
