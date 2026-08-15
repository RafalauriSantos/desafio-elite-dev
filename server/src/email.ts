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
  const globalObj = globalThis as unknown as { process?: { env?: Record<string, string> } };
  const apiKey = env.RESEND_API_KEY || globalObj.process?.env?.RESEND_API_KEY || '';
  const fromEmail = env.RESEND_FROM_EMAIL || globalObj.process?.env?.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  if (!apiKey) {
    console.log(`[Resend Simulated] Ticket email queued for ${ticket.to} (${ticket.eventTitle}) - RESEND_API_KEY not configured.`);
    return;
  }

  const eventTitle = ticket.eventTitle || 'Tech Summit Elite 2026';
  const eventVenue = ticket.eventVenue || 'Arena Innovation Hub';
  
  const eventDateObj = new Date(ticket.eventDate || Date.now());
  const day = eventDateObj.getDate();
  const monthStr = eventDateObj.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '').toUpperCase();
  const year = eventDateObj.getFullYear();
  const hours = String(eventDateObj.getHours()).padStart(2, '0');
  const minutes = String(eventDateObj.getMinutes()).padStart(2, '0');
  const formattedDate = `${day} ${monthStr} ${year} • ${hours}:${minutes}`;

  const shortRef = (ticket.ticketId || '').replace(/^t-|^T-|^#/, '').slice(0, 6).toUpperCase() || 'DEMO-U';
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(ticket.qrCodeData)}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Seu Ingresso Digital - ${escapeHtml(eventTitle)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#09090b;padding:32px 16px;">
      <tr>
        <td align="center">
          <!-- Exact Ticket Card Matching Spec Photo -->
          <table role="presentation" width="100%" style="max-width:380px;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:32px;overflow:hidden;padding:28px 24px;box-shadow:0 20px 40px rgba(0,0,0,0.8);">
            <!-- Header -->
            <tr>
              <td>
                <table role="presentation" width="100%">
                  <tr>
                    <td align="left">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="width:32px;height:32px;background-color:#000000;border-radius:10px;text-align:center;vertical-align:middle;color:#ffffff;font-size:16px;">
                            ✦
                          </td>
                          <td style="padding-left:10px;font-size:14px;font-weight:900;letter-spacing:1px;color:#000000;text-transform:uppercase;">
                            ELITE TICKETS
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="vertical-align:top;">
                      <span style="display:block;font-size:10px;font-family:monospace;font-weight:700;color:#a1a1aa;text-transform:uppercase;">REF</span>
                      <span style="display:block;font-size:12px;font-family:monospace;font-weight:900;color:#18181b;margin-top:2px;">#T-${escapeHtml(shortRef)}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:14px 0 10px 0;border-bottom:1px dashed #e4e4e7;"></td>
            </tr>

            <!-- Event Title & Info -->
            <tr>
              <td style="padding-top:14px;">
                <h1 style="margin:0 0 8px 0;font-size:20px;font-weight:900;color:#000000;line-height:1.2;text-transform:uppercase;letter-spacing:-0.5px;">
                  ${escapeHtml(eventTitle)}
                </h1>
                <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;color:#27272a;">
                  📅 ${escapeHtml(formattedDate)}
                </p>
                <p style="margin:0;font-size:12px;color:#71717a;">
                  📍 ${escapeHtml(eventVenue)}
                </p>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:12px 0;border-bottom:1px solid #f4f4f5;"></td>
            </tr>

            <!-- 2-Column Metadata -->
            <tr>
              <td style="padding-top:8px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td width="50%" align="left">
                      <span style="display:block;font-size:10px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">TITULAR</span>
                      <span style="display:block;font-size:13px;font-weight:900;color:#000000;margin-top:2px;">${escapeHtml(ticket.userName)}</span>
                    </td>
                    <td width="50%" align="left">
                      <span style="display:block;font-size:10px;font-weight:700;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.5px;">CATEGORIA / ASSENTO</span>
                      <span style="display:block;font-size:13px;font-weight:900;color:#000000;margin-top:2px;">${escapeHtml(ticket.seatName || 'VIP • A-01')}</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Divider -->
            <tr>
              <td style="padding:14px 0 10px 0;border-bottom:1px dashed #e4e4e7;"></td>
            </tr>

            <!-- QR Code Section -->
            <tr>
              <td align="center" style="padding-top:14px;">
                <table role="presentation" cellspacing="0" cellpadding="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:24px;padding:16px;text-align:center;margin:0 auto;">
                  <tr>
                    <td align="center">
                      <img src="${qrImageUrl}" alt="QR Code de Acesso" width="180" height="180" style="display:block;margin:0 auto;border:0;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Instructions -->
            <tr>
              <td style="padding-top:16px;border-top:1px solid #f4f4f5;margin-top:14px;">
                <table role="presentation" width="100%">
                  <tr>
                    <td style="width:28px;vertical-align:middle;font-size:18px;">
                      📱
                    </td>
                    <td style="padding-left:6px;">
                      <p style="margin:0;font-size:11px;font-weight:700;color:#000000;">
                        Apresente este ingresso na portaria.
                      </p>
                      <p style="margin:2px 0 0 0;font-size:10px;color:#71717a;">
                        Impresso ou no smartphone.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer Micro-Text -->
            <tr>
              <td style="padding-top:12px;border-top:1px solid #f4f4f5;text-align:left;">
                <span style="font-size:9px;font-family:monospace;font-weight:700;color:#a1a1aa;letter-spacing:1px;text-transform:uppercase;">
                  ELITE TICKETS • 2026
                </span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;

  try {
    const senderField = fromEmail.includes('<') ? fromEmail : `Elite Tickets <${fromEmail}>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: senderField,
        to: [ticket.to],
        subject: `Ingresso: ${eventTitle} — Elite Tickets`,
        html: htmlContent
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.warn(`Resend API error status ${response.status}: ${errorText}`);
    } else {
      console.log(`[Resend Success] Real ticket email sent to ${ticket.to} for ${eventTitle}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn(`[Resend Network Error] ${message}`);
  }
}

function escapeHtml(value: string): string {
  return (value || '').replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character] || character));
}
