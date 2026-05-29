var SPREADSHEET_ID = '1Ep7EOJR1cWr_uA6sn17EErGIK87EYo0ehM7ILVqiqps';
var SHEET_NAME     = '수강신청';

function doGet(e) {
  try {
    var ss    = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

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

    return ContentService.createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) { return doGet(e); }
