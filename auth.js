/* ===== FREEDOM CLASS 공통 스크립트 ===== */
var FORM_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz7iiU8EtFwpz6zjNVsl-T-Acl4AM88QlSZ9WlMeMwHv7RAKs7u8EzUiP1ybsJobDdnPw/exec';

/* ── 모달 제어 ── */
function openApplyModal() {
  document.getElementById('apply-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.getElementById(id).style.display = 'none';
  document.body.style.overflow = '';
}
function onOverlayClick(e, id) {
  if (e.target === document.getElementById(id)) closeModal(id);
}
function openPrivacyModal() {
  document.getElementById('privacy-modal').style.display = 'flex';
}

/* ── 신청 제출 ── */
function submitApply() {
  var name  = document.getElementById('reg-name').value.trim();
  var phone = document.getElementById('reg-phone').value.trim();
  var email = document.getElementById('reg-email').value.trim();
  var privacyEl = document.getElementById('privacy-check');
  if (!name)  { alert('이름을 입력해주세요.'); return; }
  if (!phone) { alert('전화번호를 입력해주세요.'); return; }
  if (!email) { alert('이메일을 입력해주세요.'); return; }
  if (privacyEl && !privacyEl.checked) { alert('개인정보 수집 및 이용에 동의해주세요.'); return; }

  var payload = {
    name:       name,
    phone:      phone,
    email:      email,
    login_type: 'direct',
    kakao_id:   '',
    lecture:    '[5/30] 구독자 0명에서 가장 빠르게 성장시키는 법 무료 특강',
  };

  if (FORM_ENDPOINT) {
    var qs = Object.keys(payload).map(function(k) {
      return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k] || '');
    }).join('&');
    fetch(FORM_ENDPOINT + '?' + qs, { mode: 'no-cors' }).catch(function() {});
  }

  closeModal('apply-modal');
  document.getElementById('success-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

/* ── ESC 닫기 ── */
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    ['apply-modal', 'success-modal'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el && el.style.display !== 'none') closeModal(id);
    });
  }
});
