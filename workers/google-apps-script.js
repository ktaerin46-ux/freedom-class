var SPREADSHEET_ID = '1Ep7EOJR1cWr_uA6sn17EErGIK87EYo0ehM7ILVqiqps';

function doGet(e) {
  try {
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (e.parameter.action === 'login') {
      /* 카카오 로그인 기록 → '로그인 정보' 시트 */
      var loginSheet = ss.getSheetByName('로그인 정보');
      if (!loginSheet) loginSheet = ss.insertSheet('로그인 정보');
      if (loginSheet.getLastRow() === 0) {
        loginSheet.appendRow(['로그인일시', '이름', '이메일', '카카오ID']);
      }
      loginSheet.appendRow([
        new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        e.parameter.name     || '',
        e.parameter.email    || '',
        e.parameter.kakao_id || '',
      ]);
    } else {
      /* 수강신청 기록 → '수강신청' 시트 */
      var sheet = ss.getSheetByName('수강신청');
      if (!sheet) sheet = ss.insertSheet('수강신청');
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(['신청일시', '이름', '전화번호', '이메일', '로그인방식', '카카오ID', '강의명']);
      }
      sheet.appendRow([
        new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
        e.parameter.name       || '',
        e.parameter.phone      || '',
        e.parameter.email      || '',
        e.parameter.login_type || '',
        e.parameter.kakao_id   || '',
        e.parameter.lecture    || '',
      ]);
    }

    return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) { return doGet(e); }
