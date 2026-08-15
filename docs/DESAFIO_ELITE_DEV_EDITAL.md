# 📜 Enunciado Oficial — Desafio Elite Dev 2026 (Verzel)

> **Documento Fonte Oficial (SSOT - Single Source of Truth)**  
> Este documento registra na íntegra a especificação original solicitada pela banca da Verzel.

---

## 🎯 Proposta de Solução
A proposta deste teste é validar seus conhecimentos técnicos em desenvolvimento Front-End e Back-End, lógica de programação, e sua capacidade de entender e atender a demanda proposta.

Você deve criar uma **Plataforma de Eventos e Ingressos**, onde um organizador publica eventos e um cliente compra ingressos.

O organizador monta um evento a partir de um catálogo de shows ou filmes vindo de uma API externa, definindo data, local, capacidade e preço. O cliente navega pelos eventos publicados, reserva seu lugar, paga de forma simulada, recebe um ingresso com código em QR e pode compartilhá-lo por link. Na entrada do evento, a portaria valida o ingresso.

---

## 💡 O Que Queremos Ver
Vivemos na era da IA, e sabemos o que isso significa aqui: qualquer enunciado colado numa ferramenta devolve um sistema inteiro. Um desenvolvedor nosso fez exatamente isso com este PDF, sem escrever mais nada, e recebeu a aplicação pronta.

Por isso o escopo aqui é pequeno de propósito. O que nos interessa não é o volume entregue: **é como você pensa. As decisões que tomou, o que descartou pelo caminho, por que a tela é assim e não de outro jeito.**

**Fuja do AI slop:** aquela interface que sai pronta da ferramenta e que você reconhece de longe, porque todo projeto gerado tem exatamente a mesma cara. O problema não é a IA ter feito, é ninguém ter escolhido nada.

Queremos ver a sua mão no resultado, e um sistema é o meio que escolhemos para você mostrar isso.

---

## ⚙️ Requisitos Funcionais

### Front-End:
1. **Navegação e busca** pelos eventos publicados (shows ou filmes em cartaz), com data, local e preço.
2. **Criação e gerenciamento** dos eventos pelo organizador.
3. **Fluxo de reserva**, com seleção do lugar num mapa de assentos (cinema, teatro) ou da quantidade de ingressos (pista). Implemente um dos dois, ou os dois.
4. **Pagamento simulado**, contemplando a confirmação e também a recusa.
5. **Área de "Meus ingressos"**, exibindo o ingresso e o seu código em QR.
6. **Tela de portaria**, para validar o ingresso na entrada do evento, com retorno claro: válido, inválido, já utilizado ou evento errado.
7. **Leitura do QR pela câmera** na portaria, tendo a digitação manual do código como alternativa.

### Back-End:
1. **Gestão das chamadas para a API externa:** Ticketmaster Discovery ou TMDb (pode usar uma, a outra, ou as duas).
   - [Ticketmaster Discovery API](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2)
   - [TMDb API](https://developer.themoviedb.org/docs)
2. **Autenticação com três papéis distintos:**
   - **Organizador:** cria e gerencia eventos.
   - **Cliente:** reserva, paga e recebe ingressos.
   - **Portaria:** valida ingressos na entrada.
3. **Armazenamento** dos eventos, das reservas e dos ingressos.
4. **Garantia de concorrência:** que o mesmo lugar não seja vendido duas vezes.
5. **Geração do ingresso** com um código em QR que não possa ser forjado.
6. **Compartilhamento de ingresso:** lógica para permitir que o cliente compartilhe um ingresso via um link gerado pela aplicação.
7. **Validação do ingresso na portaria:** garantindo que o mesmo ingresso não seja validado duas vezes.
8. **Cobrança simulada:** sem transação financeira real (ou ambiente sandbox).

---

## 🛠️ Tecnologias Obrigatórias
- **Front-End:** React (com ou sem framework: Next.js, Vite, Remix).
- **Back-End:** Node.js, Python ou Java (NestJS, Express, FastAPI, Django, Spring Boot ou Hono).
- **Banco de Dados:** Qualquer distribuição relacional ou NoSQL (com instruções claras no README).

---

## 🧭 Referências Recomendadas
- `ingresso.com`: mapa de assentos de cinema.
- `eventim.com.br`: pista e setores por quantidade.
- `sympla.com.br`: criação de evento e checkout.

---

## 📋 Requisitos Não Funcionais & Avaliação
- **Prazo:** 7 dias corridos.
- **Documentação:** README detalhado explicando o passo a passo de configuração e execução.
- **Dados de teste semeados:** 1 organizador, 2 clientes, 1 portaria e ao menos 1 evento publicado com ingressos disponíveis.
- **Deploy (+1 Ponto Bônus):** Publicação em nuvem (Vercel, Cloudflare, etc.).
- **Transparência sobre IA:** Arquivo `docs/AI_LOG.md` explicando o processo, escolhas, o que foi feito com IA e o que foi feito manualmente.
- **Versionamento:** Commits descritivos no GitHub demonstrando o processo de desenvolvimento.
