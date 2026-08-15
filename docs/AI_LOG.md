# 🤖 Transparência e Uso de IA — Desafio Elite Dev

**Candidato:** Rafael Lauri  
**Projeto:** Elite Tickets — Plataforma de Eventos e Ingressos  

---

## 🎯 Minha Filosofia: Engenharia por Orquestração Crítica de IA

O próprio edital da Verzel destacou com muita lucidez:
> *"Vivemos na era da IA... qualquer enunciado colado numa ferramenta devolve um sistema inteiro... Por isso o que nos interessa não é o volume entregue: é como você pensa. As decisões que tomou, o que descartou pelo caminho, por que a tela é assim e não de outro jeito. Fuja do AI slop... O problema não é a IA ter feito, é ninguém ter escolhido nada."*

Minha abordagem neste desafio foi exatamente essa: atuei como um **Engenheiro Orquestrador**. Usei IA para acelerar a geração do código bruto, mas exerci controle crítico contínuo sobre cada decisão de arquitetura, regra de negócio e experiência visual.

---

## 🛠️ Como Conduzi a Ferramenta e o Que Rejeitei no Caminho

Colar o prompt da banca e aceitar a primeira resposta da IA geraria um sistema frágil e com a mesma cara genérica de sempre (*AI Slop*). Durante o desenvolvimento, atuei ativamente para corrigir as falhas e impor o padrão de qualidade:

1. **Rejeição de AI Slop & Decisão por Design Suíço:**
   - A IA inicialmente tentou aplicar layouts escuros genéricos com excesso de sombras, gradientes chamativos e LEDs piscando.
   - Vetei esses excessos e direcionei a interface para um **design editorial minimalista (Swiss Design / Apple Wallet Pass)**, focado em alto contraste e clareza para leitura rápida do QR Code na portaria.

2. **Identificação de Bug Crítico de Lógica de Negócio (Isolamento de Assentos):**
   - Durante a importação de eventos, a IA gerou uma estrutura em que múltiplos eventos compartilhavam os mesmos assentos em memória.
   - Identifiquei o problema de regra de negócio e exigi o isolamento estrito de inventário escopado pelo ID único de cada evento (`s-${eventId}-${row}-${num}`).

3. **Exigência de Concorrência Real no Banco de Dados (Pessimistic Locking):**
   - Em vez de aceitar mocks de concorrência em memória (que falham em ambientes serverless distribuídos), exigi a criação de uma Stored Procedure atômica em PL/pgSQL no PostgreSQL com `SELECT ... FOR UPDATE ORDER BY id ASC`. Isso eliminou o risco de dupla venda e preveniu deadlocks.

4. **Criptografia Anti-Fraude na Borda:**
   - Exigi a assinatura digital do QR Code com **HMAC-SHA256** no servidor via Web Crypto API, impedindo que ingressos falsificados sejam aceitos na portaria.

5. **Ajuste Milimétrico de Impressão e PDF A4:**
   - A primeira versão gerada quebrava os ícones SVG e desalinhava margens ao imprimir. Orientei a correção cirúrgica dos estilos `@page` e `@media print` para centralizar perfeitamente o bilhete em folhas A4.

6. **Envio Real de E-mails com Resend em Segundo Plano:**
   - Implementei o disparo assíncrono via `c.executionCtx.waitUntil(sendTicketEmail(...))` no Cloudflare Workers, garantindo que o e-mail real seja enviado sem adicionar latência ao checkout do cliente.

7. **Persona Switcher para Avaliação Rápida:**
   - Criei o alternador de personas no topo da tela pensando diretamente na experiência de quem vai avaliar o teste na banca, permitindo navegar entre Cliente, Organizador e Portaria em 1 clique.

---

## 📊 Suíte de Testes de Caos

Para garantir que a aplicação não apenas "pareça bonita", mas resista a condições extremas de concorrência e ataques maliciosos, desenvolvi e executei uma suíte com **18 cenários de teste automatizados** (`tests/qa_all_scenarios_suite.mjs`):
- Tentativas de compra concorrente massiva (10 requisições simultâneas pelo mesmo assento).
- Defesa contra injeção SQL e payloads maliciosos no leitor de QR Code.
- Bloqueio de adulteração de assinatura HMAC.
- Defesa contra Replay Attack (tentativa de validar o mesmo ingresso duas vezes).
- Rollback automático de assentos no checkout recusado.

---

## 🏆 Conclusão

O resultado entregue não é o que uma ferramenta gerou no automático; é o que **eu guiei, filtrei, corrigi e refinei** até atingir a excelência de produto exigida pela Verzel.
