# 🤖 Transparência e Uso de IA — Desafio Elite Dev

**Candidato:** Rafael Lauri  
**Projeto:** Elite Tickets — Plataforma de Eventos e Ingressos  

---

## 🎯 Minha Filosofia: Engenharia Guiada por Visão Crítica e Inovação Própria

O enunciado da Verzel trouxe uma reflexão central sobre o momento atual da tecnologia:
> *"Vivemos na era da IA... qualquer enunciado colado numa ferramenta devolve um sistema inteiro... Por isso o que nos interessa não é o volume entregue: é como você pensa. As decisões que tomou, o que descartou pelo caminho... Fuja do AI slop... O problema não é a IA ter feito, é ninguém ter escolhido nada."*

Minha postura neste desafio foi assumir a liderança técnica de ponta a ponta. A IA funcionou estritamente como um gerador de código bruto sob minha orientação. **Absolutamente todas as decisões de produto, os diferenciais competitivos e as correções de falhas de lógica foram ideias e exigências minhas.**

---

## 💡 O Que Foi Minha Ideia e Exigência Direta (Overdelivery de Produto)

Se eu tivesse apenas aceitado o que a IA gerou no primeiro comando, o projeto teria sido mais uma aplicação genérica e cheia de falhas de negócio. Eu intervim diretamente em cada etapa do ciclo de vida do software:

### 1. Rejeição Firme do "AI Slop" e Imposição de Design Minimalista
- A IA inicialmente gerou telas escuras saturadas, com LEDs piscantes e modais deslizando lateralmente de forma instável no mobile.
- **Minha decisão:** Vetei qualquer tipo de poluição visual. Exigi uma identidade minimalista, anti-ruído e sóbria, focada exclusivamente no que é essencial para o usuário. Travei o eixo horizontal dos modais para garantir navegação natural em smartphones.

### 2. Criação do Passe Digital no Padrão Suíço / Apple Wallet (Photo-Matched)
- **Minha ideia:** Não aceitei o layout padrão de tickets gerado por IA. Forneci referências visuais de alta fidelidade e exigi a construção de um bilhete digital vertical (proporção 2:3), no estilo Apple Wallet / Swiss Design:
  - Header oficial com ícone minimalista `✦ ELITE TICKETS` e código mascarado `REF: #T-XXXXXX`.
  - Grid de 2 colunas com dados reais do titular, evento e assento formatado.
  - Container de QR Code perfeitamente quadrado e centralizado, sem textos soltos ou desalinhados.

### 3. Identificação e Correção do Bug Crítico de Compartilhamento de Assentos
- Ao testar a importação de múltiplos shows, **eu percebi** que a IA havia criado uma estrutura em que eventos diferentes compartilhavam a mesma matriz de assentos em memória (comprar em um evento bloqueava o outro).
- **Minha cobrança:** Exigi a reformulação da arquitetura para garantir que cada evento tenha sua matriz de 80 assentos 100% isolada e escopada pelo ID único (`s-${eventId}-${row}-${num}`).

### 4. Integração Real de Envio de E-mail via Resend em Segundo Plano
- **Minha ideia:** Questionei a ausência de um disparo real de e-mails e exigi a integração com a API oficial do **Resend**.
- Orientei para que o disparo ocorresse de forma assíncrona no Cloudflare Workers (`c.executionCtx.waitUntil`) com o mesmo template HTML idêntico ao bilhete e remetente customizado (`Elite Tickets <...>`), sem adicionar milissegundos de atraso no checkout.

### 5. Correção Cirúrgica da Impressão e PDF A4
- Ao testar a geração do PDF, **eu identifiquei** que a visualização de impressão quebrava o alinhamento de ícones SVG e colava o bilhete no canto da folha.
- **Minha exigência:** Mandei reescrever as regras de `@page` e `@media print` para centralizar perfeitamente o bilhete em folhas A4, preservando tipografia, cores e contraste.

### 6. Despoluição e Humanização da Documentação
- **Minha decisão:** Rejeitei os relatórios automáticos densos e burocráticos gerados por IA. Mandei enxugar os arquivos Markdown para que a banca lesse minhas decisões em primeira pessoa, de desenvolvedor para desenvolvedor.

---

## 🛡️ Decisões de Engenharia e Concorrência

- **Pessimistic Locking no PostgreSQL:** Exigi o uso de Stored Procedure com `SELECT ... FOR UPDATE ORDER BY id ASC` para resolver a concorrência na raiz do banco, eliminando race conditions e deadlocks.
- **Criptografia HMAC-SHA256:** Exigi que o QR Code contivesse uma assinatura digital gerada no servidor via Web Crypto API para impedir qualquer tentativa de falsificação.
- **Máquina de 4 Estados na Portaria:** Exigi o tratamento atômico de `VALID`, `ALREADY_USED`, `INVALID` e `WRONG_EVENT`, com retorno háptico de vibração física no celular do fiscal.
- **Suíte de Testes de Caos:** Exigi a automação de 18 cenários de teste reais cobrindo ataques de repetição, injeção SQL e 10 requisições simultâneas concorrentes.

---

## 🏆 Conclusão

Este projeto demonstra minha capacidade de **liderar e orquestrar ferramentas de IA com alto nível de exigência técnica, visão de produto e bom gosto estético**. A IA foi a ferramenta de aceleração; a inteligência, o refinamento e as decisões de negócio foram 100% minhas.
