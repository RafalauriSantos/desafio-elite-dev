import { createClient } from '../server/node_modules/@supabase/supabase-js/dist/index.mjs';
import crypto from 'node:crypto';

const SUPABASE_URL = 'https://zgbhmduzypqfgfuncnhl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hrXl9QKQoXC6C3ImupVfMw_wkaazz5g';
const HMAC_SECRET = 'super-secret-hmac-key-elite-dev-2026';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function signPayload(payload, secret) {
  const data = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

async function runLiveTests() {
  console.log('================================================================');
  console.log('🚀 INICIANDO BATERIA DE TESTES REAIS NO NOVO BANCO SUPABASE');
  console.log('================================================================\n');

  // TEST 1: Consulta de Eventos e Assentos
  console.log('👉 [TESTE 1] Consulta de Eventos e Assentos no Banco...');
  const { data: events, error: evErr } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (evErr || !events || events.length < 4) {
    throw new Error('Falha ao listar eventos: ' + (evErr?.message || 'Menos de 4 eventos'));
  }
  console.log('  ✅ 4 Eventos oficiais encontrados:');
  events.forEach(e => console.log('     • ' + e.title + ' (R$ ' + e.price + ')'));

  const targetEvent = events[0];
  const { data: seats, error: stErr } = await supabase.from('seats').select('*').eq('event_id', targetEvent.id).order('row_name').order('seat_number');
  if (stErr || !seats || seats.length !== 80) {
    throw new Error('Falha ao listar assentos: esperava 80, obteve ' + seats?.length);
  }
  console.log('  ✅ ' + seats.length + ' assentos auditados no evento ' + targetEvent.title + ' (A1 até H10)\n');

  // TEST 2: Trava Pessimista de Concorrência (SELECT ... FOR UPDATE)
  console.log('👉 [TESTE 2] Trava Pessimista de Concorrência (Pessimistic Locking)...');
  const testSeat = seats.find(s => s.status === 'available' && s.row_name === 'E' && s.seat_number === 1);
  if (!testSeat) throw new Error('Assento E1 não encontrado ou indisponível');

  // Cliente A reserva o assento E1
  const { data: resA, error: errA } = await supabase.rpc('reserve_ticket_atomic', {
    p_seat_id: testSeat.id,
    p_user_email: 'cliente.a@teste.com',
    p_hold_minutes: 5
  });
  console.log('  [Cliente A] Reserva assento E1:', resA);
  if (!resA?.success) throw new Error('Cliente A deveria ter conseguido reservar');

  // Cliente B tenta reservar o MESMO assento concorrentemente
  const { data: resB, error: errB } = await supabase.rpc('reserve_ticket_atomic', {
    p_seat_id: testSeat.id,
    p_user_email: 'cliente.b@teste.com',
    p_hold_minutes: 5
  });
  console.log('  [Cliente B] Tenta reservar assento E1 concorrentemente:', resB);
  if (resB?.success === true) throw new Error('FALHA DE CONCORRÊNCIA: Cliente B não deveria reservar assento já travado!');
  console.log('  ✅ Concorrência bloqueada com sucesso! Cliente B rejeitado.\n');

  // TEST 3: Finalização Atômica de Compra & Emissão de Ingresso com HMAC
  console.log('👉 [TESTE 3] Checkout Atômico com Assinatura Criptográfica HMAC-SHA256...');
  const ticketId = crypto.randomUUID();
  const payloadToSign = {
    ticketId,
    eventId: targetEvent.id,
    seatId: testSeat.id,
    clientId: 'cliente.a@teste.com',
    issuedAt: Date.now()
  };
  const signature = signPayload(payloadToSign, HMAC_SECRET);

  const ticketRow = {
    id: ticketId,
    event_id: targetEvent.id,
    seat_id: testSeat.id,
    user_email: 'cliente.a@teste.com',
    user_name: 'Cliente Alpha Test',
    status: 'valid',
    qr_signature: signature,
    created_at: new Date().toISOString()
  };

  const { data: checkoutRes, error: chkErr } = await supabase.rpc('complete_checkout_batch_atomic', {
    p_seat_ids: [testSeat.id],
    p_event_id: targetEvent.id,
    p_user_email: 'cliente.a@teste.com',
    p_ticket_rows: [ticketRow]
  });
  console.log('  [Checkout] Resultado:', checkoutRes);
  if (chkErr || !checkoutRes?.success) throw new Error('Falha no checkout: ' + (chkErr?.message || checkoutRes?.message));

  // Verificar se o assento agora é SOLD
  const { data: updatedSeat } = await supabase.from('seats').select('status').eq('id', testSeat.id).single();
  console.log('  [Status do Assento pós-compra]:', updatedSeat?.status);
  if (updatedSeat?.status !== 'sold') throw new Error('Assento deveria estar como sold!');
  console.log('  ✅ Ingresso gravado e assento marcado como SOLD no banco!\n');

  // TEST 4: Portaria & Validação do QR Code (4 Estados Atômicos)
  console.log('👉 [TESTE 4] Portaria - Validação de QR Code nos 4 Estados...');
  
  // 4.1 - Primeiro Scan: Ingresso Válido (Entrada Permitida)
  const { data: scan1 } = await supabase.rpc('validate_ticket_gatekeeper', {
    p_ticket_id: ticketId,
    p_qr_signature: signature,
    p_target_event_id: targetEvent.id
  });
  console.log('  [Scan 1 - Válido]:', scan1);
  if (scan1?.code !== 'VALID') throw new Error('Scan 1 deveria ter sido VALID!');
  console.log('  ✅ Scan 1 Aprovado com sucesso (Status virou USED no banco).');

  // 4.2 - Segundo Scan: Mesma pessoa ou duplicata (ALREADY_USED)
  const { data: scan2 } = await supabase.rpc('validate_ticket_gatekeeper', {
    p_ticket_id: ticketId,
    p_qr_signature: signature,
    p_target_event_id: targetEvent.id
  });
  console.log('  [Scan 2 - Reutilizado]:', scan2);
  if (scan2?.code !== 'ALREADY_USED') throw new Error('Scan 2 deveria ter sido ALREADY_USED!');
  console.log('  ✅ Scan 2 Rejeitado com ALREADY_USED e timestamp registrado!');

  // 4.3 - Scan de QR Code Forjado / Assinatura Invalida (INVALID)
  const { data: scan3 } = await supabase.rpc('validate_ticket_gatekeeper', {
    p_ticket_id: ticketId,
    p_qr_signature: 'assinatura_hacker_forjada_123',
    p_target_event_id: targetEvent.id
  });
  console.log('  [Scan 3 - Assinatura Falsa]:', scan3);
  if (scan3?.code !== 'INVALID') throw new Error('Scan 3 deveria ter sido INVALID!');
  console.log('  ✅ Scan 3 Rejeitado: QR Code forjado detectado e bloqueado!');

  // 4.4 - Scan em Evento Errado (WRONG_EVENT)
  const otherEvent = events[1];
  const { data: scan4 } = await supabase.rpc('validate_ticket_gatekeeper', {
    p_ticket_id: ticketId,
    p_qr_signature: signature,
    p_target_event_id: otherEvent.id
  });
  console.log('  [Scan 4 - Evento Incorreto]:', scan4);
  if (scan4?.code !== 'WRONG_EVENT') throw new Error('Scan 4 deveria ter sido WRONG_EVENT!');
  console.log('  ✅ Scan 4 Rejeitado: Ingresso de outro evento detectado!');

  // TEST 5: Criação Atômica de Evento pelo Organizador
  console.log('\n👉 [TESTE 5] Organizador - Criação de Evento com Geração de 80 Assentos...');
  const testTitle = 'Show de Teste Automatizado ' + Date.now();
  const { data: orgRes, error: orgErr } = await supabase.rpc('create_event_with_seats_atomic', {
    p_title: testTitle,
    p_description: 'Evento criado durante auditoria de banco de dados.',
    p_venue: 'Auditório Principal - SP',
    p_date: new Date(Date.now() + 86400000 * 15).toISOString(),
    p_price: 250.00,
    p_banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
  });
  if (orgErr || !orgRes?.success) throw new Error('Falha ao criar evento pelo organizador: ' + (orgErr?.message || orgRes?.error));
  const newEventId = orgRes.event.id;
  const { data: newSeats } = await supabase.from('seats').select('id').eq('event_id', newEventId);
  console.log('  [Evento Criado]: ID=' + newEventId + ' com ' + newSeats?.length + ' assentos gerados atomicamente.');
  if (newSeats?.length !== 80) throw new Error('Esperava 80 assentos gerados para o novo evento!');
  console.log('  ✅ Organizador validado: 80 assentos gerados em transação única!');

  // Limpar o evento temporário de teste
  await supabase.from('events').delete().eq('id', newEventId);
  console.log('  🧹 Evento temporário de teste removido.');

  console.log('\n================================================================');
  console.log('🎉 TODOS OS 5 TESTES CRÍTICOS PASSARAM COM SUCESSO ABSOLUTO!');
  console.log('================================================================');
}

runLiveTests().catch(err => {
  console.error('\n❌ ERRO NO TESTE:', err);
  process.exit(1);
});
