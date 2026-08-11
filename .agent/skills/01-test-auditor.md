# 🛡️ Skill: Auditor de Requisitos & Regras de Negócio (Verzel Elite Dev)

Sempre que o usuário solicitar uma alteração de arquitetura, rota ou tela, você DEVE auditar contra os requisitos estritos do PDF da Verzel:

## 1. Regras de Roles & Permissões Inegociáveis
- **Organizador (`organizer`):** Pode importar eventos da API do TMDb/Ticketmaster e definir data, local, capacidade e preço. NÃO pode comprar ingressos.
- **Cliente (`client`):** Pode navegar no catálogo, selecionar assentos no mapa, realizar checkout simulado, visualizar seus QR Codes e gerar link de compartilhamento.
- **Portaria (`gatekeeper`):** Pode APENAS ler QR Codes via câmera ou digitação manual para validar entradas.

## 2. Checklist de Validação
Antes de considerar qualquer funcionalidade concluída, verifique:
- [ ] A reserva do assento usa a trava no banco de dados (`FOR UPDATE`)?
- [ ] O QR Code contém uma hash HMAC-SHA256 gerada no servidor?
- [ ] A validação da portaria trata os 4 estados: VALID, ALREADY_USED, INVALID, WRONG_EVENT?
- [ ] O checkout contempla simulação de APROVADO e RECUSADO?
- [ ] A conta e evento de Seed do arquivo `supabase/schema.sql` permanecem funcionais?

Se qualquer funcionalidade violar estas regras ou parecer genérica ("AI Slop"), alerte o usuário e corrija imediatamente.
