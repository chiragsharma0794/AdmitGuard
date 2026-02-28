import { AuditRecord } from '../types';

/**
 * Exports data to JSON file
 */
export const exportToJSON = (data: AuditRecord[]) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `admitguard_export_${new Date().toISOString().split('T')[0]}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Exports data to CSV file (Google Sheets friendly)
 */
export const exportToCSV = (data: AuditRecord[]) => {
  if (data.length === 0) return;

  // Define headers
  const headers = [
    'ID', 'Full Name', 'Email', 'Phone', 'DOB', 'Qualification', 
    'Grad Year', 'Score', 'Screening Score', 'Interview Status', 
    'Aadhaar', 'Offer Letter', 'Exception Count', 'Flagged', 
    'Submitted At', 'Rationales'
  ];

  const rows = data.map(record => {
    // Flatten rationales into a single string for CSV
    const rationales = Object.entries(record.overrides)
      .map(([id, rationale]) => `${id}: ${rationale.replace(/"/g, '""')}`)
      .join(' | ');

    return [
      record.id,
      `"${record.fullName.replace(/"/g, '""')}"`,
      record.email,
      record.phone,
      record.dob,
      record.highestQualification,
      record.graduationYear,
      record.score,
      record.screeningScore,
      record.interviewStatus,
      record.aadhaar,
      record.offerLetterSent,
      record.exceptionCount,
      record.isFlagged ? 'YES' : 'NO',
      record.submittedAt,
      `"${rationales}"`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `admitguard_export_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

/**
 * Google Apps Script snippet for Google Sheets
 */
export const GOOGLE_APPS_SCRIPT = `
/**
 * AdmitGuard Google Sheets Integration
 * Paste this into Extensions > Apps Script
 */

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('AdmitGuard')
      .addItem('Import AdmitGuard Data', 'showImportDialog')
      .addToUi();
}

function showImportDialog() {
  var html = HtmlService.createHtmlOutput(
    '<p>Paste your AdmitGuard JSON or CSV content here:</p>' +
    '<textarea id="data" style="width:100%;height:200px;"></textarea><br>' +
    '<button onclick="google.script.run.withSuccessHandler(google.script.host.close).processData(document.getElementById(\\'data\\').value)">Import</button>'
  ).setWidth(400).setHeight(300);
  SpreadsheetApp.getUi().showModalDialog(html, 'Import AdmitGuard Data');
}

function processData(content) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data;
  
  try {
    // Try parsing as JSON first
    data = JSON.parse(content);
    if (!Array.isArray(data)) data = [data];
    
    // Add headers if sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['ID', 'Name', 'Email', 'Phone', 'DOB', 'Qualification', 'Year', 'Score', 'Status', 'Exceptions', 'Flagged', 'Timestamp']);
    }
    
    data.forEach(function(item) {
      sheet.appendRow([
        item.id, item.fullName, item.email, item.phone, item.dob, 
        item.highestQualification, item.graduationYear, item.score, 
        item.interviewStatus, item.exceptionCount, item.isFlagged ? 'YES' : 'NO', 
        item.submittedAt
      ]);
    });
    
  } catch (e) {
    // Fallback to CSV parsing (simple)
    var rows = content.split('\\n');
    rows.forEach(function(row) {
      sheet.appendRow(row.split(','));
    });
  }
}
`;
