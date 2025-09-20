// api/tasks.js
// Returns tasks read from the spreadsheet and normalizes status values.
//
// Environment variables expected:
// - SPREADSHEET_ID (Google Sheets ID)
// - SHEET_TAB (sheet tab name, default 'Sheet1')
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY

const { google } = require('googleapis');

// config from env
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '';

// safe private key normalization (strip surrounding quotes, fix escaped newlines)
if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
    (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}
PRIVATE_KEY = PRIVATE_KEY.trim();

// helper: normalize status values from sheet -> canonical frontend values
function normalizeStatus(raw) {
  if (!raw) return 'Pending';
  const s = String(raw).trim().toLowerCase();

  // map common variants to canonical values
  if (
    s === 'working on' ||
    s === 'working' ||
    s === 'in progress' ||
    s === 'workingon' ||
    s === 'working-on' ||
    s === 'in-progress'
  ) {
    return 'In Progress';
  }
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s === 'cancelled ') {
    return 'On Hold';
  }
  if (s === 'pending' || s === 'open' || s === 'todo' || s === 'new') {
    return 'Pending';
  }
  if (s === 'completed' || s === 'done' || s === 'finished') {
    return 'Completed';
  }

  // fallback: Title Case the unknown status so UI shows nicer text
  return s.split(/\s+/).map(w => (w[0] ? w[0].toUpperCase() + w.slice(1) : w)).join(' ');
}

async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials (GOOGLE_SHEETS_CLIENT_EMAIL or GOOGLE_SHEETS_PRIVATE_KEY).');
  }

  const jwt = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  // authorize (will throw on failure)
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

function safeParseDate(value) {
  if (!value) return null;
  // If the sheet already returns an ISO date-like string, try to parse
  const d = new Date(value);
  if (!isNaN(d.getTime())) return d.toISOString();
  // return original string as fallback
  return String(value);
}

module.exports = async (req, res) => {
  try {
    if (!SPREADSHEET_ID) {
      return res.status(500).json({ error: 'Missing SPREADSHEET_ID environment variable.' });
    }

    const sheets = await getSheetsClient();

    // Range: A:H (adjust if you ever have more columns)
    const range = `${SHEET_TAB}!A:H`;

    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
      majorDimension: 'ROWS',
    });

    const values = resp.data.values || [];

    // If the first row is a header row (it is in your sheet), drop it.
    // We'll try to detect header by checking if first row contains "Task" or "Task ID".
    let rows = values.slice();
    if (rows.length > 0) {
      const firstRowJoined = rows[0].join(' ').toLowerCase();
      if (firstRowJoined.includes('task') || firstRowJoined.includes('task id') || firstRowJoined.includes('task description')) {
        // assume header row: drop it
        rows = rows.slice(1);
      }
    }

    // Map rows -> tasks using the column mapping:
    // A = 0 Task ID
    // B = 1 Task Description
    // C = 2 Assigned To
    // D = 3 Priority
    // E = 4 Status
    // F = 5 Requested By
    // G = 6 Deadline
    // H = 7 Notes
    const tasks = rows.map((row, idx) => {
      // normalize and fallback to empty strings where necessary
      const id = (row[0] || '').toString();
      const description = row[1] || '';
      const assignedTo = row[2] || '';
      const priority = row[3] || '';
      const rawStatus = row[4] || '';
      const requestedBy = row[5] || '';
      const deadlineRaw = row[6] || '';
      const notes = row[7] || '';

      const status = normalizeStatus(rawStatus);
      const deadline = safeParseDate(deadlineRaw);

      return {
        id,
        description,
        assignedTo,
        priority,
        status,
        requestedBy,
        deadline,
        notes,
        // index helps debugging/logging
        _rowIndex: idx + 2, // +2 because we dropped header and sheet rows 1-based
      };
    });

    // compute basic counts for dashboard
    const counts = tasks.reduce(
      (acc, t) => {
        acc.total += 1;
        const s = (t.status || 'Pending').toLowerCase();
        if (s === 'in progress' || s === 'inprogress' || s === 'in-progress') acc.inProgress += 1;
        else if (s === 'on hold' || s === 'onhold') acc.onHold += 1;
        else if (s === 'completed' || s === 'done' || s === 'finished') acc.completed += 1;
        else acc.pending += 1;

        // overdue: if deadline is a date and < today (approx)
        if (t.deadline) {
          const d = new Date(t.deadline);
          const today = new Date();
          // compare only date portion (not time)
          const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
          const tUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
          if (!isNaN(dUTC) && dUTC < tUTC) acc.overdue += 1;
        }
        return acc;
      },
      { total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0 }
    );

    // optional: find nextTaskId suggestion (if you have T### scheme)
    // find max numeric suffix of IDs starting with T
    let nextTaskId = null;
    try {
      const nums = tasks
        .map(t => {
          const m = String(t.id || '').match(/T\s*0*([0-9]+)/i);
          return m ? parseInt(m[1], 10) : NaN;
        })
        .filter(n => !isNaN(n));
      if (nums.length) {
        const max = Math.max(...nums);
        nextTaskId = `T${max + 1}`;
      }
    } catch (e) {
      // ignore
    }

    // Debug sample log (first 6 statuses) — check Vercel logs to verify normalization
    console.log('tasks-sample-statuses:', tasks.slice(0, 6).map(t => ({ id: t.id, status: t.status, row: t._rowIndex })));

    // Return response
    return res.json({
      ok: true,
      sheet: SHEET_TAB,
      counts,
      nextTaskId,
      tasks,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('api/tasks error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error', details: String(err && err.message ? err.message : err) });
  }
};
