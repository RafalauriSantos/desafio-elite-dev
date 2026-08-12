# Auditoria contra o enunciado do Desafio Elite Dev

**Data:** 2026-08-12  
**Escopo:** comparação do enunciado anexado com o código e os testes atuais do repositório.

**Atualização de implementação:** a Fase 1 foi aplicada no Supabase correto (`zgbhmduzypqfgfuncnhl`, Verzel DB) e publicada no Worker. O checkout aceita `seatIds`, emite um ticket/QR por assento, suporta `approved`/`declined` e possui RPCs SQL para finalizar ou liberar reservas. A base da Fase 2 também foi iniciada com Supabase Auth, `AuthContext`, login e navegação por papel.

## Veredito executivo

O projeto entrega um fluxo demonstrável de ponta a ponta para catálogo, mapa de assentos, reserva em lote, checkout de confirmação, ingresso com QR, portaria manual/câmera e prevenção de dupla entrada no caminho Supabase. Ele ainda não deve ser descrito como cumprimento integral do enunciado sem ressalvas.

Os maiores gaps são:

1. O login e os guards de sessão/papel foram iniciados; ainda falta provisionar e documentar os três usuários Auth seed e autorizar cada endpoint no Worker.
2. O pagamento aprovado/recusado já existe e foi validado em produção com liberação do assento; falta ampliar a cobertura de concorrência/expiração.
3. O catálogo externo atual é uma lista curada no Worker, não uma chamada real à Ticketmaster Discovery ou TMDb.
4. O fallback demo do backend valida um ingresso assinado como válido repetidamente, pois não persiste `used`.
5. O fallback local do cliente é deliberadamente demonstrativo e não oferece a mesma garantia criptográfica/atômica do caminho Supabase.
6. O lote agora reserva e emite um ingresso por assento; o contrato legado mantém o primeiro ticket em `ticket`.

## Matriz de requisitos

| Requisito do enunciado | Estado | Evidência / interpretação |
|---|---|---|
| Navegar e buscar eventos | Entregue | `Catalog.tsx` e `api.getEvents()`; o catálogo possui busca/filtro visual. |
| Organizador criar e gerenciar eventos | Parcial | `OrganizerModal.tsx` cria evento localmente e importa em lote; não há autenticação, edição, exclusão ou autorização de organizador. |
| Reserva por mapa de assentos ou quantidade | Entregue com ressalva | Mapa A-D e reserva em lote existem; o fluxo escolhido é assentos numerados. |
| Pagamento simulado com confirmação e recusa | Entregue | `CheckoutModal.tsx` e `/api/checkout` suportam `approved`/`declined`; recusa libera a reserva via RPC. |
| Meus ingressos com QR | Entregue | `MyTickets.tsx`, `TicketCard.tsx`, `qrcode.react`. |
| Portaria: válido, inválido, usado, evento errado | Entregue no caminho Supabase/demo UI | `QRScanner.tsx`, `validate_ticket_gatekeeper()` e `Gatekeeper.tsx`. O fallback Worker não persiste uso. |
| Leitura por câmera e digitação manual | Entregue | `html5-qrcode` com seleção de câmera, fallback manual e teste Chromium de inicialização. |
| Ticketmaster/TMDb | Parcial | Rotas e catálogo curado existem; não há chamada de rede às APIs externas nem chaves/configuração dessas APIs. |
| Três papéis autenticados | Parcial | `AuthContext`, login e navegação por `profiles.role` iniciados; provisionamento Auth e autorização do Worker permanecem. |
| Armazenamento de eventos, reservas e ingressos | Parcial | Schema/RPC Supabase existem; sem Supabase configurado o app usa mocks/localStorage. |
| Impedir venda dupla | Entregue no Supabase | RPCs usam `FOR UPDATE` e ordenação no lote. Fallback demo não tem garantia multiusuário. |
| QR não forjável | Entregue no backend configurado; parcial no demo | HMAC-SHA256 existe em `server/src/crypto.ts`; fallback local usa assinatura demonstrativa e validação permissiva. |
| Compartilhar ingresso via link | Parcial | `TicketCard.tsx` copia `#ticket-{id}`; esse link depende do armazenamento local e não resolve um ingresso remoto de forma confiável em outro dispositivo. |
| Não validar duas vezes | Entregue no Supabase; parcial no Worker demo | RPC marca `used` atomicamente; fallback demo retorna `VALID` sem persistir o estado. |
| Cobrança simulada | Entregue apenas no happy path | Não há provedor real, o que é aceitável, mas falta a recusa explicitamente pedida. |
| README detalhado e limitações | Parcial | README explica execução e arquitetura, mas afirma autenticação/integrações e conclusão mais ampla que o código comprova. |
| Dados semeados | Parcial | O banco correto contém evento/32 assentos/53 perfis; falta alinhar perfis aos usuários reais do Supabase Auth. |
| Deploy | Entregue/documentado, precisa verificar secrets/runtime | Links Cloudflare estão no README e há workflow; deploy pode ser pulado sem secrets. |
| Transparência sobre IA | Entregue | `docs/AI_LOG.md` existe. |

## O que foi realmente validado

- Unit/integration: 7 testes Vitest passaram.
- E2E browser: catálogo → seleção → reserva → checkout → portaria passou.
- Browser camera: Chromium com permissão e dispositivo virtual criou o vídeo do `html5-qrcode` sem erro.
- TypeScript client/server passou.
- Graphify encontrou uma falha de extração em `EmailPreviewModal.tsx` na linha 78; o arquivo continua compilando no Vite/TypeScript, mas não é totalmente representado na árvore.

## Decisões para o segundo cérebro

O Graphify deve indexar o produto e seus artefatos de decisão, não os scripts internos das skills em `.agents`. O `.graphifyignore` mantém no corpus o frontend, Worker, SQL, documentação e testes, excluindo tooling/cache. Isso reduz ruído e torna as relações entre requisito → componente → endpoint → RPC → teste navegáveis no Obsidian.

## Próxima ordem correta de trabalho

1. Provisionar usuários Supabase Auth e vincular seus IDs aos perfis seed.
2. Validar JWT e papel no Worker, protegendo criação, compra e portaria por endpoint.
3. Persistir/validar estado `used` no fallback Worker ou impedir que ele seja apresentado como modo de produção.
4. Substituir catálogo curado por integração configurável com uma API externa real.
5. Fazer o link compartilhado resolver o ingresso via backend, sem confiar em `localStorage`.
