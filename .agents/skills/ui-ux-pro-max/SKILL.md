---
name: ui-ux-pro-max
description: Skill de Nível PRO MAX para Eliminação Absoluta de AI Slop, Design System Industrial, Tipografia de Autoridade e Micro-Interações de Nível Ticketmaster/Apple.
---

# 👑 Skill: UI/UX Pro Max (Industrial Craft & Anti-AI-Slop System)

Esta skill aplica o padrão **PRO MAX** de engenharia e design de produto. Ela proíbe expressamente layouts genéricos ("AI Slop") e estabelece um padrão visual de nível mundial (inspirado em Ticketmaster, StubHub, Eventim e Apple Event Ticketing).

## 1. Regras Inegociáveis de Design PRO MAX
- **NO Generic Fonts:** Use a combinação de três fontes de autoridade:
  - Display/Títulos: **`Outfit`** ou **`Plus Jakarta Sans`** (Google Fonts).
  - Texto Corpo: **`Inter`** (WCAG 2.2 AA legibilidade máxima).
  - Códigos/Assentos/QR: **`JetBrains Mono`** ou **`Space Mono`**.
- **NO Bland Gradients:** Proibido o uso de gradientes de texto roxo-azul genéricos. Use superfícies sólidas de alto contraste, acentos de luz pontuais (`radial-gradient`), e bordas finas de 1px em tom metálico/ônix (`#27272a`).
- **NO Static Cards:** Todo cartão interativo DEVE ter:
  - Efeito hover de elevação sutil (`hover:-translate-y-1 hover:border-emerald-500/50 transition-all duration-300`).
  - Resposta tátil ao clique (`active:scale-[0.98]`).
  - Sombras compostas de profundidade (`shadow-xl shadow-black/60`).

## 2. Padrões de Componentes PRO MAX

### A. Arena Seat Map 3D (Mapa de Assentos de Alta Fidelidade)
- **Perspectiva de Arena:** Efeito sutil de inclinação 3D no container de assentos (`perspective: 1000px`, `rotateX(12deg)` em telas grandes).
- **Facho de Luz do Palco (*Spotlight Beam*):** Gradiente de luz projetado do palco curvo em direção às fileiras de assentos.
- **Categorias de Assento:**
  - **VIP:** Verde Esmeralda Neon (`bg-emerald-950/80 border-emerald-500 text-emerald-300 hover:bg-emerald-400 hover:text-zinc-950`).
  - **Premium:** Azul Ciano Neon (`bg-cyan-950/80 border-cyan-500 text-cyan-300 hover:bg-cyan-400 hover:text-zinc-950`).
  - **Standard:** Cinza Ônix (`bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-700 hover:text-white`).
- **Dock Flutuante de Checkout:** Barra fixa na parte inferior da tela ao selecionar um assento, com timer de retenção em tempo real e botão de ação em destaque.

### B. Bilhete Físico Canhoto (`ticket-stub`)
- Recortes laterais em meio-círculo perfeitos (`ticket-stub`).
- Linha de picote pontilhada vertical ou horizontal.
- Código de Barras SVG estilizado ao lado do QR Code assinado por **HMAC-SHA256**.
- Botão "Copiar Link Público" com animação de confirmação visual.

### C. Portaria & Scanner de Acesso
- Moldura de escaneamento de câmera com linha laser animada de escaneamento (*scanning line*).
- Modais de resultado de acesso com códigos de cor industriais:
  - 🟢 **`VALID`**: Verde Esmeralda com ícone de confirmação animado.
  - 🟡 **`ALREADY_USED`**: Amarelo Âmbar com aviso de entrada dupla.
  - 🔴 **`INVALID`**: Vermelho Alerta com recusa de assinatura HMAC.
