# PRD - Especificação Técnica e Requisitos (Desafio Elite Dev)

## 1. Visão Geral
O **Elite Dev Ticketing System** é uma plataforma completa de gerenciamento de eventos, reserva de assentos numerados em tempo real e controle de acesso com verificação criptográfica por QR Code.

---

## 2. Escopo por Perfil de Usuário (Roles)

### 2.1 Organizador (Admin)
- Criação e gestão de eventos (título, descrição, local, data, valores e imagem).
- Capacidade de sincronizar/importar eventos externos (integração com APIs como TMDb ou Ticketmaster).
- Visualização do relatório de vendas e ocupação da casa em tempo real.

### 2.2 Cliente (Comprador)
- Navegação pelo catálogo de eventos ativos.
- Seleção visual e interativa no Mapa de Assentos (categorias VIP, Premium, Standard).
- Reserva temporária com trava otimista/pessimista garantida por 10 minutos.
- Pagamento simulado com emissão de ingresso digital contendo QR Code assinado via HMAC-SHA256.

### 2.3 Portaria (Gatekeeper / Validador)
- Leitura de QR Code via câmera do dispositivo ou digitação manual do código do ingresso.
- Validação criptográfica instantânea da assinatura HMAC no servidor Edge.
- Liberação/Bloqueio de entrada e prevenção de reuso (Double-Entry Protection).

---

## 3. Prevenção de Dupla Venda (Atomic Concurrency Control)
Em cenários de alta demanda (ex: abertura de vendas para shows populares), centenas de clientes podem tentar reservar o mesmo assento no mesmo milissegundo.

### Mecanismo de Trava:
1. Ao selecionar um assento, a requisição `POST /api/tickets/reserve` é enviada.
2. A Stored Procedure PostgreSQL `reserve_ticket_atomic` é executada.
3. A instrução `SELECT ... FOR UPDATE` bloqueia exclusivamente a linha do assento na tabela `seats`.
4. Se o assento estiver `sold` ou `locked` por outro usuário (e o tempo de retenção de 10 minutos não tiver expirado), a transação é abortada imediatamente com rollback.
5. Se disponível, o estado é atualizado para `locked` e associado ao `client_id` do comprador.

---

## 4. Mapa de Exceções & Tratamento de Erros

| Código / Situação | Diagnóstico | Resposta ao Cliente | Ação Recomendada |
|---|---|---|---|
| `SEAT_ALREADY_SOLD` | Assento já foi comprado definitivamente. | "Este assento já foi vendido." | Atualizar mapa de assentos e sugerir outro assento. |
| `SEAT_LOCKED_BY_OTHER` | Assento está retido por outro comprador em processo de checkout. | "Assento temporariamente reservado por outro usuário." | Aguardar expiração da reserva (10 min) ou selecionar outro. |
| `HMAC_SIGNATURE_INVALID` | Assinatura HMAC do QR Code não coincide com o segredo do servidor. | "QR Code Inválido ou Forjado! Entrada Negada." | Alertar equipe de segurança da portaria. |
| `TICKET_ALREADY_USED` | Ingresso com status `used` tentando entrar novamente. | "Ingresso já utilizado às HH:MM:SS." | Bloquear entrada dupla (Double-Entry). |
| `TICKET_CANCELLED` | Ingresso cancelado ou reembolsado. | "Ingresso Cancelado." | Recusar entrada na portaria. |
