// api/tasks.js
// Robust task reader + status normalization for the Thaiba Media dashboard.
//
// Environment variables expected:
// - SPREADSHEET_ID
// - SHEET_TAB (optional, default 'Sheet1')
// - GOOGLE_SHEETS_CLIENT_EMAIL
// - GOOGLE_SHEETS_PRIVATE_KEY

const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_TAB = (process.env.SHEET_TAB || 'Sheet1').trim();
const CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
let PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY || '';

if ((PRIVATE_KEY.startsWith('"') && PRIVATE_KEY.endsWith('"')) ||
    (PRIVATE_KEY.startsWith("'") && PRIVATE_KEY.endsWith("'"))) {
  PRIVATE_KEY = PRIVATE_KEY.slice(1, -1);
}
if (PRIVATE_KEY.includes('\\n')) {
  PRIVATE_KEY = PRIVATE_KEY.replace(/\\n/g, '\n');
}
PRIVATE_KEY = PRIVATE_KEY.trim();

function normalizeStatus(raw) {
  if (!raw) return 'Pending';
  const s = String(raw).trim().toLowerCase();

  // many aliases -> canonical
  const inProgressAliases = new Set(['working on','working','workingon','in progress','in-progress','inprogress','working-on']);
  const onHoldAliases = new Set(['cancelled','canceled','cancel','on hold','on-hold','onhold','hold','paused','archive']);
  const completedAliases = new Set(['completed','done','finished','closed']);
  const pendingAliases = new Set(['pending','open','todo','new']);

  if (inProgressAliases.has(s)) return 'In Progress';
  if (onHoldAliases.has(s)) return 'On Hold';
  if (completedAliases.has(s)) return 'Completed';
  if (pendingAliases.has(s)) return 'Pending';

  // fallback: title-case the incoming text (so unknown labels still show nicely)
  return s.split(/\s+/).map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
}

function parsePossibleDate(value) {
  if (!value) return null;
  const raw = String(value).trim();
  // Try ISO / RFC first
  const d1 = new Date(raw);
  if (!isNaN(d1.getTime())) return d1.toISOString();

  // Try common dd/mm/yyyy or dd-mm-yyyy
  const m1 = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m1) {
    const dd = parseInt(m1[1], 10);
    const mm = parseInt(m1[2], 10) - 1;
    const yy = parseInt(m1[3], 10);
    const d2 = new Date(Date.UTC(yy, mm, dd));
    if (!isNaN(d2.getTime())) return d2.toISOString();
  }

  // fallback: return original string (frontend may display as-is)
  return raw;
}

async function getSheetsClient() {
  if (!CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Missing google service account env vars (GOOGLE_SHEETS_CLIENT_EMAIL, GOOGLE_SHEETS_PRIVATE_KEY).');
  }
  // google-auth-library supports object constructor
  const jwt = new google.auth.JWT({
    email: CLIENT_EMAIL,
    key: PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  await jwt.authorize();
  return google.sheets({ version: 'v4', auth: jwt });
}

function headerLooksLikeColumns(row) {
  if (!row || !row.length) return false;
  const joined = row.join(' ').toLowerCase();
  // require at least two known column keywords to be confident it's a header
  const keywords = ['task','task id','task description','description','assigned','assigned to','priority','status','requested','requested by','deadline','notes'];
  let matches = 0;
  for (const k of keywords) if (joined.includes(k)) matches++;
  return matches >= 2;
}

function normalizeHeaderName(name) {
  if (!name) return '';
  return String(name).toLowerCase().replace(/[\s\-_]+/g, ' ').replace(/[^\w ]/g, '').trim();
}

module.exports = async (req, res) => {
  try {
    if (!SPREADSHEET_ID) return res.status(500).json({ error: 'Missing SPREADSHEET_ID env var' });

    const sheets = await getSheetsClient();
    // fetch a wide range in case sheet layout shifted (A:Z)
    const range = `${SHEET_TAB}!A:Z`;
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range,
      majorDimension: 'ROWS',
    });

    const values = resp.data.values || [];

    if (!values.length) {
      return res.json({ ok: true, sheet: SHEET_TAB, tasks: [], counts: { total:0, pending:0, inProgress:0, onHold:0, completed:0, overdue:0 }, nextTaskId: null, fetchedAt: new Date().toISOString() });
    }

    // Decide whether the first row is a header (detect columns)
    const firstRow = values[0];
    const hasHeader = headerLooksLikeColumns(firstRow);

    // Build a header map if header exists
    const headerMap = {};
    if (hasHeader) {
      firstRow.forEach((cell, idx) => {
        const key = normalizeHeaderName(cell);
        if (!key) return;
        headerMap[key] = idx;
      });
    }

    // helpers to find index by various synonyms
    const findIndex = (synonyms, fallbackIndex) => {
      if (hasHeader) {
        for (const s of synonyms) {
          const k = normalizeHeaderName(s);
          if (k in headerMap) return headerMap[k];
        }
      }
      return fallbackIndex;
    };

    // Preferred indices (fallback to fixed A..H)
    const idxId = findIndex(['task id','taskid','task','id'], 0);
    const idxDescription = findIndex(['task description','description','taskdesc','task desc'], 1);
    const idxAssigned = findIndex(['assigned to','assigned','assignee'], 2);
    const idxPriority = findIndex(['priority'], 3);
    const idxStatus = findIndex(['status'], 4);
    const idxRequestedBy = findIndex(['requested by','requestedby','requested'], 5);
    const idxDeadline = findIndex(['deadline','due','due date','date'], 6);
    const idxNotes = findIndex(['notes','note','remarks'], 7);

    // Determine rows to process
    const dataRows = hasHeader ? values.slice(1) : values.slice(0);

    // Map rows -> tasks
    const tasks = dataRows.map((row, i) => {
      // read using indices robustly
      const id = (row[idxId] || '').toString().trim();
      const description = (row[idxDescription] || '').toString().trim();
      const assignedTo = (row[idxAssigned] || '').toString().trim();
      const priority = (row[idxPriority] || '').toString().trim();
      const rawStatus = (row[idxStatus] || '').toString().trim();
      const requestedBy = (row[idxRequestedBy] || '').toString().trim();
      const deadlineRaw = row[idxDeadline] || '';
      const notes = (row[idxNotes] || '').toString().trim();

      const status = normalizeStatus(rawStatus);
      const deadline = parsePossibleDate(deadlineRaw);

      return {
        id,
        description,
        assignedTo,
        priority,
        status,
        requestedBy,
        deadline,
        notes,
        _sheetRow: (hasHeader ? i + 2 : i + 1),
      };
    });

    // counts
    const counts = tasks.reduce((acc, t) => {
      acc.total++;
      const s = (t.status || 'Pending').toLowerCase();
      if (s === 'in progress' || s === 'inprogress' || s === 'in-progress') acc.inProgress++;
      else if (s === 'on hold' || s === 'onhold') acc.onHold++;
      else if (s === 'completed') acc.completed++;
      else acc.pending++;

      if (t.deadline) {
        const d = new Date(t.deadline);
        if (!isNaN(d.getTime())) {
          const today = new Date();
          const dUTC = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
          const tUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
          if (dUTC < tUTC) acc.overdue++;
        }
      }
      return acc;
    }, { total: 0, pending: 0, inProgress: 0, onHold: 0, completed: 0, overdue: 0 });

    // compute nextTaskId if T### scheme exists
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

    // Log a small sample to help diagnosis in Vercel logs
    console.log('api/tasks sample:', tasks.slice(0,8).map(t => ({ id: t.id, status: t.status, row: t._sheetRow })));
    // Return
    return res.json({
      ok: true,
      sheet: SHEET_TAB,
      fetchedAt: new Date().toISOString(),
      counts,
      nextTaskId,
      tasks,
    });
  } catch (err) {
    console.error('api/tasks error:', err && err.stack ? err.stack : err);
    return res.status(500).json({ error: 'Server error', details: String(err && err.message ? err.message : err) });
  }
};
