// api/sync.js
// Vercel serverless function: append a task to Google Sheets and return the external row index.
// Expects env vars:
// - SECRET_KEY
// - SPREADSHEET_ID
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY  (multiline or \n-escaped — both supported)

const { google } = require('googleapis');

const SECRET = process.env.SECRET_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;

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
    // Simple header secret check
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

    // Row layout: A..H as Task ID | Description | Requested By | Assigned To | Priority | Deadline | Status | ExternalRow
    const row = [
      task.task_id || '',
      task.description || '',
      task.requested_by || '',
      task.assigned_to || '',
      task.priority || '',
      task.deadline || '',
      task.status || 'Pending',
      '' // placeholder for ExternalRow
    ];

    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tasks!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    const updates = appendResult.data.updates || {};
    const updatedRange = updates.updatedRange || null;
    let externalRow = null;
    if (updatedRange) {
      // example updatedRange: "Tasks!A2:H2" -> capture the row number
      const m = updatedRange.match(/!(?:[A-Z]+)(\d+):/);
      if (m && m[1]) externalRow = parseInt(m[1], 10);
    }

    if (externalRow) {
      const extRange = `Tasks!H${externalRow}`;
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: extRange,
        valueInputOption: 'RAW',
        resource: { values: [[externalRow.toString()]] },
      });
    }

    return res.status(200).json({ ok: true, external_row: externalRow });
  } catch (err) {
    // Generic error response (avoid leaking secrets)
    console.error('sync error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
  }
};
