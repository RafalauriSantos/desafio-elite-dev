# 🤖 Transparência e Uso de IA — Desafio Elite Dev

**Candidato:** Rafael Lauri  
**Projeto:** Elite Tickets — Plataforma de Eventos e Ingressos  

---

## 🎯 Minha Visão e Relação com a IA Neste Projeto

Gostei muito da forma como a Verzel abordou o uso de IA no edital: reconhecendo que a ferramenta existe, mas valorizando o pensamento, as escolhas e o cuidado de quem está conduzindo o desenvolvimento.

Quero ser 100% transparente com a banca: **eu utilizei IA para acelerar e gerar a maior parte do código bruto desta aplicação**. Não tenho a pretensão de dizer que digitei milhares de linhas de código manualmente. No entanto, me preocupei intensamente em não entregar um projeto gerado no automático e sem critério (*AI Slop*).

Meu papel ao longo de todo o teste foi atuar como o responsável pelas decisões, guiando a ferramenta, testando cada fluxo, apontando erros de lógica e exigindo um padrão visual e técnico do qual eu realmente me orgulhasse.

---

## 💡 Onde Foquei Minha Atenção e Cuidado

Sempre que a IA gerava algo genérico ou com falhas de negócio, fiz questão de intervir e direcionar:

1. **Cuidado com a Identidade Visual (Menos é Mais):**
   - Inicialmente, a IA gerou telas com efeitos que achei exagerados (LEDs piscando, modais instáveis no celular e sombras pesadas).
   - Pedi para limpar tudo e adotar um **design minimalista e sóbrio (estilo Swiss Design / Apple Wallet)**. Busquei criar um bilhete digital limpo, com alto contraste, focado na facilidade de leitura do QR Code na portaria.

2. **Atenção aos Detalhes de Negócio (Isolamento de Assentos):**
   - Durante os testes manuais de importação, percebi que os eventos estavam compartilhando o mesmo mapa de assentos (comprar em um evento acabava bloqueando o outro).
   - Fiz questão de corrigir essa lógica para que cada evento tivesse seus 80 assentos totalmente isolados por ID (`s-${eventId}-${row}-${num}`).

3. **Preocupação com a Concorrência Real:**
   - Me preocupei em não deixar a concorrência como uma simples simulação em memória. Optei por usar uma Stored Procedure no PostgreSQL com `SELECT ... FOR UPDATE ORDER BY id ASC`, garantindo que o banco de dados seja o verdadeiro guardião contra duplas vendas e deadlocks.

4. **Segurança e Criptografia do Ingresso:**
   - Para que o ingresso não fosse facilmente forjado, pedi a implementação de assinatura digital com **HMAC-SHA256** no servidor via Web Crypto API.

5. **Ajuste na Impressão e PDF A4:**
   - Ao testar a função de imprimir/salvar em PDF, notei que alguns ícones quebravam linha e o cartão ficava fora de centro. Pedi para ajustar os estilos de `@media print` para que a impressão ficasse centralizada e visualmente perfeita em folhas A4.

6. **Envio Real por E-mail:**
   - Pensei na experiência completa do comprador e integrei o envio real de e-mails via API do **Resend**, configurando para rodar em segundo plano no Worker (`c.executionCtx.waitUntil`) para não deixar o checkout lento.

7. **Pensando em Quem Vai Avaliar (Persona Switcher):**
   - Criei o alternador de personas no topo da tela com o objetivo de poupar o tempo dos avaliadores da banca, permitindo testar o fluxo de Cliente, Organizador e Portaria em poucos cliques e sem barreiras.

---

## 🧪 Testes e Validação Contínua

Para ter certeza de que tudo funcionava além da interface, montei e executei uma suíte com **18 cenários de teste automatizados (totalizando 21 asserções de validação)** (`tests/qa_all_scenarios_suite.mjs`), simulando 10 compras simultâneas pelo mesmo assento, tentativas de fraudar o QR Code, ataques de repetição e injeção de payload na portaria.

---

## 🙏 Agradecimento Final

Agradeço à equipe da Verzel pela proposta do desafio. Foi uma experiência muito enriquecedora poder aliar a velocidade da IA ao meu senso crítico de produto, design e engenharia para entregar uma solução completa e bem cuidada.
