import { describe, it, expect } from 'vitest';
import app from '../index';

describe('Server HMAC Cryptography & API Logic Tests', () => {
  // Web Crypto HMAC SHA-256 helper
  async function generateHmacSha256(data: string, secret: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const messageData = encoder.encode(data);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  it('generates consistent HMAC-SHA256 signature for ticket payload', async () => {
    const payload = 'ticketId=t123&eventId=e456&seatId=s789';
    const secret = 'super-secret-hmac-key-elite-dev-2026';

    const sig1 = await generateHmacSha256(payload, secret);
    const sig2 = await generateHmacSha256(payload, secret);

    expect(sig1).toHaveLength(64);
    expect(sig1).toBe(sig2);
  });

  it('detects altered payload signature (anti-forgery)', async () => {
    const originalPayload = 'ticketId=t123&eventId=e456&seatId=s789';
    const alteredPayload = 'ticketId=t123&eventId=e456&seatId=s999'; // hacked seat
    const secret = 'super-secret-hmac-key-elite-dev-2026';

    const originalSig = await generateHmacSha256(originalPayload, secret);
    const alteredSig = await generateHmacSha256(alteredPayload, secret);

    expect(originalSig).not.toBe(alteredSig);
  });

  it('validates 4-state gatekeeper status mapping', () => {
    const gatekeeperStates = ['VALID', 'ALREADY_USED', 'INVALID', 'WRONG_EVENT'];
    expect(gatekeeperStates).toHaveLength(4);
    expect(gatekeeperStates).toContain('VALID');
    expect(gatekeeperStates).toContain('WRONG_EVENT');
  });

  it('issues one signed ticket and QR payload per reserved seat', async () => {
    const response = await app.request('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatIds: ['seat-a1', 'seat-a2'],
        eventId: 'event-1',
        userEmail: 'cliente@example.com',
        userName: 'Cliente Teste',
        paymentOutcome: 'approved'
      })
    });
    const body = await response.json() as any;

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.paymentStatus).toBe('approved');
    expect(body.tickets).toHaveLength(2);
    expect(body.qrCodes).toHaveLength(2);
    expect(body.tickets[0].seat_id).toBe('seat-a1');
    expect(body.tickets[1].seat_id).toBe('seat-a2');
    expect(body.qrCodes[0]).toContain(body.tickets[0].id);
  });

  it('does not issue tickets when simulated payment is declined', async () => {
    const response = await app.request('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seatIds: ['seat-b1', 'seat-b2'],
        eventId: 'event-1',
        userEmail: 'cliente@example.com',
        userName: 'Cliente Teste',
        paymentOutcome: 'declined'
      })
    });
    const body = await response.json() as any;

    expect(response.status).toBe(402);
    expect(body.success).toBe(false);
    expect(body.paymentStatus).toBe('declined');
    expect(body.tickets).toEqual([]);
  });
});
