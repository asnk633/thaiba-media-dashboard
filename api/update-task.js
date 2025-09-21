// api/update-task.js  (updated)
// Accepts optional "row" in request body to skip row search.
// Improved diagnostics when row lookup fails.

import { google } from 'googleapis';

function colLetterToIndex(letter){
  if(!letter) return null;
  let s = String(letter).toUpperCase();
  let n = 0;
  for(let i=0;i<s.length;i++) n = n*26 + (s.charCodeAt(i)-64);
  return n;
}
function columnLetter(n){
  if(!n || n<=0) return '?';
  let s='';
  while(n>0){
    const rem = (n-1)%26;
    s = String.fromCharCode(65+rem) + s;
    n = Math.floor((n-1)/26);
  }
  return s;
}

export default async function handler(req,res){
  if(req.method !== 'POST'){
    res.setHeader('Allow','POST');
    return res.status(405).json({ ok:false, error:'Method not allowed - use POST' });
  }

  let body;
  try { body = (typeof req.body === 'object') ? req.body : JSON.parse(req.body || '{}'); }
  catch(e){ return res.status(400).json({ ok:false, error:'Invalid JSON' }); }

  const id = body.id ? String(body.id).trim() : '';
  const suppliedRow = body.row ? Number(body.row) : null;

  if(!id && !suppliedRow) return res.status(400).json({ ok:false, error:'Missing id or row' });

  const allowed = ['assignedTo','priority','status','deadline','requestedBy'];
  const updates = {};
  for(const k of allowed) if(body[k] !== undefined) updates[k] = body[k];
  if(Object.keys(updates).length === 0) return res.status(400).json({ ok:false, error:'No updatable fields provided' });

  // Normalize some fields
  if(updates.priority){ updates.priority = String(updates.priority).trim(); }
  if(updates.status){
    const s = String(updates.status).toLowerCase();
    if(['inprogress','in progress','working on','working'].includes(s)) updates.status = 'In Progress';
    else if(['on hold','hold','cancelled','canceled'].includes(s)) updates.status = 'On Hold';
    else if(['completed','done'].includes(s)) updates.status = 'Completed';
    else updates.status = String(updates.status);
  }
  if(updates.deadline){
    const dt = new Date(updates.deadline);
    if(isNaN(dt)) return res.status(400).json({ ok:false, error:'Invalid deadline date' });
    updates.deadline = dt.toISOString();
  }

  const results = { ok:true, sheetsResult:null, backendResult:null, diagnostics:[], warnings:[] };

  // --- Google Sheets block ---
  const SHEET_CLIENT_EMAIL = process.env.GOOGLE_SHEETS_CLIENT_EMAIL;
  let SHEET_PRIVATE_KEY = process.env.GOOGLE_SHEETS_PRIVATE_KEY;
  const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
  const SHEET_NAME = process.env.SHEET_NAME || 'Sheet1';

  if(SHEET_CLIENT_EMAIL && SHEET_PRIVATE_KEY && SPREADSHEET_ID){
    try{
      if(typeof SHEET_PRIVATE_KEY === 'string' && SHEET_PRIVATE_KEY.indexOf('\\n') !== -1){
        SHEET_PRIVATE_KEY = SHEET_PRIVATE_KEY.replace(/\\n/g,'\n');
      }
      const auth = new google.auth.JWT(
        SHEET_CLIENT_EMAIL, null, SHEET_PRIVATE_KEY,
        ['https://www.googleapis.com/auth/spreadsheets']
      );
      const sheets = google.sheets({version:'v4', auth});
      // header row
      const headerResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:Z1`,
      });
      const headers = (headerResp.data.values && headerResp.data.values[0]) || [];

      function findHeaderIndex(names, fallbackCol){
        for(const n of names){
          const idx = headers.findIndex(h => String(h||'').trim().toLowerCase() === n.toLowerCase());
          if(idx>=0) return idx+1;
        }
        if(fallbackCol) return colLetterToIndex(fallbackCol);
        return null;
      }

      const colIndex = {
        id: findHeaderIndex(['id','task id','sheet id'],'A'),
        requestedBy: findHeaderIndex(['requested by','requester','requestedby'],'B'),
        assignedTo: findHeaderIndex(['assigned to','assignedto','assigned'],'C'),
        priority: findHeaderIndex(['priority'],'D'),
        status: findHeaderIndex(['status'],'E'),
        deadline: findHeaderIndex(['deadline','due date','due'],'F'),
      };

      // load all rows
      const rowsResp = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2:Z`,
      });
      const rows = rowsResp.data.values || [];

      let foundRowNumber = null;
      if(suppliedRow && Number.isInteger(suppliedRow) && suppliedRow > 1){
        foundRowNumber = suppliedRow;
        results.diagnostics.push(`Using supplied row ${foundRowNumber}`);
      } else if(id){
        // find by id in id column or anywhere if id column missing
        for(let i=0;i<rows.length;i++){
          const r = rows[i];
          const sheetRow = i + 2;
          if(colIndex.id){
            const c = r[colIndex.id - 1];
            if(c !== undefined && String(c).trim() === String(id).trim()){
              foundRowNumber = sheetRow; break;
            }
            // also tolerate if sheet cell is numeric and id is numeric string
            if(c !== undefined && String(c).trim() === String(Number(id)).trim()){
              foundRowNumber = sheetRow; break;
            }
          } else {
            // search entire row
            if(r.some(c => String(c||'').trim() === String(id).trim() || String(c||'').trim() === String(Number(id)).trim())){
              foundRowNumber = sheetRow; break;
            }
          }
        }
        results.diagnostics.push(`Row search finished, foundRowNumber=${foundRowNumber}`);
      }

      if(!foundRowNumber){
        results.sheetsResult = { ok:false, error:'Missing row number', note:'ID not found in sheet. You can supply "row" in POST body to bypass search.' , headerSample: headers.slice(0,10) };
        results.warnings.push('Row lookup failed - ID not found');
      } else {
        // prepare update ranges
        const writes = [];
        if(updates.assignedTo !== undefined && colIndex.assignedTo){
          writes.push({ range:`${SHEET_NAME}!${columnLetter(colIndex.assignedTo)}${foundRowNumber}`, values:[[String(updates.assignedTo)]] });
        }
        if(updates.priority !== undefined && colIndex.priority){
          writes.push({ range:`${SHEET_NAME}!${columnLetter(colIndex.priority)}${foundRowNumber}`, values:[[String(updates.priority)]] });
        }
        if(updates.status !== undefined && colIndex.status){
          writes.push({ range:`${SHEET_NAME}!${columnLetter(colIndex.status)}${foundRowNumber}`, values:[[String(updates.status)]] });
        }
        if(updates.requestedBy !== undefined && colIndex.requestedBy){
          writes.push({ range:`${SHEET_NAME}!${columnLetter(colIndex.requestedBy)}${foundRowNumber}`, values:[[String(updates.requestedBy)]] });
        }
        if(updates.deadline !== undefined && colIndex.deadline){
          writes.push({ range:`${SHEET_NAME}!${columnLetter(colIndex.deadline)}${foundRowNumber}`, values:[[String(updates.deadline)]] });
        }

        if(writes.length === 0){
          results.sheetsResult = { ok:false, error:'No mapped columns to update for provided fields', colIndex };
          results.warnings.push('No mapped columns');
        } else {
          const batch = await sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: { valueInputOption:'USER_ENTERED', data:writes }
          });
          results.sheetsResult = { ok:true, updated: batch.data.updatedRanges || null, batch: batch.data };
        }

        // append audit to Logs sheet if present (non-fatal)
        try{
          const logSheet = process.env.LOGS_SHEET_NAME || 'Logs';
          const actor = req.headers['x-user-email'] || body.actor || 'unknown';
          const now = new Date().toISOString();
          const changes = Object.entries(updates).map(([k,v]) => `${k}=${v}`).join('; ');
          await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${logSheet}!A1`,
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: [[now, actor, id, foundRowNumber, changes]]}
          });
        }catch(e){
          results.warnings.push('Audit append failed: ' + (e.message||String(e)));
        }
      }
    }catch(err){
      results.sheetsResult = { ok:false, error: err.message || String(err) };
      results.warnings.push('Sheets error: ' + (err.message||String(err)));
    }
  } else {
    results.warnings.push('Google Sheets not configured - skipping sheet update');
  }

  // --- Backend update (optional) ---
  const TASKS_BACKEND = process.env.TASKS_BACKEND;
  if(TASKS_BACKEND){
    try{
      const base = String(TASKS_BACKEND).replace(/\/+$/,'');
      const url = `${base}/api/tasks/${encodeURIComponent(id)}`;
      const opts = { method:'PATCH', headers:{'content-type':'application/json'} , body: JSON.stringify(updates) };
      if(process.env.TASKS_BACKEND_TOKEN) opts.headers.authorization = `Bearer ${process.env.TASKS_BACKEND_TOKEN}`;
      const r = await fetch(url, opts);
      const txt = await r.text();
      let jb = null;
      try { jb = JSON.parse(txt); } catch(e){ jb = { raw: txt }; }
      results.backendResult = { ok: r.ok, status: r.status, body: jb, url };
    }catch(e){
      results.backendResult = { ok:false, error: e.message || String(e) };
      results.warnings.push('Backend call failed: ' + (e.message||String(e)));
    }
  } else {
    results.warnings.push('TASKS_BACKEND not configured - skipping backend update');
  }

  return res.status(200).json(results);
}
