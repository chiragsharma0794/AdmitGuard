/**
 * AdmitGuard – Google Apps Script Web App
 *
 * DEPLOYMENT INSTRUCTIONS
 * ────────────────────────────────────────────────────────────────
 * 1. Go to https://script.google.com and create a new project.
 * 2. Paste this file as Code.gs (replace the default contents).
 * 3. Set Script Properties (Project Settings → Script Properties):
 *      SPREADSHEET_ID   → ID from your Google Sheet URL
 *      SHEET_NAME       → e.g. "Submissions"
 *      ADMITGUARD_SECRET → (optional) a random secret string
 * 4. Deploy → New deployment → Web App:
 *      Execute as: Me
 *      Who has access: Anyone (or Anyone with link)
 * 5. Copy the Web App URL into AdmitGuard Settings → Data → Apps Script URL.
 * ────────────────────────────────────────────────────────────────
 */

// ── Columns written to the sheet (in order) ──────────────────────
var COLUMNS = [
  'submittedAt',
  'id',
  'fullName',
  'email',
  'phone',
  'dob',
  'highestQualification',
  'graduationYear',
  'score',
  'screeningScore',
  'interviewStatus',
  'aadhaar',
  'offerLetterSent',
  'exceptionCount',
  'isFlagged',
  'source',
  'version',
  'rawCandidateJson'
];

// ── CORS helper ───────────────────────────────────────────────────
function corsHeaders() {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Entry points ──────────────────────────────────────────────────

/**
 * Handle OPTIONS pre-flight (browsers send this before POST).
 * Apps Script doesn't support OPTIONS natively, but returning
 * a 200 from doGet with CORS headers usually satisfies it.
 */
function doGet(e) {
  return respond({ ok: true, message: 'AdmitGuard Sheets endpoint is live.' });
}

function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return respond({ ok: false, error: 'Invalid JSON body.' });
  }

  // ── Optional shared-secret auth ──────────────────────────────
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('ADMITGUARD_SECRET');
  if (secret) {
    var clientSecret = e.parameter['X-ADMITGUARD-SECRET'] ||
      (e.headers && e.headers['X-ADMITGUARD-SECRET']) || '';
    if (clientSecret !== secret) {
      return respond({ ok: false, error: 'Unauthorized.' });
    }
  }

  var action = body.action || '';

  if (action === 'ping') {
    return respond({ ok: true });
  }

  if (action === 'append') {
    return handleAppend(body, props);
  }

  return respond({ ok: false, error: 'Unknown action: ' + action });
}

// ── Append handler ────────────────────────────────────────────────
function handleAppend(body, props) {
  var candidate = body.candidate || {};
  var meta      = body.meta      || {};

  var spreadsheetId = props.getProperty('SPREADSHEET_ID');
  var sheetName     = props.getProperty('SHEET_NAME') || 'Submissions';

  if (!spreadsheetId) {
    return respond({ ok: false, error: 'SPREADSHEET_ID not configured in Script Properties.' });
  }

  try {
    var ss    = SpreadsheetApp.openById(spreadsheetId);
    var sheet = ss.getSheetByName(sheetName);

    // Create the sheet if it doesn't exist
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
    }

    // Write headers if the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length)
        .setFontWeight('bold')
        .setBackground('#4F46E5')
        .setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }

    // Build the row in column order
    var row = [
      candidate.submittedAt  || meta.submittedAt || new Date().toISOString(),
      candidate.id           || '',
      candidate.fullName     || '',
      candidate.email        || '',
      candidate.phone        || '',
      candidate.dob          || '',
      candidate.highestQualification || '',
      candidate.graduationYear || '',
      candidate.score        || '',
      candidate.screeningScore || '',
      candidate.interviewStatus || '',
      candidate.aadhaar      || '',
      candidate.offerLetterSent || '',
      candidate.exceptionCount !== undefined ? candidate.exceptionCount : '',
      candidate.isFlagged    !== undefined ? String(candidate.isFlagged) : '',
      meta.source            || 'AdmitGuard',
      meta.version           || 'v1',
      JSON.stringify(candidate)
    ];

    sheet.appendRow(row);
    var rowNumber = sheet.getLastRow();

    return respond({ ok: true, row: rowNumber });

  } catch (err) {
    return respond({ ok: false, error: 'Sheets error: ' + err.message });
  }
}

// ── JSON response helper ──────────────────────────────────────────
function respond(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
