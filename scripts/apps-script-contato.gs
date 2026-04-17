/**
 * Ahara - recebe POST do formulario de contato e anexa em Google Sheet.
 *
 * SETUP:
 *   1. Google Drive -> New -> Google Sheets -> nomear "Ahara - Contatos"
 *   2. Copie o SHEET_ID da URL (https://docs.google.com/spreadsheets/d/[SHEET_ID]/edit)
 *   3. Extensions -> Apps Script
 *   4. Cole este arquivo inteiro, substituindo 'COLE_O_SHEET_ID_AQUI'
 *   5. Salvar (nome: "Ahara Contato")
 *   6. Deploy -> New deployment -> Type: Web app
 *        Execute as: Me  |  Who has access: Anyone
 *   7. Copiar a URL que termina em /exec e mandar para atualizar site.ts
 */

const SHEET_ID = 'COLE_O_SHEET_ID_AQUI';
const SHEET_NAME = 'Contatos';

function doPost(e) {
  try {
    const params = (e && e.parameter) || {};

    // Honeypot: se bot preencheu, finge sucesso e nao grava.
    if (params['bot-field']) {
      return jsonOut({ ok: true, skipped: true });
    }

    // Abre planilha e garante aba + cabecalho
    const ss = SpreadsheetApp.openById(SHEET_ID);
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Data/Hora',
        'Nome',
        'WhatsApp',
        'Tipo de negocio',
        'Mensagem',
        'Origem',
        'User Agent',
      ]);
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, 7).setFontWeight('bold').setBackground('#000').setFontColor('#f4e7da');
    }

    sheet.appendRow([
      new Date(),
      params.nome || '',
      params.whatsapp || '',
      params.tipo || '',
      params.mensagem || '',
      params.source || 'contato',
      (e && e.postData && e.postData.type) || '',
    ]);

    return jsonOut({ ok: true });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) }, 500);
  }
}

function doGet() {
  return ContentService.createTextOutput('Ahara form endpoint OK').setMimeType(ContentService.MimeType.TEXT);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
