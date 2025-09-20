// api/create-task.js
// Server-side wrapper that accepts a task from the frontend and forwards it to /api/sync
// - Keeps SECRET_KEY server-side so the client never sees it.
// Optional guard:
// - If FRONTEND_KEY env var is set, the request must include header "x-frontend-key" with that value.

const fetch = global.fetch || require('node-fetch');

const SECRET = process.env.SECRET_KEY;
const FRONTEND_KEY = process.env.FRONTEND_KEY || null;

module.exports = async (req, res) => {
  try {
    // Only accept POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Optional guard: if FRONTEND_KEY is set, require it in request headers
    if (FRONTEND_KEY) {
      const frontHeader = req.headers['x-frontend-key'] || req.headers['x-frontend-key'.toLowerCase()];
      if (!frontHeader || frontHeader !== FRONTEND_KEY) {
        return res.status(401).json({ error: 'Forbidden' });
      }
    }

    // Validate payload
    const payload = req.body;
    const task = payload && payload.task;
    if (!task || !task.task_id) {
      return res.status(400).json({ error: 'Missing task object or task_id' });
    }

    // Forward to internal /api/sync with server-side secret
    const syncUrl = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''}/api/sync`;
    // If VERCEL_URL not available, fall back to absolute domain (use deployed domain)
    // Replace with your domain if necessary:
    const effectiveUrl = syncUrl.includes('http') ? syncUrl : `https://${process.env.VERCEL_URL || 'thaiba-media-dashboard.vercel.app'}/api/sync`;

    const resp = await fetch(effectiveUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SECRET}`,
      },
      body: JSON.stringify({ task }),
    });

    const json = await resp.json().catch(() => ({ error: 'Invalid JSON from internal sync' }));

    // Pass along the response code and body
    return res.status(resp.status).json(json);
  } catch (err) {
    console.error('create-task error:', err && (err.stack || err.message || err));
    return res.status(500).json({ error: 'Internal Server Error', details: err.message || String(err) });
  }
};
