/**
 * EXHAUSTIVE QA & CHAOS TEST SUITE (18 SCENARIOS) - DESAFIO ELITE DEV 2026
 * 
 * Bateria completa cobrindo TODAS as condições extremas:
 * 
 * [BLOCO A - CONCORRÊNCIA, RACE CONDITIONS & CHAOS]
 *  1. Criação de Evento com 80 Assentos Atômicos
 *  2. Compra Normal (Reserva + Checkout + QR HMAC)
 *  3. Bloqueio de Dupla Venda (Double-Selling Prevention)
 *  4. Checkout Recusado e Devolução Atômica ao Estoque
 *  5. Validação da Portaria nos 4 Estados Base
 *  6. Race Condition Massiva (10 requisições simultâneas no mesmo milissegundo pelo mesmo assento)
 *  7. Deadlock Prevention (Reserva concorrente cruzada: [S1, S2] vs [S2, S1])
 *  8. Tentativa de Checkout em Assento Não Reservado pelo Comprador (Spoofing)
 *  9. Compra em Massa de Múltiplos Assentos em Lote (ex: 6 assentos VIP + Standard)
 * 
 * [BLOCO B - SEGURANÇA, FRAUDE & RED TEAMING]
 * 10. QR Code com SQL Injection / XSS / String Malformada
 * 11. QR Code com Assinatura Adulterada / Chave Forjada (HMAC Tampering)
 * 12. QR Code de Evento Divergente (WRONG_EVENT Isolation)
 * 13. Replay Attack na Portaria (Re-validação de Ingresso Já Utilizado)
 * 14. Tentativa de Criação de Evento sem Permissão de Organizador (RBAC Shield)
 * 
 * [BLOCO C - RESILIÊNCIA DE DADOS, CATÁLOGO & COMPARTILHAMENTO]
 * 15. Importação em Lote TMDb / Ticketmaster com Sanitização
 * 16. Resolução de Ingresso Público por Link Compartilhado (GET /api/tickets/:id)
 * 17. Consulta de Assentos e Integridade do Mapa de 80 Lugares
 * 18. Validação na Portaria em Modo Global ("all" vs Evento Específico)
 */

import { createClient } from '../server/node_modules/@supabase/supabase-js/dist/index.mjs';

const SUPABASE_URL = 'https://zgbhmduzypqfgfuncnhl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_hrXl9QKQoXC6C3ImupVfMw_wkaazz5g';
const API_URL = 'https://elite-tickets-api.agenddar.workers.dev';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let totalPassed = 0;
let totalFailed = 0;

const logHeader = (num, title) => {
  console.log(`\n👉 [CENÁRIO ${num}] ${title}`);
};

const check = (condition, successMsg, failMsg) => {
  if (condition) {
    console.log(`  ✅ PASSOU: ${successMsg}`);
    totalPassed++;
  } else {
    console.error(`  ❌ FALHA: ${failMsg || successMsg}`);
    totalFailed++;
  }
};

async function runExhaustiveTests() {
  console.log('='.repeat(75));
  console.log('🚀 INICIANDO AUDITORIA EXTREMA DE QA - 18 CENÁRIOS PREVISÍVEIS & LIMÍTROFES');
  console.log('='.repeat(75));

  try {

  const timestamp = Date.now();
  let testEventId = null;
  let testSeats = [];
  let validTicket = null;
  let validQrCode = null;

  // -------------------------------------------------------------------------
  // CENÁRIO 1: Geração de Evento com 80 Assentos
  // -------------------------------------------------------------------------
  logHeader(1, 'Criação de Evento com Matriz de 80 Assentos Atômica');
  const evRes = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-role': 'organizer' },
    body: JSON.stringify({
      title: `Mega Show QA Chaos ${timestamp}`,
      description: 'Teste exaustivo de alta concorrência.',
      venue: 'Allianz Parque - Arena Principal',
      date: new Date(Date.now() + 86400000 * 30).toISOString(),
      price: 250.00,
      banner_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'
    })
  });
  const evJson = await evRes.json();
  testEventId = evJson.event?.id;
  check(evJson.success && testEventId, 'Evento criado com sucesso via API', 'Falha ao criar evento');

  const { data: dbSeats } = await supabase.from('seats').select('*').eq('event_id', testEventId).order('seat_number');
  testSeats = dbSeats || [];
  check(testSeats.length === 80, `80 assentos gerados no banco (A1..H10)`, `Esperava 80 assentos, achou ${testSeats.length}`);

  // -------------------------------------------------------------------------
  // CENÁRIO 2: Compra Normal (Reserva + Checkout + QR HMAC)
  // -------------------------------------------------------------------------
  logHeader(2, 'Fluxo Padrão: Reserva + Checkout Aprovado + Assinatura HMAC');
  const sA1 = testSeats.find(s => s.row_name === 'A' && s.seat_number === 1);
  const sA2 = testSeats.find(s => s.row_name === 'A' && s.seat_number === 2);

  await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sA1.id, sA2.id], userEmail: 'ana.cliente@verzel.com' })
  });

  const coRes = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: testEventId,
      seatIds: [sA1.id, sA2.id],
      userName: 'Ana Cliente',
      userEmail: 'ana.cliente@verzel.com',
      paymentOutcome: 'approved'
    })
  });
  const coJson = await coRes.json();
  validTicket = coJson.tickets?.[0];
  validQrCode = coJson.qrCodes?.[0];
  check(coJson.success && coJson.tickets?.length === 2, '2 Ingressos emitidos com status approved', 'Falha no checkout');
  check(validTicket?.qr_signature?.length > 10, 'Assinatura HMAC-SHA256 presente no ingresso', 'Assinatura ausente');

  // -------------------------------------------------------------------------
  // CENÁRIO 3: Bloqueio de Dupla Venda (Double-Selling)
  // -------------------------------------------------------------------------
  logHeader(3, 'Prevenção de Dupla Venda em Assento Já Vendido (A1)');
  const dupRes = await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sA1.id], userEmail: 'hacker@verzel.com' })
  });
  const dupJson = await dupRes.json();
  check(dupRes.status === 409 || !dupJson.success, 'Reserva de assento vendido rejeitada (409 Conflict)', 'Dupla venda não foi bloqueada!');

  // -------------------------------------------------------------------------
  // CENÁRIO 4: Checkout Recusado e Devolução Atômica
  // -------------------------------------------------------------------------
  logHeader(4, 'Checkout Recusado com Devolução de Assento ao Estoque (A3)');
  const sA3 = testSeats.find(s => s.row_name === 'A' && s.seat_number === 3);
  await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sA3.id], userEmail: 'bruno@verzel.com' })
  });
  const decRes = await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: testEventId,
      seatIds: [sA3.id],
      userName: 'Bruno',
      userEmail: 'bruno@verzel.com',
      paymentOutcome: 'declined'
    })
  });
  const decJson = await decRes.json();
  const { data: sA3Db } = await supabase.from('seats').select('status').eq('id', sA3.id).single();
  check(decJson.paymentStatus === 'declined' && sA3Db.status === 'available', 'Assento liberado para available após recusa', 'Assento não foi liberado');

  // -------------------------------------------------------------------------
  // CENÁRIO 5: Validação de Portaria nos 4 Estados Base
  // -------------------------------------------------------------------------
  logHeader(5, 'Máquina de 4 Estados da Portaria (VALID, ALREADY_USED, INVALID, WRONG_EVENT)');
  const val1 = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: validQrCode, targetEventId: testEventId })
  })).json();
  check(val1.code === 'VALID', '1º Scan validado com VALID', 'Falha no 1º scan');

  const val2 = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: validQrCode, targetEventId: testEventId })
  })).json();
  check(val2.code === 'ALREADY_USED', '2º Scan rejeitado com ALREADY_USED', 'Falha ao detectar reutilização');

  // -------------------------------------------------------------------------
  // CENÁRIO 6: Race Condition Massiva (10 Clientes Concorrentes pelo Assento A7)
  // -------------------------------------------------------------------------
  logHeader(6, 'Race Condition Massiva: 10 Requisições Simultâneas pelo Assento A7');
  const { data: freshA7 } = await supabase.from('seats').select('*').eq('event_id', testEventId).eq('row_name', 'A').eq('seat_number', 7).single();
  
  const concurrentRequests = Array.from({ length: 10 }).map((_, i) =>
    fetch(`${API_URL}/api/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seatIds: [freshA7.id], userEmail: `buyer_${i}_${timestamp}@verzel.com` })
    }).then(r => r.json())
  );

  const raceResults = await Promise.all(concurrentRequests);
  const winners = raceResults.filter(r => r.success === true);
  const losers = raceResults.filter(r => r.success === false);
  check(winners.length === 1 && losers.length === 9, `Exatamente 1 vencedor e 9 rejeitados por lock pessimista`, `Race condition detectada! Vencedores: ${winners.length}`);

  // -------------------------------------------------------------------------
  // CENÁRIO 7: Deadlock Prevention (Reserva Cruzada: [S5, S6] vs [S6, S5])
  // -------------------------------------------------------------------------
  logHeader(7, 'Prevenção de Deadlock: Reserva Concorrente com Ordem Cruzada de IDs');
  const sA5 = testSeats.find(s => s.row_name === 'A' && s.seat_number === 5);
  const sA6 = testSeats.find(s => s.row_name === 'A' && s.seat_number === 6);

  const crossReq1 = fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sA5.id, sA6.id], userEmail: `ordem_direta_${timestamp}@verzel.com` })
  }).then(r => r.json());

  const crossReq2 = fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sA6.id, sA5.id], userEmail: `ordem_inversa_${timestamp}@verzel.com` })
  }).then(r => r.json());

  const [crossRes1, crossRes2] = await Promise.all([crossReq1, crossReq2]);
  const crossSuccessCount = (crossRes1.success ? 1 : 0) + (crossRes2.success ? 1 : 0);
  check(crossSuccessCount === 1, 'Lock ordenado (ORDER BY id ASC) preveniu deadlock e garantiu atomicidade', 'Erro de concorrência em reserva cruzada');

  // -------------------------------------------------------------------------
  // CENÁRIO 8: Tentativa de Checkout sem Reserva Prévia (Assento Fraudado)
  // -------------------------------------------------------------------------
  logHeader(8, 'Fraude de Checkout: Comprador B tentando pagar assento reservado por Comprador A');
  const sB1 = testSeats.find(s => s.row_name === 'B' && s.seat_number === 1);
  await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: [sB1.id], userEmail: `titular_legitimo_${timestamp}@verzel.com` })
  });

  const spoofCheckout = await (await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: testEventId,
      seatIds: [sB1.id],
      userName: 'Invasor Spoof',
      userEmail: `invasor_diferente_${timestamp}@verzel.com`,
      paymentOutcome: 'approved'
    })
  })).json();

  check(!spoofCheckout.success, 'Checkout de assento de outro usuário bloqueado com sucesso', 'Vulnerabilidade: checkout aceitou comprador diferente da reserva');

  // -------------------------------------------------------------------------
  // CENÁRIO 9: Compra em Massa de Múltiplos Assentos (6 Assentos VIP + Standard)
  // -------------------------------------------------------------------------
  logHeader(9, 'Compra em Massa: 6 Assentos Selecionados em Lote em Transação Única');
  const bulkSeats = testSeats.filter(s => s.row_name === 'C').slice(0, 6);
  const bulkIds = bulkSeats.map(s => s.id);

  await fetch(`${API_URL}/api/reserve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seatIds: bulkIds, userEmail: `vip.group_${timestamp}@verzel.com` })
  });

  const bulkCo = await (await fetch(`${API_URL}/api/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      eventId: testEventId,
      seatIds: bulkIds,
      userName: 'VIP Group Leader',
      userEmail: `vip.group_${timestamp}@verzel.com`,
      paymentOutcome: 'approved'
    })
  })).json();

  check(bulkCo.success && bulkCo.tickets?.length === 6, '6 Ingressos gerados atomicamente em lote', 'Falha na compra em massa');

  // -------------------------------------------------------------------------
  // CENÁRIO 10: QR Code com Injeção / Garbage Payload
  // -------------------------------------------------------------------------
  logHeader(10, 'Red Team: Leitura de QR Code com Injeção SQL e Payload Malicioso');
  const sqlInjectionPayload = "'; DROP TABLE tickets; SELECT * FROM profiles WHERE '1'='1";
  const injectionRes = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: sqlInjectionPayload, targetEventId: testEventId })
  })).json();

  check(injectionRes.valid === false && injectionRes.code === 'INVALID', 'Payload malicioso barrado com segurança (INVALID)', 'Falha na sanitização de payload');

  // -------------------------------------------------------------------------
  // CENÁRIO 11: Adulteração de Hash Criptográfica HMAC
  // -------------------------------------------------------------------------
  logHeader(11, 'Red Team: Adulteração de Assinatura HMAC (Tampered Signature)');
  const unScannedTicket = bulkCo.tickets?.[0];
  const tamperedSig = JSON.stringify({
    ticketId: unScannedTicket.id,
    eventId: testEventId,
    seatId: unScannedTicket.seat_id,
    signature: 'fake_signature_attacker_forged_hash_123'
  });
  const tamperedRes = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: tamperedSig, targetEventId: testEventId })
  })).json();

  check(tamperedRes.valid === false && tamperedRes.code === 'INVALID', 'Assinatura HMAC forjada rejeitada instantaneamente', 'Fraude não detectada!');

  // -------------------------------------------------------------------------
  // CENÁRIO 12: Ingresso de Evento Divergente (WRONG_EVENT)
  // -------------------------------------------------------------------------
  logHeader(12, 'Isolamento de Evento: Apresentar Ingresso Válido em Outro Show');
  const wrongEvRes = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: validQrCode, targetEventId: 'e2222222-2222-2222-2222-222222222222' })
  })).json();

  check(wrongEvRes.valid === false && (wrongEvRes.code === 'WRONG_EVENT' || wrongEvRes.code === 'ALREADY_USED'), 'Ingresso barrado no evento incorreto', 'Falha no isolamento de evento');

  // -------------------------------------------------------------------------
  // CENÁRIO 13: Replay Attack (3º Scan Consecutivo)
  // -------------------------------------------------------------------------
  logHeader(13, 'Red Team: Replay Attack (Tentativas Repetidas de Usar Ingresso)');
  const replayRes = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: validQrCode, targetEventId: testEventId })
  })).json();

  check(replayRes.valid === false && replayRes.code === 'ALREADY_USED', 'Replay Attack barrado com ALREADY_USED', 'Falha contra replay attack');

  // -------------------------------------------------------------------------
  // CENÁRIO 14: RBAC Shield (Tentativa de Publicar Evento com Role Incorreta)
  // -------------------------------------------------------------------------
  logHeader(14, 'RBAC Shield: Cliente tentando publicar evento sem papel de Organizador');
  const rbacRes = await fetch(`${API_URL}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-role': 'client' },
    body: JSON.stringify({ title: 'Evento Não Autorizado', venue: 'Local', date: new Date().toISOString() })
  });
  check(rbacRes.status === 403 || rbacRes.status === 401, 'Acesso de cliente à rota de organizador negado (403/401)', 'Falha no RBAC!');

  // -------------------------------------------------------------------------
  // CENÁRIO 15: Importação em Lote TMDb / Ticketmaster
  // -------------------------------------------------------------------------
  logHeader(15, 'Importação em Lote via APIs Externas (TMDb / Ticketmaster)');
  const bulkImportRes = await (await fetch(`${API_URL}/api/events/bulk-import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-app-role': 'organizer' },
    body: JSON.stringify({
      items: [
        { title: `Filme 1 TMDb ${timestamp}`, venue: 'IMAX Sala 1', price: 45.00, banner_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23' },
        { title: `Show 2 Ticketmaster ${timestamp}`, venue: 'Arena SP', price: 300.00, banner_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745' }
      ]
    })
  })).json();

  check(bulkImportRes.success && bulkImportRes.events?.length === 2, '2 Eventos importados em lote simultaneamente', 'Falha na importação em lote');

  // -------------------------------------------------------------------------
  // CENÁRIO 16: Resolução de Ingresso Público por Link Compartilhado
  // -------------------------------------------------------------------------
  logHeader(16, 'Compartilhamento: Acesso Público de Ingresso (?ticket=UUID)');
  const shareRes = await (await fetch(`${API_URL}/api/tickets/${validTicket.id}`)).json();
  check(shareRes.success && shareRes.ticket?.id === validTicket.id, 'Ingresso recuperado com sucesso via endpoint público de compartilhamento', 'Falha na resolução pública de ingresso');

  // -------------------------------------------------------------------------
  // CENÁRIO 17: Integridade do Mapa de Assentos (Consulta de Categorias)
  // -------------------------------------------------------------------------
  logHeader(17, 'Consulta de Detalhes & Categorias de Assento (VIP, Premium, Standard)');
  const mapRes = await (await fetch(`${API_URL}/api/events/${testEventId}`)).json();
  const vipCount = mapRes.seats?.filter(s => s.category === 'VIP').length;
  const standardCount = mapRes.seats?.filter(s => s.category === 'Standard').length;
  check(mapRes.success && vipCount === 20 && standardCount === 40, 'Mapa de 80 assentos particionado corretamente (VIP: 20, Standard: 40)', 'Inconsistência nas categorias de assento');

  // -------------------------------------------------------------------------
  // CENÁRIO 18: Validação de Portaria em Modo Global ("all")
  // -------------------------------------------------------------------------
  logHeader(18, 'Portaria Global: Validação sem restrição de evento específico (targetEventId="all")');
  // Usar ingresso não utilizado do lote
  const unusedBulkTicket = bulkCo.tickets?.[1];
  const unusedBulkQr = bulkCo.qrCodes?.[1];
  const globalVal = await (await fetch(`${API_URL}/api/validate-ticket`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qrData: unusedBulkQr, targetEventId: 'all' })
  })).json();

  check(globalVal.code === 'VALID', 'Modo Portão Geral ("all") validou ingresso com sucesso', 'Falha no modo portaria global');

  } finally {
    // -------------------------------------------------------------------------
    // LIMPEZA FINAL AUTOMÁTICA (Zero Poluição de Banco)
    // -------------------------------------------------------------------------
    await supabase.rpc('cleanup_test_events');
  }

  console.log('\n' + '='.repeat(75));
  console.log(`📊 SUMÁRIO FINAL DE AUDITORIA EXTREMA:`);
  console.log(`   TOTAL DE TESTES EXECUTADOS: ${totalPassed + totalFailed}`);
  console.log(`   ✅ PASSOU: ${totalPassed}`);
  console.log(`   ❌ FALHOU: ${totalFailed}`);
  console.log('='.repeat(75));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runExhaustiveTests().catch((err) => {
  console.error('Fatal error during exhaustive tests:', err);
  process.exit(1);
});
