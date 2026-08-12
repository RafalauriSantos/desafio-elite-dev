# Plano de implementação para entrega excelente

**Base:** `docs/REQUIREMENTS_AUDIT.md` e enunciado do Desafio Elite Dev  
**Objetivo:** transformar o protótipo demonstrável em uma entrega pequena, coerente e defensável em avaliação técnica.

## Estratégia de fechamento

O desafio pede um fluxo completo, não uma plataforma empresarial. A prioridade é garantir que cada promessa tenha um caminho real e testável. Funcionalidades sofisticadas que não ajudam o avaliador devem ficar fora até os requisitos críticos estarem fechados.

### Ordem de prioridade

1. Integridade do fluxo de compra e ingresso.
2. Autenticação e autorização dos três papéis.
3. Paridade entre produção, Supabase e fallback local.
4. Integração externa real.
5. Testes, documentação e demonstração.

## Fase 0 — Congelar o contrato do produto

**Objetivo:** eliminar ambiguidades antes de implementar.

- Escolher oficialmente o modelo de assentos numerados; não implementar pista por quantidade.
- Definir que cada assento reservado gera um ingresso individual.
- Definir estados: `available`, `locked`, `sold`, `valid`, `used`, `cancelled`.
- Definir pagamento simulado com dois resultados determinísticos: aprovado e recusado.
- Definir que o backend é a fonte de verdade para reserva, emissão, compartilhamento e validação.

**Aceite:** PRD, README e código descrevem exatamente o mesmo fluxo; nenhum documento chama mock de integração real.

## Fase 1 — Fechar compra, recusa e lote

**Objetivo:** corrigir o maior risco funcional atual.

- Alterar `/api/checkout` para receber todos os `seatIds` reservados.
- Emitir um ticket e um QR independente para cada assento.
- Fazer o checkout retornar uma coleção de tickets, mantendo compatibilidade temporária com o ticket principal.
- Adicionar `paymentStatus: approved | declined` ao fluxo simulado.
- Criar no frontend uma opção de cartão/teste aprovado e recusado, sem coletar dados financeiros reais.
- Em recusa, liberar atomicamente os assentos bloqueados.
- Impedir checkout de assento expirado, vendido ou pertencente a outro comprador.

**Aceite:**

- 1, 2 e 3 assentos selecionados resultam em 1, 2 e 3 ingressos.
- Pagamento recusado não cria ingresso e devolve os assentos ao estoque.
- Repetir checkout não duplica ingresso nem vende o assento novamente.
- Testes cobrem aprovação, recusa, expiração e concorrência.

## Fase 2 — Autenticação e autorização real

**Objetivo:** cumprir os três papéis do enunciado sem deixar apenas perfis decorativos.

- Ativar Supabase Auth com usuários de seed documentados.
- Associar `auth.users.id` a `profiles.id`.
- Criar sessão no frontend e um fluxo de login simples por e-mail/senha ou magic link.
- Criar `AuthContext` com usuário, perfil e papel.
- Proteger rotas e ações:
  - `organizer`: criar, importar, editar e cancelar eventos.
  - `client`: navegar, reservar, pagar e visualizar os próprios ingressos.
  - `gatekeeper`: validar ingresso e consultar apenas o necessário para a portaria.
- Enviar JWT nas chamadas à API e validar o papel no Worker.
- Ajustar RLS: remover políticas públicas de escrita e limitar leitura por domínio.

**Aceite:** uma conta de cliente não consegue publicar evento; uma conta de organizador não consegue validar entrada; uma conta de portaria não consegue comprar ingresso.

## Fase 3 — Fonte externa real

**Objetivo:** cumprir a integração exigida sem expor chaves no frontend.

- Implementar pelo menos uma integração real; recomendação: TMDb primeiro, Ticketmaster depois.
- Criar adaptadores no Worker com timeout, cache curto, tratamento de rate limit e resposta normalizada.
- Configurar chaves via secrets do Cloudflare, nunca via código ou `wrangler.toml`.
- Manter o catálogo demo apenas como fallback explicitamente identificado.
- Registrar no README qual API está ativa, como configurar a chave e qual fallback existe.

**Aceite:** com a chave configurada, o organizador vê dados recebidos da API externa; sem chave, o sistema informa modo demonstração sem afirmar sincronização real.

## Fase 4 — QR, compartilhamento e paridade operacional

**Objetivo:** tornar o ingresso verificável em qualquer dispositivo e manter o mesmo comportamento em produção.

- Manter o payload mínimo assinado pelo backend com HMAC-SHA256.
- Validar assinatura, existência, evento e status no backend antes de marcar `used`.
- Garantir atualização atômica de `used_at` para impedir dupla entrada concorrente.
- Criar link público com token/identificador assinado que consulte o backend; não depender de `localStorage`.
- Corrigir o fallback Worker para persistir uso ou desabilitar claramente validação demo como modo de produção.
- Testar QR em tela, impressão e câmera mobile HTTPS.
- Manter digitação manual como contingência.

**Aceite:** o link abre em outro navegador/dispositivo; um ingresso válido passa uma vez; a segunda tentativa retorna `ALREADY_USED`; adulteração retorna `INVALID`; evento diferente retorna `WRONG_EVENT`.

## Fase 5 — Gestão mínima do organizador

**Objetivo:** cumprir “criação e gerenciamento” com escopo pequeno.

- Criar página/painel protegido do organizador.
- Listar eventos próprios.
- Permitir editar título, data, local, preço e capacidade antes de vendas.
- Permitir cancelar evento e marcar ingressos afetados como cancelados.
- Manter importação em lote como diferencial, depois do CRUD básico.

**Aceite:** organizador cria, visualiza, edita e cancela seu próprio evento; cliente visualiza somente eventos publicados.

## Fase 6 — Testes de aceitação

**Objetivo:** provar o que será demonstrado ao avaliador.

- Unitários: HMAC, estados de ticket, pagamento, normalização de API.
- Backend: autorização por papel, reserva concorrente, checkout em lote, recusa, link compartilhado e validação atômica.
- Frontend: guards, login, assentos, checkout aprovado/recusado, carteira e estados da portaria.
- Playwright: fluxo cliente completo, fluxo organizador, fluxo portaria com câmera e fallback manual.
- Teste de produção: health, catálogo, CORS, emissão e validação usando ambiente controlado.
- Executar `npm run typecheck`, `npm test`, build e E2E no CI.

**Aceite:** o pipeline falha quando um requisito crítico quebra; não existem testes que apenas verificam presença de texto sem validar mudança de estado.

## Fase 7 — Entrega e narrativa técnica

**Objetivo:** fazer o avaliador entender as escolhas e executar o projeto sem adivinhação.

- Atualizar README com arquitetura real, variáveis, seed, login por papel, banco e comandos.
- Separar claramente produção, Supabase configurado e modo demonstração.
- Documentar decisões: assentos em vez de pista, pagamento simulado, HMAC, locks e fallback.
- Documentar limitações conhecidas, se alguma permanecer.
- Adicionar roteiro de avaliação de 5 minutos com três contas e um ingresso preparado.
- Atualizar `docs/AI_LOG.md` com o que foi feito pela IA e quais decisões foram humanas.
- Rodar Graphify com escopo do produto e exportar a auditoria, decisões e arquitetura para a vault.

**Aceite:** uma pessoa externa consegue configurar, entrar com cada papel, comprar, compartilhar e validar um ingresso seguindo apenas o README.

## Definition of Done

A entrega só deve ser considerada pronta quando:

- o fluxo cliente → pagamento → ticket → portaria funciona em ambiente configurado;
- os três papéis são autenticados e autorizados;
- aprovação e recusa de pagamento têm efeitos corretos;
- o QR compartilhado funciona em outro dispositivo;
- dupla venda e dupla entrada são impossíveis no backend;
- pelo menos uma API externa real está configurada ou a limitação está explícita;
- testes, CI, README, Graphify e vault refletem o mesmo estado do sistema;
- não há afirmação de “concluído” para uma capacidade que só existe em mock.

## Riscos que não devem voltar

- Expandir UI antes de fechar persistência e autorização.
- Chamar catálogo hardcoded de integração externa.
- Aceitar qualquer payload no fallback local como se fosse QR válido.
- Manter seed de `profiles` sem usuários autenticáveis.
- Reservar lote e emitir apenas um ticket.
- Deixar documentação mais completa que a implementação real.
