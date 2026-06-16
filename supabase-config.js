/* ===== FREEDOM CLASS — Supabase 설정 ===== */
/* Supabase 대시보드 → Settings → API 에서 확인하세요 */

var SUPABASE_URL  = 'https://ovfqxufzrdzqlitsuokv.supabase.co';
var SUPABASE_ANON = 'sb_publishable_Wt1QDZnP_NlRum3eO43SuQ_Ln0lhuGS';

var _supa = null;
function getSupabase() {
  if (_supa) return _supa;
  _supa = supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _supa;
}

/* 현재 로그인된 사용자 가져오기 */
async function getUser() {
  var s = getSupabase();
  var res = await s.auth.getUser();
  return res.data.user || null;
}

/* 로그인 페이지로 이동 */
function requireLogin() {
  window.location.href = '/login/';
}
