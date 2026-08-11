/**
 * Módulo Criptográfico HMAC-SHA256 utilizando a Web Crypto API nativa do Node / Cloudflare Workers.
 */

export interface TicketPayload {
  ticketId: string;
  eventId: string;
  seatId: string;
  clientId: string; // E-mail ou ID do comprador
  issuedAt: number;
  nonce?: string;
}

/**
 * Gera a assinatura HMAC-SHA256 combinando ticket_id, event_id, client_id e a chave secreta.
 */
export async function signTicketPayload(payload: TicketPayload, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const dataToSign = encoder.encode(
    `${payload.ticketId}:${payload.eventId}:${payload.seatId}:${payload.clientId}:${payload.issuedAt}`
  );

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, dataToSign);
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  return signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Valida a assinatura HMAC-SHA256 recebida.
 */
export async function verifyTicketSignature(
  payload: TicketPayload,
  providedSignature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = await signTicketPayload(payload, secret);
  return expectedSignature === providedSignature;
}
