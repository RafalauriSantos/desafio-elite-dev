type EmailEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

interface TicketEmail {
  to: string;
  userName: string;
  eventId: string;
  ticketId: string;
  seatId: string;
  qrCodeData: string;
}

export async function sendTicketEmail(env: EmailEnv, ticket: TicketEmail): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [ticket.to],
      subject: 'Seu ingresso Elite Tickets',
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#18181b">
        <h1>Ingresso confirmado</h1>
        <p>Olá, ${escapeHtml(ticket.userName)}. Seu ingresso foi emitido com sucesso.</p>
        <p><strong>Evento:</strong> ${escapeHtml(ticket.eventId)}<br/><strong>Assento:</strong> ${escapeHtml(ticket.seatId)}</p>
        <p>Apresente o QR Code abaixo na portaria:</p>
        <pre style="background:#f4f4f5;padding:16px;border-radius:8px;white-space:pre-wrap;word-break:break-word">${escapeHtml(ticket.qrCodeData)}</pre>
        <p style="font-size:12px;color:#71717a">Referência: ${escapeHtml(ticket.ticketId)}</p>
      </div>`
    })
  });

  if (!response.ok) throw new Error(`Resend request failed with status ${response.status}`);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
