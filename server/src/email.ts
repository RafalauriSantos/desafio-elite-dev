type EmailEnv = {
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
};

export interface TicketEmail {
  to: string;
  userName: string;
  eventId: string;
  ticketId: string;
  seatId: string;
  qrCodeData: string;
  eventTitle?: string;
  eventVenue?: string;
  eventDate?: string;
  seatName?: string;
}

export async function sendTicketEmail(env: EmailEnv, ticket: TicketEmail): Promise<void> {
  if (!env.RESEND_API_KEY || !env.RESEND_FROM_EMAIL) return;

  const eventTitle = ticket.eventTitle || 'Evento Elite Tickets';
  const eventVenue = ticket.eventVenue || 'Local do Evento';
  const eventDateStr = ticket.eventDate ? new Date(ticket.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Data a confirmar';
  const seatLabel = ticket.seatName || ticket.seatId;
  const shortRef = (ticket.ticketId || '').slice(0, 8).toUpperCase();
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(ticket.qrCodeData)}`;

  // Google Calendar URL
  const rawDate = ticket.eventDate || new Date().toISOString();
  const startDate = new Date(rawDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const endDate = new Date(new Date(rawDate).getTime() + 3 * 3600 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${startDate}/${endDate}&details=${encodeURIComponent('Ingresso emitido via Elite Tickets. Assento: ' + seatLabel)}&location=${encodeURIComponent(eventVenue)}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seu Ingresso Digital - ${escapeHtml(eventTitle)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#fafafa;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:540px;background-color:#121215;border:1px solid #27272a;border-radius:24px;overflow:hidden;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
            <!-- Header -->
            <tr>
              <td style="background-color:#09090b;padding:24px;border-bottom:2px solid #10b981;text-align:left;">
                <div style="font-size:11px;font-family:monospace;font-weight:700;letter-spacing:2px;color:#10b981;text-transform:uppercase;">
                  ELITE TICKETS • WALLET PASS
                </div>
                <h1 style="margin:6px 0 0 0;font-size:18px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">
                  Ingresso Confirmado
                </h1>
              </td>
            </tr>

            <!-- Event Details -->
            <tr>
              <td style="padding:28px 24px 16px 24px;">
                <p style="margin:0 0 4px 0;font-size:12px;color:#a1a1aa;text-transform:uppercase;font-family:monospace;font-weight:600;">
                  Atração
                </p>
                <h2 style="margin:0 0 12px 0;font-size:20px;font-weight:700;color:#ffffff;line-height:1.3;">
                  ${escapeHtml(eventTitle)}
                </h2>
                
                <table role="presentation" width="100%" style="margin-top:16px;border-top:1px solid #27272a;padding-top:16px;">
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#a1a1aa;">
                      📅 <strong>Data:</strong> <span style="color:#f4f4f5;">${escapeHtml(eventDateStr)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#a1a1aa;">
                      📍 <strong>Local:</strong> <span style="color:#f4f4f5;">${escapeHtml(eventVenue)}</span>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-size:13px;color:#a1a1aa;">
                      👤 <strong>Titular:</strong> <span style="color:#f4f4f5;">${escapeHtml(ticket.userName)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Seat Box -->
            <tr>
              <td style="padding:0 24px;">
                <table role="presentation" width="100%" style="background-color:#18181b;border:1px solid #3f3f46;border-radius:12px;padding:16px;">
                  <tr>
                    <td>
                      <span style="font-size:11px;font-family:monospace;color:#a1a1aa;text-transform:uppercase;">Assento Marcado</span>
                      <div style="font-size:18px;font-family:monospace;font-weight:800;color:#10b981;margin-top:2px;">
                        ${escapeHtml(seatLabel)}
                      </div>
                    </td>
                    <td align="right">
                      <span style="font-size:10px;font-family:monospace;color:#71717a;background-color:#27272a;padding:4px 8px;border-radius:6px;">
                        REF: #${escapeHtml(shortRef)}
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- QR Code Section -->
            <tr>
              <td align="center" style="padding:28px 24px 20px 24px;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="background-color:#ffffff;padding:16px;border-radius:16px;text-align:center;">
                  <tr>
                    <td align="center">
                      <img src="${qrImageUrl}" alt="QR Code de Acesso" width="200" height="200" style="display:block;margin:0 auto;border:0;" />
                    </td>
                  </tr>
                </table>
                <p style="margin:12px 0 0 0;font-size:11px;font-family:monospace;font-weight:700;color:#10b981;">
                  ✓ ASSINATURA HMAC-SHA256 INFALSIFICÁVEL
                </p>
                <p style="margin:4px 0 0 0;font-size:11px;color:#71717a;">
                  Apresente este QR Code na portaria ou escaneie no terminal de acesso.
                </p>
              </td>
            </tr>

            <!-- CTA Button -->
            <tr>
              <td align="center" style="padding:0 24px 28px 24px;">
                <a href="${calendarUrl}" target="_blank" style="display:inline-block;background-color:#10b981;color:#09090b;font-size:13px;font-weight:700;text-decoration:none;padding:12px 24px;border-radius:10px;box-shadow:0 4px 12px rgba(16,185,129,0.3);">
                  📅 Adicionar ao Google Agenda
                </a>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background-color:#09090b;padding:16px 24px;border-top:1px solid #27272a;text-align:center;">
                <p style="margin:0;font-size:11px;color:#71717a;font-family:monospace;">
                  DESAFIO ELITE DEV 2026 • VERZEL
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_EMAIL,
      to: [ticket.to],
      subject: `Ingresso Confirmado: ${eventTitle} — Elite Tickets`,
      html: htmlContent
    })
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Resend request failed with status ${response.status}: ${errorText}`);
  }
}

function escapeHtml(value: string): string {
  return (value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
