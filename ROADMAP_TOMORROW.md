# 📌 Plano Mestre Unificado de Melhorias & Engenharia (Elite Tickets 2026)

Este documento consolida em um único plano de execução as tarefas prioritárias do roadmap e as correções da auditoria de UI/UX, Mobile e Fluxo de Dados.

---

## 🏁 Status de Conclusão:
- [x] **Migração para o Banco Dedicado Oficial (Supabase `zgbhmduzypqfgfuncnhl`):** 100% concluído e auditado com testes reais de concorrência e transações atômicas.

---

## 🎯 1. Modal de Checkout: Ergonomia Mobile & Rolagem Segura
- **Problema:** Obstrução do botão de compra pela barra inferior móvel e corte em viewports menores com teclado virtual.
- **Implementação:**
  - Separar o modal em 3 blocos rígidos: Cabeçalho fixo, Corpo com rolagem independente (`min-h-0 overflow-y-auto overscroll-contain`) e Rodapé pinado (`sticky bottom-0 shrink-0`) com `pb-[max(1rem,env(safe-area-inset-bottom))]`.
  - Ajustar altura para `max-h-[92dvh] sm:max-h-[85dvh]` para evitar sobreposições em telas compactas (360px–390px).

---

## 🎫 2. Integridade de Dados dos Ingressos & Visualização do Passe (Wallet Pass)
- **Problema:** Fallbacks estáticos ("Evento Selecionado" / "Local do Evento") exibidos por falta de hidratação das entidades `events` e `seats` no retorno do checkout.
- **Implementação:**
  - No backend (`POST /api/checkout`) e frontend (`api.ts` / `EventDetails.tsx`), hidratar o objeto do ingresso com a entidade completa do evento (`title`, `venue`, `date`, `banner_url`) e do assento (`row_name`, `seat_number`, `category`).
  - Elevar o contraste do badge de referência (`REF:`) e metadados no cabeçalho do passe para padrão WCAG AAA (> 7:1) com `border border-zinc-700 font-mono`.

---

## 🖨️ 3. Redesenho do Ingresso para Impressão / PDF (`@media print`)
- **Problema:** Impressão de elementos indesejados da interface (menu, cabeçalho, fundos escuros distorcidos).
- **Implementação:**
  - Componente de Bilhete Térmico / Boarding Pass em `PrintableTicket.tsx` com visual de recorte de picote industrial e QR Code nítido.
  - Regras estritas de `@media print` no `index.css` ocultando 100% da interface externa (`.no-print { display: none !important; }`).
  - Suporte a impressão individual ou em lote de ingressos da compra.

---

## 📱 4. Lista "Meus Ingressos": Ergonomia & Tratamento de Estados (Ativo vs Usado)
- **Problema:** Último card cortado pela barra de navegação inferior móvel; 4 botões espremidos em linha única; semântica visual inconsistente em ingressos já utilizados.
- **Implementação:**
  - **Espaçamento:** Adicionar `pb-28 sm:pb-12` na lista de ingressos para respiro total sobre a barra de navegação inferior.
  - **Ações Rápidas em Grid 2x2:** Reorganizar a fileira de botões em 2 pares semânticos ergonômicos com touch target de 40px:
    - Linha 1: `[ 📅 Google Agenda ]` | `[ 📄 Baixar PDF / Passe ]`
    - Linha 2: `[ 📋 Copiar QR Code ]` | `[ 🔗 Compartilhar Link ]`
  - **Semântica de Ingresso Usado:**
    - Assento em tom neutro (`text-zinc-300`), removendo o verde ativo.
    - Card com opacidade sutil e borda âmbar (`border-amber-500/20`).
    - Overlay do QR Code com ícone de check (`CheckCircle2`), data/hora exata de uso e texto em alto contraste (`text-amber-300`).
    - Desativação contextual do botão "Copiar QR", mantendo "PDF" como comprovante histórico.

---

## 📧 5. Template Transacional de E-mail de Alta Fidelidade (Resend)
- **Implementação:**
  - Template HTML responsivo em `server/src/email.ts` com design Dark VIP, resumo completo da compra (evento, local, assentos), imagem do QR Code embutida e link para o Google Calendar.
  - Disparo assíncrono via `fetch('https://api.resend.com/emails')` com `waitUntil` no Cloudflare Workers.

