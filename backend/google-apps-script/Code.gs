const SPREADSHEET_ID = '1joW9nMX6lK_Uj5zt6tEB3WTyY9G_BJ8kyg588k_03QI';
const SHEET_NAME = 'Заявки';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');

    if (!data.name || !data.student || !data.class || !data.goal || !data.contact || data.consentAccepted !== true || data.parentRepresentativeConfirmed !== true || data.consentVersion !== '2026-10-18') {
      return jsonResponse({ok:false,error:'Не заполнены обязательные поля'});
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    const time = Utilities.formatDate(new Date(), 'Europe/Moscow', 'dd.MM.yyyy HH:mm:ss');

    const auditHeaders = ['Согласие получено', 'Версия согласия', 'Время согласия (клиент UTC)', 'Получено сервером (UTC)', 'Представитель подтверждён'];
    if (sheet.getRange(1, 10).getValue() !== auditHeaders[0]) {
      sheet.getRange(1, 10, 1, auditHeaders.length).setValues([auditHeaders]);
    }
    sheet.appendRow([
      time,
      data.name || '',
      data.student || '',
      data.class || '',
      data.goal || '',
      data.contact || '',
      data.comment || '',
      data.source || 'Сайт Котоматики',
      'Новая',
      data.consentAccepted === true ? 'ДА' : 'НЕТ',
      data.consentVersion || '',
      data.consentAcceptedAt || '',
      data.consentCollectedAt || '',
      data.parentRepresentativeConfirmed === true ? 'ДА' : 'НЕТ'
    ]);

    return jsonResponse({ok:true});
  } catch (error) {
    console.error(error);
    return jsonResponse({ok:false,error:String(error)});
  }
}

function doGet() {
  return jsonResponse({ok:true,service:'KOTOMATIKA leads'});
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
