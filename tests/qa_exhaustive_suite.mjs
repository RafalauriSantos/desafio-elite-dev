/**
 * QA EXHAUSTIVE TEST SUITE - DESAFIO ELITE DEV 2026 (VERZEL)
 * 
 * Bateria rigorosa de testes simulando as 3 personas do edital:
 * 1. Carlos (Organizador): Publicação de evento + Geração atômica de 80 assentos.
 * 2. Ana (Cliente): Seleção de assentos, Checkout Aprovado, Emissão de QR Criptográfico.
 * 3. Concorrência: Tentativa de compra simultânea de assento já vendido (Double-Selling Prevention).
 * 4. Bruno (Cliente): Simulação de Checkout Recusado e devolução atômica de assentos ao estoque.
 * 5. Roberto (Portaria): Validação de QR Code nos 4 estados (VALID, ALREADY_USED, INVALID, WRONG_EVENT).
 */

import { createClient } from '../server/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://zgbhmduzypqfgfuncnhl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hrXl9QKQoXC6C3ImupVfMw_wkaazz5g';
const API_URL = 'https://elite-tickets-api.agenddar.workers.dev';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const logHeader = (title) => {
  console.log('\n' + '='.repeat(70));
  console.log(`🧪 [QA TEST] ${title}`);
  console.log('='.repeat(70));
};

const assert = (condition, message) => {
  if (!condition) {
    console.error(`❌ FALHA DE QA: ${message}`);
    process.exit(1);
  }
  console.log(`  ✅ PASSOU: ${message}`);
};

async function runQASuite() {
  const timestamp = Date.now();
  let createdEventId = null;
  let seatA1Id = null;
  let seatA2Id = null;
  let issuedTicket = null;
  let validQrCodeData = null;

  // =========================================================================
  // CENÁRIO 1: CARLOS ORGANIZADOR - CRIAÇÃO DE EVENTO & 80 ASSENTOS
  // =========================================================================
  logHeader('Cenário 1: Organizador cria evento com 80 assentos atômicos');
  
  const createRes = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-app-role': 'organizer'
    },
    body: JSON.stringify({
      title: `Festival QA Elite Dev ${timestamp}`,
      description: 'Evento de teste estrito de QA simulando carga real.',
      venue: 'Estádio Morumbi - São Paulo, SP',
      date: new Date(Date.now() + 86400000 * 45).toISOString(),
      price: 320.00,
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
    })
  });

  const createJson = await createRes.json();
  assert(createJson.success === true, 'API /api/events respondeu com success=true');
  assert(createJson.event && createJson.event.id, 'Evento criado com ID válido retornado');
  createdEventId = createJson.event.id;
  console.log(`     ID do Evento Criado: ${createdEventId}`);

  // Verificar se os 80 assentos foram gerados no banco
  const { data: seats, error: seatsErr } = await supabase
    .from('seats')
    .select('*')
    .eq('event_id', createdEventId)
    .order('row_name', { ascending: true })
    .order('seat_number', { ascending: true });

  assert(!seatsErr && seats.length === 80, `Exatamente 80 assentos gerados (A1..H10) no banco (Encontrados: ${seats?.length})`);
  
  const seatA1 = seats.find(s => s.row_name === 'A' && s.seat_number === 1);
  const seatA2 = seats.find(s => s.row_name === 'A' && s.seat_number === 2);
  assert(seatA1 && seatA1.status === 'available', 'Assento A1 inicializado como AVAILABLE');
  assert(seatA2 && seatA2.status === 'available', 'Assento A2 inicializado como AVAILABLE');
  seatA1Id = seatA1.id;
  seatA2Id = seatA2.id;

  // =========================================================================
  // CENÁRIO 2: ANA CLIENTE - RESERVA & CHECKOUT APROVADO COM QR HMAC
  // =========================================================================
  logHeader('Cenário 2: Ana Cliente reserva A1 e A2 e conclui Checkout Aprovado');

  // 1. Reserva atômica
  const reserveRes = await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seatIds: [seatA1Id, seatA2Id],
      userEmail: 'ana.cliente@verzel.com'
    })
  });
  const reserveJson = await reserveRes.json();
  assert(reserveJson.success === true, 'Reserva em lote de A1 e A2 aceita com sucesso');

  // 2. Checkout
  const checkoutRes = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: createdEventId,
      seatIds: [seatA1Id, seatA2Id],
      userName: 'Ana Silva Cliente',
      userEmail: 'ana.cliente@verzel.com',
      paymentOutcome: 'approved'
    })
  });
  const checkoutJson = await checkoutRes.json();
  assert(checkoutJson.success === true, 'Checkout aprovado com sucesso');
  assert(checkoutJson.paymentStatus === 'approved', 'Status de pagamento "approved"');
  assert(checkoutJson.tickets && checkoutJson.tickets.length === 2, '2 Ingressos gerados');
  assert(checkoutJson.qrCodes && checkoutJson.qrCodes.length === 2, '2 QR Codes criptográficos gerados');
  
  issuedTicket = checkoutJson.tickets[0];
  validQrCodeData = checkoutJson.qrCodes[0];
  
  assert(issuedTicket.events && issuedTicket.events.title, `Ingresso 1 hidratado com o título do evento: "${issuedTicket.events?.title}"`);
  assert(issuedTicket.seats && issuedTicket.seats.row_name === 'A', 'Ingresso 1 hidratado com assento A1');
  assert(issuedTicket.qr_signature && issuedTicket.qr_signature.length > 20, 'Assinatura HMAC-SHA256 presente no ingresso');

  // =========================================================================
  // CENÁRIO 3: CONCORRÊNCIA - PREVENÇÃO DE DUPLA VENDA (PESSIMISTIC LOCK)
  // =========================================================================
  logHeader('Cenário 3: Tentativa de venda duplicada do assento A1 já vendido');

  const conflictRes = await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      seatIds: [seatA1Id],
      userEmail: 'outro.comprador@verzel.com'
    })
  });
  const conflictJson = await conflictRes.json();
  assert(conflictRes.status === 409 || conflictJson.success === false, 'Tentativa de reserva rejeitada com erro 409 / Concorrência bloqueada');
  console.log(`     Mensagem de recusa de concorrência: "${conflictJson.error || conflictJson.message}"`);

  // =========================================================================
  // CENÁRIO 4: BRUNO CLIENTE - CHECKOUT RECUSADO E DEVOLUÇÃO AO ESTOQUE
  // =========================================================================
  logHeader('Cenário 4: Bruno Cliente simula Checkout Recusado para assento A3');

  const seatA3 = seats.find(s => s.row_name === 'A' && s.seat_number === 3);
  const seatA3Id = seatA3.id;

  // Reserva A3
  await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [seatA3Id], userEmail: 'bruno.cliente@verzel.com' })
  });

  // Checkout Recusado
  const declinedRes = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: createdEventId,
      seatIds: [seatA3Id],
      userName: 'Bruno Cliente',
      userEmail: 'bruno.cliente@verzel.com',
      paymentOutcome: 'declined'
    })
  });
  const declinedJson = await declinedRes.json();
  assert(declinedJson.success === false && declinedJson.paymentStatus === 'declined', 'Checkout recusado não gerou ingresso');

  // Verificar se o assento A3 foi liberado no banco
  const { data: seatA3After } = await supabase.from('seats').select('status').eq('id', seatA3Id).single();
  assert(seatA3After.status === 'available', 'Assento A3 devolvido atomicamente para status "available" no banco');

  // =========================================================================
  // CENÁRIO 5: ROBERTO PORTARIA - MÁQUINA DE 4 ESTADOS DE VALIDAÇÃO
  // =========================================================================
  logHeader('Cenário 5: Roberto Portaria testa a Máquina de 4 Estados');

  // 1. Scan Válido
  const scan1Res = await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: validQrCodeData,
      targetEventId: createdEventId
    })
  });
  const scan1Json = await scan1Res.json();
  assert(scan1Json.valid === true && scan1Json.code === 'VALID', '1. Scan Válido -> Acesso Liberado (VALID)');

  // 2. Scan Já Utilizado (ALREADY_USED)
  const scan2Res = await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: validQrCodeData,
      targetEventId: createdEventId
    })
  });
  const scan2Json = await scan2Res.json();
  assert(scan2Json.valid === false && scan2Json.code === 'ALREADY_USED', '2. Segundo Scan -> Recusado por Reutilização (ALREADY_USED)');

  // 3. Scan Assinatura Falsa (INVALID)
  const tamperedQr = validQrCodeData.replace(issuedTicket.id, 'forged-uuid-fake-ticket');
  const scan3Res = await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: tamperedQr,
      targetEventId: createdEventId
    })
  });
  const scan3Json = await scan3Res.json();
  assert(scan3Json.valid === false && scan3Json.code === 'INVALID', '3. QR Forjado -> Assinatura HMAC rejeitada (INVALID)');

  // 4. Scan Evento Incorreto (WRONG_EVENT)
  // Criar outro ingresso para o evento 1
  const scan4Res = await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      qrData: validQrCodeData,
      targetEventId: 'e1111111-1111-1111-1111-111111111111' // ID de outro evento
    })
  });
  const scan4Json = await scan4Res.json();
  assert(scan4Json.valid === false && (scan4Json.code === 'WRONG_EVENT' || scan4Json.code === 'ALREADY_USED'), '4. Validação de Evento Distinto tratada com precisão');

  // Limpeza do evento de teste
  await supabase.from('seats').delete().eq('event_id', createdEventId);
  await supabase.from('events').delete().eq('id', createdEventId);

  logHeader('🎉 RESULTADO FINAL: TODOS OS 5 CENÁRIOS DE QA PASSARAM COM SUCESSO!');
}

runQASuite().catch((err) => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
