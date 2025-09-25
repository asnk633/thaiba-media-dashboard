// utils/googleAuth.js
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

/**
 * Parse service account key from env.
 * Supports GOOGLE_SERVICE_ACCOUNT_KEY_B64 (base64) or GOOGLE_SERVICE_ACCOUNT_KEY (raw JSON).
 */
function parseServiceAccountKey() {
  let raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY_B64 or GOOGLE_SERVICE_ACCOUNT_KEY');

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64) {
    raw = Buffer.from(raw, 'base64').toString('utf8');
  }

  const keyData = JSON.parse(raw);

  // fix private key newlines
  if (keyData.private_key) {
    keyData.private_key = keyData.private_key.replace(/\\n/g, '\n');
  }

  return keyData;
}

export async function getGoogleSpreadsheetClient(spreadsheetId) {
  const creds = parseServiceAccountKey();
  const auth = new JWT({
    email: creds.client_email,
    key: creds.private_key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(spreadsheetId, auth);
  await doc.loadInfo();
  return doc;
}

export async function testGoogleSheetsConnection(spreadsheetId) {
  const doc = await getGoogleSpreadsheetClient(spreadsheetId);
  console.log('Connected to spreadsheet:', doc.title);
  return doc;
}
