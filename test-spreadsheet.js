require('dotenv').config({ path: '.env.local' });

(async () => {
  try {
    const { getGoogleSpreadsheetClient } = require('./utils/googleAuth.js');
    const id = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID;
    if (!id) {
      console.error('NO_SHEET_ID in env (set GOOGLE_SHEETS_ID or GOOGLE_SPREADSHEET_ID)');
      process.exit(2);
    }
    const doc = await getGoogleSpreadsheetClient(id);
    console.log('SPREADSHEET TITLE:', doc.title);
    if (doc.sheetsByIndex && doc.sheetsByIndex.length) {
      doc.sheetsByIndex.forEach((s, i) => console.log('sheet', i, '->', s.title));
    } else {
      console.log('No sheets found or sheetsByIndex empty');
    }
  } catch (e) {
    console.error('TEST ERROR:', e.message || e);
    process.exit(1);
  }
})();
