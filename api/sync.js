// api/sync.js
// POST handler: verifies Google ID token and appends the task row to the configured sheet.
//
// Required env variables on Vercel:
//  - SPREADSHEET_ID (or METADATA_SPREADSHEET_ID)
//  - SHEET_TAB (defaults to 'Sheet1')
//  - GOOGLE_SHEETS_CLIENT_EMAIL
//  - GOOGLE_SHEETS_PRIVATE_KEY
//  - GOOGLE_OAUTH_CLIENT_ID  (used to verify front-end ID tokens)
//
// The frontend must send: Authorization: Bearer <google_id_token>

const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const SPREADSHEET_ID = process.env.METADATA_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();

// prepare private key from env (handles quoting and \\n escapes)
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
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// create sheets client using service account
async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY in environment');
  }
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

// verify Google ID token (from client-side sign-in)
const oauthClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID || '');

async function verifyGoogleIdToken(idToken) {
  if (!idToken) throw new Error('Missing id token');
  if (!process.env.GOOGLE_OAUTH_CLIENT_ID) throw new Error('Missing GOOGLE_OAUTH_CLIENT_ID in environment');
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });
  return ticket.getPayload(); // contains email, email_verified, name, sub
}

// map incoming task object to sheet columns
function mapTaskToRow(task) {
  // adjust order to match your sheet header:
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

    // get bearer id token from Authorization header
    const authHeader = (req.headers.authorization || '').trim();
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) {
      return res.status(401).json({ error: 'Unauthorized', details: 'Missing Authorization bearer token' });
    }

    // verify token
    let payload;
    try {
      payload = await verifyGoogleIdToken(idToken);
    } catch (e) {
      console.error('ID token verification failed:', e && e.message);
      return res.status(401).json({ error: 'Unauthorized', details: 'Invalid ID token' });
    }

    if (!payload || !payload.email_verified) {
      return res.status(401).json({ error: 'Unauthorized', details: 'Email not verified' });
    }
    const userEmail = payload.email;

    // parse incoming task body (accept JSON or already-parsed)
    let incoming = req.body;
    // if body is a string, try parse; some platforms give raw string
    if (typeof incoming === 'string') {
      try { incoming = JSON.parse(incoming); } catch (e) { /* leave as-string */ }
    }
    const task = incoming && incoming.task;
    if (!task) return res.status(400).json({ error: 'Missing task in request body' });

    // optionally: set requested_by to user email if desired
    // if you want the logged-in user to be recorded automatically uncomment:
    // task.requested_by = task.requested_by || userEmail;

    const sheets = await getSheetsClient();

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
