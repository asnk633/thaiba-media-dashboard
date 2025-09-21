// api/sync.js
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
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
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getSheetsClient() {
  const jwt = new google.auth.JWT(CLIENT_EMAIL, null, PRIVATE_KEY, SCOPES);
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

// verify Google ID token
const oauthClient = new OAuth2Client(process.env.GOOGLE_OAUTH_CLIENT_ID);
async function verifyGoogleToken(idToken) {
  const ticket = await oauthClient.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_OAUTH_CLIENT_ID,
  });
  return ticket.getPayload(); // contains email, name, etc.
}

module.exports = async (req, res) => {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization || '';
    const idToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!idToken) return res.status(401).json({ error: 'Missing Google ID token' });

    const user = await verifyGoogleToken(idToken);
    const userEmail = user.email || 'unknown';

    const { task } = req.body;
    if (!task) return res.status(400).json({ error: 'Missing task data' });

    // prepare row values
    const row = [
      task.task_id || '',
      task.description || '',
      task.assigned_to || '',
      task.priority || '',
      task.status || 'Pending',
      task.requested_by || '',
      task.deadline || '',
      task.notes || '',
      userEmail  // ✅ new column: Submitted By
    ];

    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_TAB}!A:I`, // now 9 columns
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] }
    });

    res.json({ success: true, submitted_by: userEmail });
  } catch (err) {
    console.error('sync error:', err);
    res.status(500).json({ error: err.message });
  }
};
