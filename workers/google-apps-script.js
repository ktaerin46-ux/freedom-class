// ===== Freedom Class 수강신청 데이터 → 구글 시트 저장 =====
// 이 파일을 script.google.com 에 붙여넣고 웹앱으로 배포하세요

var SHEET_NAME = '수강신청';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);

    // 헤더가 없으면 첫 행에 추가
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['신청일시', '이름', '전화번호', '이메일', '로그인방식', '카카오ID', '강의명']);
    }

    sheet.appendRow([
      new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
      data.name    || '',
      data.phone   || '',
      data.email   || '',
      data.login_type || '',
      data.kakao_id   || '',
      data.lecture    || '',
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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ result: 'ok', message: 'Freedom Class API 정상 작동 중' }))
    .setMimeType(ContentService.MimeType.JSON);
}
