// api/create-task.js
import { getSheetsClient } from '../utils/googleAuth.js';
import { getEnv } from '../utils/env.js';

export default async function handler(req, res) {
  try {
    console.info('Received /api/create-task', { method: req.method });

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const userEmail = req.headers['x-user-email'] || req.body.requester_email || 'guest';
    const { description, assignedTo, priority, status, requestedBy, deadline, notes } = req.body || {};
    if (!description) return res.status(400).json({ error: 'Missing description' });

    const id = `T${Date.now()}`;
    const sheets = getSheetsClient();
    const spreadsheetId = getEnv('SPREADSHEET_ID');
    const row = [id, description, assignedTo || '', priority || 'Low', status || 'Pending', requestedBy || userEmail, deadline || '', notes || ''];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${getEnv('SHEET_TAB', 'Sheet1')}!A:H`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] }
    });

    return res.json({ ok: true, row, createdBy: userEmail });
  } catch (err) {
    console.error('Failed to create task:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
