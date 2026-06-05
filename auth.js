/* ===== FREEDOM CLASS 공통 인증 스크립트 ===== */
var KAKAO_APP_KEY    = 'ecdd6aee1b7bc3c1b077470126aee7f8';
var KAKAO_CHANNEL_ID = '_nxhFAX';
var FORM_ENDPOINT    = '';

var currentUser = null;

if (window.Kakao && !Kakao.isInitialized()) {
  Kakao.init(KAKAO_APP_KEY);
}

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

function loginWithKakao() {
  if (!window.Kakao) { alert('카카오 SDK 로드 실패. 새로고침 후 시도해주세요.'); return; }
  Kakao.Auth.login({
    scope: 'profile_nickname,account_email',
    success: function(authObj) {
      Kakao.API.request({
        url: '/v2/user/me',
        success: function(res) {
          var acct = res.kakao_account || {};
          currentUser = {
            name:      (acct.profile || {}).nickname || '',
            email:     acct.email || '',
            phone:     '',
            loginType: 'kakao',
            kakaoId:   String(res.id || '')
          };
          updateNavAfterLogin();
          if (KAKAO_CHANNEL_ID) {
            try { Kakao.Channel.addChannel({ channelPublicId: KAKAO_CHANNEL_ID }); } catch(e) {}
          }
          if (document.getElementById('apply-modal').style.display === 'flex') {
            document.getElementById('reg-name').value  = currentUser.name  || '';
            document.getElementById('reg-email').value = currentUser.email || '';
            var btn = document.getElementById('apply-kakao-btn');
            if (btn) btn.textContent = '✅ 카카오 정보 자동입력 완료';
          } else {
            openApplyModal();
          }
        },
        fail: function() {
          currentUser = { name:'', email:'', phone:'', loginType:'kakao' };
          updateNavAfterLogin(); openApplyModal();
        }
      });
    },
    fail: function(err) {
      console.error(err);
      alert('카카오 로그인에 실패했습니다. 다시 시도해주세요.');
    }
  });
}

function loginWithEmail() {
  var email = document.getElementById('email-input').value.trim();
  var pw    = document.getElementById('pw-input').value;
  if (!email || !pw) { alert('이메일과 비밀번호를 입력해주세요.'); return; }
  currentUser = { name:'', email:email, phone:'', loginType:'email' };
  updateNavAfterLogin();
  openApplyModal();
}

function updateNavAfterLogin() {
  var nav = document.getElementById('nav-auth');
  if (!nav || !currentUser) return;
  var displayName = currentUser.name || currentUser.email || '수강생';
  nav.innerHTML =
    '<span class="nav-user-name">' + displayName + ' 님</span>' +
    '<button class="nav-btn-login" onclick="openApplyModal()">수강신청</button>';
}

function submitApply() {
  var name    = document.getElementById('reg-name').value.trim();
  var phone   = document.getElementById('reg-phone').value.trim();
  var email   = document.getElementById('reg-email').value.trim();
  var consent = document.getElementById('reg-consent');
  if (!name)  { alert('이름을 입력해주세요.'); return; }
  if (!phone) { alert('전화번호를 입력해주세요.'); return; }
  if (!email) { alert('이메일을 입력해주세요.'); return; }
  if (consent && !consent.checked) { alert('개인정보 수집 및 이용에 동의해주세요.'); return; }

  var payload = {
    name: name, phone: phone, email: email,
    loginType: currentUser ? currentUser.loginType : 'unknown',
    kakaoId:   currentUser ? (currentUser.kakaoId || '') : '',
    lecture: '[7/2] 월 100만 원 상위 0.1% AI 반자동화 유튜브 수익화 기초 무료 실전 강의',
    submittedAt: new Date().toISOString()
  };

  if (FORM_ENDPOINT) {
    fetch(FORM_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(function() {});
  }

  try {
    var saved = JSON.parse(localStorage.getItem('fc_signups') || '[]');
    saved.push(payload);
    localStorage.setItem('fc_signups', JSON.stringify(saved));
  } catch(e) {}

  closeModal('apply-modal');
  document.getElementById('success-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['login-modal','apply-modal','success-modal'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.style.display !== 'none') closeModal(id);
    });
  }
});
