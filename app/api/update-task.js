// api/update-task.js
import { getSheetsClient } from '../utils/googleAuth.js';
import { getEnv } from '../utils/env.js';

export default async function handler(req, res) {
  try {
    console.info('Received /api/update-task', { method: req.method, body: req.body });

    if (req.method !== 'POST' && req.method !== 'PUT') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { id, row, status, priority, assignedTo, deadline } = req.body;
    const userEmail = req.headers['x-user-email'] || 'guest';
    const sheets = getSheetsClient();
    const spreadsheetId = getEnv('SPREADSHEET_ID');
    let rowNum = row;

    if (!rowNum && id) {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${getEnv('SHEET_TAB', 'Sheet1')}!A2:A`
      });
      const ids = response.data.values || [];
      const idx = ids.findIndex(r => r[0] === id);
      if (idx === -1) return res.status(404).json({ error: 'Task ID not found' });
      rowNum = idx + 2;
    }

    if (!rowNum) {
      return res.status(400).json({ error: 'Missing row number or id could not be mapped' });
    }

    const updates = [];
    if (status) updates.push({ range: `E${rowNum}`, values: [[status]] });
    if (priority) updates.push({ range: `D${rowNum}`, values: [[priority]] });
    if (assignedTo) updates.push({ range: `C${rowNum}`, values: [[assignedTo]] });
    if (deadline) updates.push({ range: `G${rowNum}`, values: [[deadline]] });

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId,
      requestBody: { valueInputOption: 'RAW', data: updates }
    });

    return res.json({ ok: true, row: rowNum, updatedBy: userEmail });
  } catch (err) {
    console.error('Failed to update task:', err);
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}
