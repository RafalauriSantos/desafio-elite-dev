---
name: spec-driven-development
description: Metodologia de Desenvolvimento Orientado a Especificação (SDD) com validação estrita de contratos, matriz de rastreabilidade e checklists executáveis.
---

# 📐 Skill: Spec-Driven Development (SDD)

Desenvolvimento Orientado a Especificação (Spec-Driven Development) estabelece que o edital / especificação técnica é a única fonte de verdade (Single Source of Truth - SSOT). Nenhuma linha de código é alterada ou considerada pronta sem validação estrita contra a especificação formal.

---

## 🎯 Pilares do Spec-Driven Development

1. **Especificação como Contrato Estrito:**
   - Cada requisito do edital possui um ID de rastreabilidade (ex: `SPEC-REQ-01`, `SPEC-AUTH-02`).
   - Nenhuma suposição é aceita sem validação explícita na especificação.

2. **Matriz de Rastreabilidade (Traceability Matrix):**
   - Todo requisito deve ter:
     - Componente/Módulo responsável.
     - Endpoint/Função de banco associada.
     - Teste automatizado correspondente (Unitário, E2E ou de Concorrência).

3. **Verificação de Estados Limítrofes (Edge & Failure Modes):**
   - O sistema deve cobrir não apenas o "caminho feliz" (*Happy Path*), mas todos os estados de erro, timeout, recusa, duplicidade e violação de permissão.

4. **Verificação Contínua e Não-Regressão:**
   - Cada alteração passa por:
     1. TypeCheck Estrito (`tsc --noEmit`).
     2. Testes Unitários de Componente e API (`vitest`).
     3. Testes de Integração de Banco Real (`live_db_audit.mjs`).
     4. Testes de Automação de Interface E2E (`playwright`).

---

## 📋 Checklist Formal de Validação SDD

Antes de considerar uma feature concluída:
- [ ] **Rastreabilidade:** A feature atende 100% aos critérios de aceitação do edital?
- [ ] **Contrato de Tipos:** As interfaces TypeScript e Schemas de Banco estão sincronizados?
- [ ] **Atomicidade & Concorrência:** O banco impede *race conditions* com bloqueio pessimista (`FOR UPDATE`)?
- [ ] **Segurança & Criptografia:** Os dados sensíveis usam assinaturas HMAC e RLS?
- [ ] **UI/UX Anti-AI-Slop:** A interface possui estados de carregamento, feedback de erro claro e acessibilidade?
- [ ] **Testabilidade:** Há testes automatizados cobrindo os caminhos positivo, negativo e concorrente?
