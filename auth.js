/* ===== FREEDOM CLASS 공통 인증 스크립트 (Supabase 버전) ===== */
var KAKAO_JS_KEY     = 'ecdd6aee1b7bc3c1b077470126aee7f8';
var KAKAO_CHANNEL_ID = '_nxhFAX';
var FORM_ENDPOINT    = 'https://script.google.com/macros/s/AKfycbz7iiU8EtFwpz6zjNVsl-T-Acl4AM88QlSZ9WlMeMwHv7RAKs7u8EzUiP1ybsJobDdnPw/exec';

/* ── Supabase 설정 ── */
var SUPABASE_URL = 'https://ovfqxufzrdzqlitsuokv.supabase.co';
var SUPABASE_KEY = 'sb_publishable_Wt1QDZnP_NlRum3eO43SuQ_Ln0lhuGS';
var db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

var currentUser = null;

/* ── 로그인 상태 감지 ── */
db.auth.onAuthStateChange(function(event, session) {
  if (!session || !session.user) return;
  var meta = session.user.user_metadata || {};
  currentUser = {
    name:      meta.full_name || meta.name || meta.preferred_username || '',
    email:     session.user.email || '',
    phone:     '',
    loginType: 'kakao',
    kakaoId:   meta.provider_id || '',
  };
  updateNavAfterLogin();

  /* 로그인 직후 카카오 채널 추가 (모달은 자동으로 열지 않음) */
  if (event === 'SIGNED_IN') {
    if (window.Kakao && KAKAO_CHANNEL_ID) {
      if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY);
      try { Kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_ID }); } catch(e) {}
    }
  }
});

/* ── 카카오 로그인 (Supabase OAuth) ── */
function loginWithKakao() {
  db.auth.signInWithOAuth({
    provider: 'kakao',
    options: {
      redirectTo: 'https://freedom-class.vercel.app/free-lecture/index.html',
    }
  });
}

/* ── 로그아웃 ── */
function logoutUser() {
  sessionStorage.removeItem('apply_modal_shown');
  db.auth.signOut().then(function() {
    currentUser = null;
    var nav = document.getElementById('nav-auth');
    if (nav) {
      nav.innerHTML =
        '<button class="nav-btn-login" onclick="openLoginModal()">로그인</button>' +
        '<button class="nav-btn-signup" onclick="openApplyModal()">수강신청</button>';
    }
  });
}

/* ── 모달 제어 ── */
function openLoginModal() {
  if (currentUser) { openApplyModal(); return; }
  document.getElementById('login-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function openApplyModal() {
  document.getElementById('login-modal').style.display = 'none';
  document.getElementById('apply-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
  if (currentUser) {
    document.getElementById('reg-name').value  = currentUser.name  || '';
    document.getElementById('reg-email').value = currentUser.email || '';
    document.getElementById('reg-phone').value = currentUser.phone || '';
  }
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}
function onOverlayClick(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}
function toggleEmailForm(show) {
  var ef = document.getElementById('email-form');
  var eb = document.getElementById('email-toggle-btn');
  if (ef) ef.classList.toggle('show', show);
  if (eb) eb.style.display = show ? 'none' : 'block';
}

/* ── 이메일 로그인 ── */
function loginWithEmail() {
  var email = document.getElementById('email-input').value.trim();
  var pw    = document.getElementById('pw-input').value;
  if (!email || !pw) { alert('이메일과 비밀번호를 입력해주세요.'); return; }
  currentUser = { name: '', email: email, phone: '', loginType: 'email' };
  updateNavAfterLogin();
  openApplyModal();
}

/* ── 로그인 후 네비 업데이트 ── */
function updateNavAfterLogin() {
  var nav = document.getElementById('nav-auth');
  if (!nav || !currentUser) return;
  var displayName = currentUser.name || currentUser.email || '수강생';
  nav.innerHTML =
    '<span class="nav-user-name">' + displayName + ' 님</span>' +
    '<button class="nav-btn-login" onclick="openApplyModal()">수강신청</button>' +
    '<button class="nav-btn-login" onclick="logoutUser()" style="color:#999;font-size:13px;">로그아웃</button>';
}

/* ── 신청 제출 ── */
function submitApply() {
  var name  = document.getElementById('reg-name').value.trim();
  var phone = document.getElementById('reg-phone').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  if (!name)  { alert('이름을 입력해주세요.'); return; }
  if (!phone) { alert('전화번호를 입력해주세요.'); return; }
  if (!email) { alert('이메일을 입력해주세요.'); return; }

  var payload = {
    name:       name,
    phone:      phone,
    email:      email,
    login_type: currentUser ? currentUser.loginType : 'unknown',
    kakao_id:   currentUser ? (currentUser.kakaoId || '') : '',
    lecture:    '[5/30] 구독자 0명에서 가장 빠르게 성장시키는 법 무료 특강',
  };

  /* Supabase DB 저장 */
  db.from('signups').insert(payload).then(function(res) {
    if (res.error) console.error('Supabase insert error:', res.error);
  });

  /* Google Sheets 저장 */
  if (FORM_ENDPOINT) {
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    }).catch(function() {});
  }

  closeModal('apply-modal');
  var msgEl = document.getElementById('success-msg');
  if (msgEl) msgEl.innerHTML = name + ' 님 신청 완료!';
  document.getElementById('success-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/* ── ESC 닫기 ── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['login-modal', 'apply-modal', 'success-modal'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.style.display !== 'none') closeModal(id);
    });
  }
});
