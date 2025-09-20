const { google } = require('googleapis');

const SECRET = process.env.SECRET_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';

// If the value is wrapped in quotes (common if pasted incorrectly), remove them
if (
  (PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
  (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))
) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}

// If it contains literal "\n" sequences, convert them into real newlines
if (PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}

// Trim whitespace/newline edges just in case
PRIVATE_KEY = PRIVATE_KEY.trim();


const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

module.exports = async (req, res) => {
  try {
    // Auth: require SECRET in header
    const authHeader = (req.headers['x-api-key'] || req.headers['authorization'] || '');
    if (!authHeader || authHeader !== `Bearer ${SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const payload = req.body;
    const task = payload.task;
    if (!task || !task.task_id) {
      return res.status(400).json({ error: 'Missing task payload or task_id' });
    }

    const sheets = await getSheetsClient();

    const row = [
      task.task_id || '',
      task.description || '',
      task.requested_by || '',
      task.assigned_to || '',
      task.priority || '',
      task.deadline || '',
      task.status || 'Pending',
      ''
    ];

    const appendResult = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Tasks!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    const updates = appendResult.data.updates || {};
    let updatedRange = updates.updatedRange || null;
    let externalRow = null;
    if (updatedRange) {
      const match = updatedRange.match(/!(?:[A-Z]+)(\\d+):/);
      if (match && match[1]) externalRow = parseInt(match[1], 10);
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
    console.error('sync error', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
};
