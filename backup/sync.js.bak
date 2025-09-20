// api/sync.js
// POST handler: verify Google ID token and append row to SHEET_TAB
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const SPREADSHEET_ID = process.env.METADATA_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();

let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || '';
if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
    (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY.includes('\\n')) PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
PRIVATE_KEY = PRIVATE_KEY.trim();

const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials in environment variables.');
  }
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

const oauthClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID || '');

async function verifyIdTokenFromHeader(req) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const idToken = auth.slice(7);
  try {
    const ticket = await oauthClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    return payload; // contains email, email_verified, name, sub
  } catch (e) {
    console.error('id token verify failed', e && (e.message || e));
    return null;
  }
}

function mapTaskToRow(task) {
  // order must match your sheet header:
  // Task ID | Task Description | Assigned To | Priority | Status | Requested By | Deadline | Notes
  return [
    task.task_id || '',
    task.description || '',
    task.assigned_to || '',
    task.priority || '',
    task.status || '',
    task.requested_by || '',
    task.deadline || '',
    task.notes || ''
  ];
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    if (!SPREADSHEET_ID) return res.status(500).json({ error: 'SPREADSHEET_ID not configured' });

    // verify Google ID token
    const payload = await verifyIdTokenFromHeader(req);
    if (!payload || !payload.email_verified) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userEmail = (payload.email || '').toLowerCase();

    // get sheets client
    const sheets = await getSheetsClient();

    // parse body
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const body = bodyText ? JSON.parse(bodyText) : {};
    const task = (body && body.task) ? body.task : null;
    if (!task) return res.status(400).json({ error: 'Missing task in body' });

    // append row
    const row = mapTaskToRow(task);
    const appendResp = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:H`,
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values: [row] },
    });

    const updates = appendResp.data.updates || {};
    return res.status(200).json({
      ok: true,
      appended_row: !!updates.updatedRows,
      updates,
      sheet: SHEET_TAB,
      nextTaskId: task.task_id,
      submitted_by: userEmail
    });
  } catch (err) {
    console.error('sync error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Internal Server Error', details: err && err.message });
  }
};
