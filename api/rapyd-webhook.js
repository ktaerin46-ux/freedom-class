/**
 * Rapyd 결제 완료 웹훅 핸들러
 *
 * Rapyd 대시보드에서 웹훅 URL을 아래로 설정하세요:
 *   https://freedom-class.vercel.app/api/rapyd-webhook
 *
 * 이벤트: PAYMENT_COMPLETED (payment.status === "CLO")
 *
 * 결제 생성 시 metadata에 user_email 포함 필수:
 *   metadata: { user_email: "buyer@example.com" }
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  /* ── 웹훅 서명 검증 (선택 — RAPYD_WEBHOOK_SECRET 설정 시 활성화) ── */
  const webhookSecret = process.env.RAPYD_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers['signature'] || req.headers['x-rapyd-signature'] || '';
    const body = JSON.stringify(req.body);
    const hmac = crypto.createHmac('sha256', webhookSecret).update(body).digest('hex');
    if (hmac !== signature) {
      console.error('Rapyd 웹훅 서명 불일치');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  }

  const event = req.body;
  const eventType = event.type;

  console.log('[Rapyd Webhook]', eventType, JSON.stringify(event).slice(0, 300));

  /* ── PAYMENT_COMPLETED 이벤트만 처리 ── */
  if (eventType !== 'PAYMENT_COMPLETED') {
    return res.status(200).json({ received: true, action: 'ignored' });
  }

  /* ── payment 데이터 파싱 ── */
  const payment = (event.data && event.data.payment) || event.data || {};
  const status = payment.status;           /* 'CLO' = Closed/완료 */
  const metadata = payment.metadata || {};
  const userEmail = metadata.user_email || metadata.email || '';
  const amount = payment.amount || 0;
  const currency = payment.currency || 'KRW';
  const paymentId = payment.id || '';

  /* 결제 완료 상태 확인 (CLO = Closed = 완료) */
  if (status !== 'CLO') {
    return res.status(200).json({ received: true, action: 'not_completed', status });
  }

  if (!userEmail) {
    console.error('[Rapyd Webhook] metadata에 user_email 없음. payment:', paymentId);
    return res.status(200).json({ received: true, action: 'no_email', paymentId });
  }

  /* ── Supabase Admin 클라이언트 (service role key 사용) ── */
  const supabaseUrl = process.env.SUPABASE_URL || 'https://ovfqxufzrdzqlitsuokv.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    console.error('[Rapyd Webhook] SUPABASE_SERVICE_ROLE_KEY 환경 변수가 없습니다');
    return res.status(500).json({ error: 'Server config error' });
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  /* ── user_profiles에서 이메일로 사용자 찾기 ── */
  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('id, has_access')
    .eq('email', userEmail)
    .single();

  if (profileError || !profile) {
    console.error('[Rapyd Webhook] 사용자를 찾지 못함:', userEmail);
    /* 사용자 등록 전 결제한 경우 — orders에만 기록 후 대기 */
    await supabase.from('orders').insert({
      user_email: userEmail,
      amount: amount,
      payment_method: 'rapyd',
      payment_ref: paymentId,
      notes: '웹훅 자동 기록 — 사용자 미등록 상태. 로그인 후 수동 활성화 필요',
    });
    return res.status(200).json({ received: true, action: 'user_not_found', email: userEmail });
  }

  /* ── 이미 access 있으면 orders에만 기록 ── */
  if (profile.has_access) {
    await supabase.from('orders').insert({
      user_id: profile.id,
      user_email: userEmail,
      amount: amount,
      payment_method: 'rapyd',
      payment_ref: paymentId,
      notes: '웹훅 자동 기록 — 이미 활성 상태',
    });
    return res.status(200).json({ received: true, action: 'already_active' });
  }

  /* ── has_access = true 업데이트 ── */
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      has_access: true,
      access_granted_at: new Date().toISOString(),
      access_note: `Rapyd 자동결제 완료 (${paymentId}) ${amount.toLocaleString()}${currency}`,
      updated_at: new Date().toISOString(),
    })
    .eq('id', profile.id);

  if (updateError) {
    console.error('[Rapyd Webhook] 업데이트 실패:', updateError);
    return res.status(500).json({ error: 'DB update failed' });
  }

  /* ── orders 테이블에 기록 ── */
  await supabase.from('orders').insert({
    user_id: profile.id,
    user_email: userEmail,
    amount: amount,
    payment_method: 'rapyd',
    payment_ref: paymentId,
    notes: '웹훅 자동 결제 완료',
  });

  console.log('[Rapyd Webhook] ✅ 강의 자동 활성화:', userEmail);
  return res.status(200).json({ received: true, action: 'access_granted', email: userEmail });
};
