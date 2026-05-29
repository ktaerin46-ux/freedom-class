// ===== Freedom Class 수강신청 데이터 → 구글 시트 저장 =====
// script.google.com 에 붙여넣고 웹앱으로 배포하세요

var SHEET_NAME = '수강신청';

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 헤더가 없으면 첫 행에 추가
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

    return ContentService
      .createTextOutput(JSON.stringify({ result: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  return doGet(e);
}
