import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TicketCard } from '../components/TicketCard';
import { SeatMap } from '../components/SeatMap';
import { PrintableTicket } from '../components/PrintableTicket';
import { TicketItem, SeatItem } from '../lib/api';

describe('UI Component Unit Tests', () => {
  const mockTicket: TicketItem = {
    id: 't-1234-5678-90ab',
    event_id: 'e-1',
    seat_id: 's-1',
    user_email: 'rafael@verzel.com.br',
    user_name: 'Rafael Santos',
    status: 'valid',
    qr_signature: 'hmac_sha256_mock_signature_2026',
    created_at: new Date().toISOString(),
    events: {
      id: 'e-1',
      title: 'Tech Summit Elite 2026',
      description: 'Evento Tech de Alta Performance',
      venue: 'Arena Innovation Hub',
      date: new Date().toISOString(),
      price: 299.90,
      banner_url: ''
    },
    seats: {
      id: 's-1',
      event_id: 'e-1',
      row_name: 'A',
      seat_number: 1,
      category: 'VIP',
      price: 499.90,
      status: 'sold'
    }
  };

  it('renders TicketCard with masked reference REF: #T123-4567', () => {
    render(<TicketCard ticket={mockTicket} />);

    expect(screen.getAllByText('Tech Summit Elite 2026')[0]).toBeInTheDocument();
    expect(screen.getAllByText(/REF: #/i)[0]).toBeInTheDocument();
  });

  it('renders SeatMap with highlighted row letters and category legend', () => {
    const mockSeats: SeatItem[] = [
      { id: 's1', event_id: 'e1', row_name: 'A', seat_number: 1, category: 'VIP', price: 499.9, status: 'available' },
      { id: 's2', event_id: 'e1', row_name: 'A', seat_number: 2, category: 'Standard', price: 299.9, status: 'sold' }
    ];

    render(
      <SeatMap
        seats={mockSeats}
        selectedSeatIds={['s1']}
        onToggleSeat={vi.fn()}
      />
    );

    expect(screen.getByText('PALCO / TELA PRINCIPAL')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText('VIP (R$ 499.90)')).toBeInTheDocument();
  });

  it('renders PrintableTicket in vertical Apple Wallet Pass format', () => {
    render(<PrintableTicket ticket={mockTicket} />);

    expect(screen.getByText('PASSE DIGITAL DE ENTRADA')).toBeInTheDocument();
    expect(screen.getByText('✓ ASSINATURA HMAC-SHA256 VERIFICADA')).toBeInTheDocument();
  });
});
