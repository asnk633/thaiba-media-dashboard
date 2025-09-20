// api/sync.js
// Vercel serverless function: append a task to a configurable Google Sheets tab.
// Expects env vars:
// - SECRET_KEY
// - SPREADSHEET_ID
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY  (multiline or \n-escaped — both supported)
// - SHEET_TAB  (optional, defaults to "Sheet1")

const { google } = require('googleapis');

const SECRET = process.env.SECRET_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const sheetTab = (process.env.SHEET_TAB || 'Sheet1').trim();

// Robust private key parsing: accept multiline, or '\n' escaped, and strip accidental surrounding quotes.
let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
    (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}
PRIVATE_KEY = PRIVATE_KEY.trim();

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials in environment variables.');
  }
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

module.exports = async (req, res) => {
  try {
    // Auth check
    const authHeader = (req.headers['x-api-key'] || req.headers['authorization'] || '').toString();
    if (!authHeader || authHeader !== `Bearer ${SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;
    const task = payload && payload.task;
    if (!task || !task.task_id) {
      return res.status(400).json({ error: 'Missing task payload or task_id' });
    }

    if (!SPREADSHEET_ID) {
      return res.status(500).json({ error: 'SPREADSHEET_ID not configured' });
    }

    const sheets = await getSheetsClient();

    // Build row in the exact order of your headers:
    // A: Task ID
    // B: Task Description
    // C: Assigned To
    // D: Priority
    // E: Status
    // F: Requested By
    // G: Deadline
    // H: Notes
    const row = [
      task.task_id || '',
      task.description || '',
      task.assigned_to || '',
      task.priority || '',
      task.status || '',
      task.requested_by || '',
      task.deadline || '',
      task.notes || ''
    ];

    // Use configurable sheet tab name
    const range = `${sheetTab}!A:H`;

    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    const updates = appendResult.data.updates || {};
    const updatedRange = updates.updatedRange || null;
    let appendedRowNumber = null;
    if (updatedRange) {
      // example updatedRange: "Sheet1!A2:H2" -> capture the row number
      const m = updatedRange.match(/!(?:[A-Z]+)(\d+):/);
      if (m && m[1]) appendedRowNumber = parseInt(m[1], 10);
    }

    // We do NOT update any existing cells (to avoid protected-cell errors).
    return res.status(200).json({ ok: true, appended_row: appendedRowNumber, sheet: sheetTab });
  } catch (err) {
    console.error('sync error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
  }
};
