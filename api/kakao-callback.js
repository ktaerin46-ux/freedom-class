// Vercel 서버리스 함수 — 카카오 OAuth 콜백 처리
module.exports = async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(302, '/?kakao_error=1');
  }

  const REST_API_KEY  = process.env.KAKAO_REST_API_KEY;
  const REDIRECT_URI  = 'https://freedom-class.vercel.app/api/kakao-callback';

  try {
    // 1. 인가 코드 → 액세스 토큰 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        client_id:    REST_API_KEY,
        redirect_uri: REDIRECT_URI,
        code:         code,
      }).toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error('Token error:', tokenData);
      return res.redirect(302, '/?kakao_error=token');
    }

    // 2. 사용자 정보 가져오기
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const user = await userRes.json();
    const acct = user.kakao_account || {};

    const name    = (acct.profile || {}).nickname || '';
    const email   = acct.email || '';
    const kakaoId = String(user.id || '');

    // 3. 사용자 정보를 URL 파라미터로 프론트엔드에 전달
    const params = new URLSearchParams({
      kakao_success: '1',
      name,
      email,
      kakao_id: kakaoId,
    });

    // 카카오 채널 추가는 JS에서 처리 (서버에서 불가)
    res.redirect(302, `/free-lecture/index.html?${params}`);

  } catch (err) {
    console.error('Kakao callback error:', err);
    res.redirect(302, '/?kakao_error=server');
  }
};
