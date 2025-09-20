// api/get-metadata.js
// Returns lists for the frontend and an auto-generated next Task ID.
// Env vars used:
// - SPREADSHEET_ID (fallback) or METADATA_SPREADSHEET_ID (optional)
// - SHEET_TAB (tasks sheet, default 'Sheet1')
// - TEAM_TAB (default 'Team')
// - INSTITUTIONS_TAB (default 'Institutions')
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY

const { google } = require('googleapis');

const METADATA_SPREADSHEET_ID = process.env.METADATA_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();
const TEAM_TAB = (process.env.TEAM_TAB || 'Team').trim();
const INSTITUTIONS_TAB = (process.env.INSTITUTIONS_TAB || 'Institutions').trim();

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

function parseIDs(values) {
  if (!values || !Array.isArray(values)) return [];
  return values.flat().map(v => (v||'').toString().trim()).filter(x => x.length > 0);
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    if (!METADATA_SPREADSHEET_ID) return res.status(500).json({ error: 'METADATA_SPREADSHEET_ID or SPREADSHEET_ID not configured' });

    const sheets = await getSheetsClient();

    // Team names from TEAM_TAB column A (A2:A)
    const teamResp = await sheets.spreadsheets.values.get({
      spreadsheetId: METADATA_SPREADSHEET_ID,
      range: `${TEAM_TAB}!A2:A`,
    }).catch(() => ({ data: { values: [] } }));
    const assignedTo = parseIDs(teamResp.data.values);

    // Institutions from INSTITUTIONS_TAB column A (A2:A)
    const instResp = await sheets.spreadsheets.values.get({
      spreadsheetId: METADATA_SPREADSHEET_ID,
      range: `${INSTITUTIONS_TAB}!A2:A`,
    }).catch(() => ({ data: { values: [] } }));
    const institutions = parseIDs(instResp.data.values);

    // Task IDs from SHEET_TAB column A (A2:A)
    const tasksResp = await sheets.spreadsheets.values.get({
      spreadsheetId: METADATA_SPREADSHEET_ID,
      range: `${SHEET_TAB}!A2:A`,
    }).catch(() => ({ data: { values: [] } }));
    const existingIds = parseIDs(tasksResp.data.values);

    let maxNum = 0;
    existingIds.forEach(id => {
      const m = id.match(/(\\d+)$/);
      if (m && m[1]) {
        const n = parseInt(m[1], 10);
        if (!isNaN(n) && n > maxNum) maxNum = n;
      }
    });
    if (maxNum === 0 && existingIds.length > 0) maxNum = existingIds.length;
    const nextNum = maxNum + 1;
    const nextTaskId = `T${nextNum}`;

    return res.status(200).json({
      assignedTo,
      institutions,
      nextTaskId,
      sheet: SHEET_TAB
    });
  } catch (err) {
    console.error('get-metadata error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
  }
};
