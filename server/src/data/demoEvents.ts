import { EventItem, SeatItem } from '../types';

export const DEMO_EVENTS: EventItem[] = [
  {
    id: 'e1111111-1111-1111-1111-111111111111',
    title: 'Tech Summit Elite 2026',
    description: 'O maior evento de engenharia de software, arquitetura distribuída e inteligência artificial da América Latina.',
    venue: 'Arena Innovation Hub - São Paulo, SP',
    date: '2026-11-20T19:00:00.000Z',
    price: 299.90,
    banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e2222222-2222-2222-2222-222222222222',
    title: 'CyberSecurity World Expo',
    description: 'Encontro internacional de especialistas em segurança ofensiva, criptografia pós-quântica e defesa cibernética.',
    venue: 'Expo Center Norte - São Paulo, SP',
    date: '2026-12-05T14:00:00.000Z',
    price: 349.00,
    banner_url: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e3333333-3333-3333-3333-333333333333',
    title: 'Neon Pulse Music & Visuals',
    description: 'Festival imersivo de música eletrônica com palcos holográficos e instalações de luz sincronizadas.',
    venue: 'Allianz Parque - São Paulo, SP',
    date: '2026-12-31T21:00:00.000Z',
    price: 190.00,
    banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    title: 'Sinfonia Cinema & Games 2026',
    description: 'Orquestra ao vivo executando trilhas sonoras icônicas de filmes clássicos e jogos lendários.',
    venue: 'Sala São Paulo - São Paulo, SP',
    date: '2026-10-18T20:00:00.000Z',
    price: 180.00,
    banner_url: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e5555555-5555-5555-5555-555555555555',
    title: 'DevOps & Cloud Native Day',
    description: 'Workshops práticos sobre Kubernetes, Edge Computing com Workers e automação de alta performance.',
    venue: 'Centro de Convenções Rebouças - SP',
    date: '2026-11-12T09:00:00.000Z',
    price: 220.00,
    banner_url: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'e6666666-6666-6666-6666-666666666666',
    title: 'Stand-Up Comedy All-Stars',
    description: 'Uma noite especial com os maiores comediantes do Brasil gravando seus novos especiais.',
    venue: 'Teatro Bradesco - São Paulo, SP',
    date: '2026-10-30T21:30:00.000Z',
    price: 120.00,
    banner_url: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80'
  }
];

export const generateDemoSeats = (eventId: string): SeatItem[] => {
  const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  const seats: SeatItem[] = [];

  rows.forEach((row) => {
    for (let num = 1; num <= 10; num++) {
      const seatId = `s-${eventId}-${row}-${num}`;
      const isVip = row === 'A' || row === 'B';
      const isPremium = row === 'C' || row === 'D';
      seats.push({
        id: seatId,
        event_id: eventId,
        row_name: row,
        seat_number: num,
        category: isVip ? 'VIP' : isPremium ? 'Premium' : 'Standard',
        price: isVip ? 499.90 : isPremium ? 349.90 : 199.90,
        status: 'available'
      });
    }
  });
  return seats;
};
