// api/tasks.js
// Returns JSON array of tasks read from the configured Google Sheet.
// Uses environment variables (same pattern as your other serverless functions):
// - SPREADSHEET_ID (or METADATA_SPREADSHEET_ID fallback)
// - SHEET_TAB (default 'Sheet1')
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY

const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || process.env.METADATA_SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();

let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
    (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}
PRIVATE_KEY = PRIVATE_KEY.trim();

const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];

async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials in environment variables.');
  }
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

function normalizeHeader(h) {
  return String(h || '').trim();
}

function mapRowToObject(headers, row) {
  const obj = {};
  for (let i = 0; i < headers.length; i++) {
    const key = normalizeHeader(headers[i]);
    if (!key) continue;
    obj[key] = row[i] !== undefined ? String(row[i]).trim() : '';
  }
  return obj;
}

module.exports = async (req, res) => {
  try {
    if (!SPREADSHEET_ID) {
      return res.status(500).json({ ok: false, error: 'Missing SPREADSHEET_ID' });
    }

    const sheets = await getSheetsClient();
    // read whole sheet (A:Z) — adjust if you have more columns
    const range = `${SHEET_TAB}!A:Z`;
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
    });

    const values = resp.data.values || [];
    if (values.length === 0) {
      return res.json({ ok: true, tasks: [], message: 'sheet empty' });
    }

    const headers = values[0].map(normalizeHeader);
    const rows = values.slice(1);
    const tasks = rows.map(row => mapRowToObject(headers, row));

    // Optionally: convert some fields types (deadline -> ISO)
    tasks.forEach(t => {
      if (t.Deadline && !t.DeadlineISO) {
        // Try to interpret mm/dd/yyyy or dd/mm/yyyy — leave as raw if parse fails
        const d = Date.parse(t.Deadline);
        if (!isNaN(d)) t.DeadlineISO = new Date(d).toISOString();
      }
    });

    return res.json({ ok: true, tasks, count: tasks.length, sheet: SHEET_TAB });
  } catch (err) {
    console.error('tasks error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ ok: false, error: (err && err.message) || String(err) });
  }
};
