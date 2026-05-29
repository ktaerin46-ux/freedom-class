/* ===== FREEDOM CLASS 공통 인증 스크립트 ===== */
var KAKAO_REST_KEY     = '202dbf29b60b923a688d39742085a545';
var KAKAO_JS_KEY       = 'ecdd6aee1b7bc3c1b077470126aee7f8';
var KAKAO_CHANNEL_ID   = '_nxhFAX';
var FORM_ENDPOINT      = '';
var KAKAO_REDIRECT_URI = 'https://freedom-class.vercel.app/api/kakao-callback';

var currentUser = null;

/* ── 페이지 로드 시 카카오 로그인 결과 처리 ── */
(function checkKakaoCallback() {
  var params = new URLSearchParams(window.location.search);

  if (params.get('kakao_success') === '1') {
    currentUser = {
      name:      decodeURIComponent(params.get('name')     || ''),
      email:     decodeURIComponent(params.get('email')    || ''),
      phone:     '',
      loginType: 'kakao',
      kakaoId:   params.get('kakao_id') || '',
    };
    // URL 파라미터 제거
    window.history.replaceState({}, '', window.location.pathname);

    updateNavAfterLogin();

    // 카카오 채널 추가
    if (window.Kakao && KAKAO_CHANNEL_ID) {
      if (!Kakao.isInitialized()) Kakao.init(KAKAO_JS_KEY);
      try { Kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_ID }); } catch(e) {}
    }

    // 신청 모달 자동 열기
    setTimeout(function() { openApplyModal(); }, 300);
  }

  if (params.get('kakao_error')) {
    alert('카카오 로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    window.history.replaceState({}, '', window.location.pathname);
  }
})();

/* ── 카카오 로그인 (리다이렉트 방식) ── */
function loginWithKakao() {
  var authUrl = 'https://kauth.kakao.com/oauth/authorize'
    + '?client_id=' + KAKAO_REST_KEY
    + '&redirect_uri=' + encodeURIComponent(KAKAO_REDIRECT_URI)
    + '&response_type=code'
    + '&scope=profile_nickname%2Caccount_email';
  window.location.href = authUrl;
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
  document.getElementById('email-form').classList.toggle('show', show);
  document.getElementById('email-toggle-btn').style.display = show ? 'none' : 'block';
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
    '<button class="nav-btn-login" onclick="openApplyModal()">수강신청</button>';
}

/* ── 신청 제출 ── */
function submitApply() {
  var name  = document.getElementById('reg-name').value.trim();
  var phone = document.getElementById('reg-phone').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var age   = document.getElementById('reg-age').value;
  if (!name)  { alert('이름을 입력해주세요.'); return; }
  if (!phone) { alert('전화번호를 입력해주세요.'); return; }
  if (!email) { alert('이메일을 입력해주세요.'); return; }
  if (!age)   { alert('연령대를 선택해주세요.'); return; }

  var payload = {
    name: name, phone: phone, email: email, age: age,
    loginType: currentUser ? currentUser.loginType : 'unknown',
    kakaoId:   currentUser ? (currentUser.kakaoId || '') : '',
    lecture: '[5/30] 구독자 0명에서 가장 빠르게 성장시키는 법 무료 특강',
    submittedAt: new Date().toISOString(),
  };

  if (FORM_ENDPOINT) {
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(function() {});
  }

  try {
    var saved = JSON.parse(localStorage.getItem('fc_signups') || '[]');
    saved.push(payload);
    localStorage.setItem('fc_signups', JSON.stringify(saved));
  } catch(e) {}

  closeModal('apply-modal');
  var msg = name + ' 님, 신청이 완료되었습니다! 🎉<br>' + email + ' 로 안내드릴게요.';
  if (currentUser && currentUser.loginType === 'kakao') {
    msg += '<br>카카오톡 채널로도 알림이 발송됩니다.';
  }
  document.getElementById('success-msg').innerHTML = msg;
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
