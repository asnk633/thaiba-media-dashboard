// scripts/seed-google-sheets.js
// Safe seed: will create sheet only if missing, ignore "already exists" errors,
// and only write headers if the first row is empty. Appends seed rows.
// Usage: dotenv_config_path=.env.local node -r dotenv/config scripts/seed-google-sheets.js

require('dotenv').config({ path: '.env.local' });
const { google } = require('googleapis');

function fmtKey(key) {
  if (!key) return key;
  return key.includes('\\n') ? key.replace(/\\n/g, '\n') : key;
}

async function sheetExists(sheetsApi, spreadsheetId, title) {
  const meta = await sheetsApi.spreadsheets.get({ spreadsheetId });
  return (meta.data.sheets || []).some(s => s.properties && s.properties.title === title);
}

async function ensureSheetAndHeader(sheetsApi, spreadsheetId, title, headerRow) {
  // create sheet only if missing
  try {
    const exists = await sheetExists(sheetsApi, spreadsheetId, title);
    if (!exists) {
      await sheetsApi.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title,
                gridProperties: { rowCount: 1000, columnCount: Math.max(10, headerRow.length) }
              }
            }
          }]
        }
      });
      console.log(`Created sheet "${title}"`);
    } else {
      console.log(`Sheet "${title}" already exists`);
    }
  } catch (err) {
    // If the sheet already existed but race caused error, ignore it.
    const msg = (err && (err.message || JSON.stringify(err))).toString();
    if (msg.includes('already exists')) {
      console.log(`Warning: attempted to create sheet "${title}" but it already exists. Continuing.`);
    } else {
      throw err;
    }
  }

  // Check if header exists (read A1)
  try {
    const resp = await sheetsApi.spreadsheets.values.get({ spreadsheetId, range: `${title}!A1:Z1` });
    const values = (resp.data && resp.data.values) ? resp.data.values[0] : [];
    const headerPresent = values && values.length > 0 && values.some(cell => cell && cell.toString().trim() !== '');
    if (!headerPresent) {
      await sheetsApi.spreadsheets.values.update({
        spreadsheetId,
        range: `${title}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [headerRow] }
      });
      console.log(`Wrote header to "${title}"`);
    } else {
      console.log(`Header already present for "${title}"`);
    }
  } catch (err) {
    // If we can't read (rare), attempt to write header and continue
    console.log(`Could not read header for "${title}" — attempting to write header. Err: ${err.message || err}`);
    await sheetsApi.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headerRow] }
    });
    console.log(`Wrote header to "${title}" after read error`);
  }
}

async function appendRows(sheetsApi, spreadsheetId, title, rows) {
  if (!rows || rows.length === 0) { console.log(`No rows to append for ${title}`); return; }
  await sheetsApi.spreadsheets.values.append({
    spreadsheetId,
    range: `${title}!A2`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows }
  });
  console.log(`Appended ${rows.length} rows into ${title}`);
}

async function run() {
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !rawKey) {
    console.error('Missing env: GOOGLE_SPREADSHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY');
    process.exit(1);
  }

  const privateKey = fmtKey(rawKey);

  const jwtClient = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  });

  console.log('Authenticating service account...');
  await jwtClient.authorize();
  console.log('Authenticated.');

  const sheetsApi = google.sheets({ version: 'v4', auth: jwtClient });

  // Ensure sheet+header exist (safe)
  await ensureSheetAndHeader(sheetsApi, spreadsheetId, 'users', ['id','name','email','role','profileUrl','phone','createdAt']);
  await ensureSheetAndHeader(sheetsApi, spreadsheetId, 'institutions', ['id','name','contactPerson','email','phone','createdAt']);
  await ensureSheetAndHeader(sheetsApi, spreadsheetId, 'tasks', ['id','title','description','requestedBy','requestedByEmail','assignedTo','priority','status','deadline','attachments','createdAt','updatedAt']);

  // === Update these arrays to use your real emails/team (edit as needed) ===
  const usersRows = [
    ['u_admin', 'Admin (Media)', 'media@thaibagarden.com', 'Admin', '', '', new Date().toISOString()],
    ['u_shukoor', 'Shukoor (You)', 'asnk633@gmail.com', 'TeamMember', '', '', new Date().toISOString()],
    ['u_member2', 'Member Two', 'member2@thaiba.org', 'TeamMember', '', '', new Date().toISOString()]
  ];

  const instRows = [
    ['inst_1', 'Thaiba Main Campus', 'Office', 'office@thaiba.org', '', new Date().toISOString()],
    ['inst_2', 'Thaiba Heritage', 'Coord', 'heritage@thaiba.org', '', new Date().toISOString()]
  ];

  const tasksRows = [
    ['t1', 'Welcome Video Edit', '30s edit for campus welcome video', 'Thaiba Main Campus', 'office@thaiba.org', 'asnk633@gmail.com', 'High', 'Pending', new Date(Date.now() + 3*24*3600*1000).toISOString(), '', new Date().toISOString(), new Date().toISOString()],
    ['t2', 'Monthly Social Posts', 'Create 4 social posts for the month', 'Thaiba Main Campus', 'office@thaiba.org', 'member2@thaiba.org', 'Medium', 'Pending', new Date(Date.now() + 7*24*3600*1000).toISOString(), '', new Date().toISOString(), new Date().toISOString()]
  ];
  // === end editable arrays ===

  // Append (safe)
  try {
    await appendRows(sheetsApi, spreadsheetId, 'users', usersRows);
  } catch (err) {
    console.error('Failed appending users:', err.message || err);
  }
  try {
    await appendRows(sheetsApi, spreadsheetId, 'institutions', instRows);
  } catch (err) {
    console.error('Failed appending institutions:', err.message || err);
  }
  try {
    await appendRows(sheetsApi, spreadsheetId, 'tasks', tasksRows);
  } catch (err) {
    console.error('Failed appending tasks:', err.message || err);
  }

  console.log('Seed finished (some sheets may have already existed). ✅');
}

run().catch(err => {
  console.error('Seed fatal error:', err.message || err);
  if (err.errors) console.error(err.errors);
  process.exit(1);
});
