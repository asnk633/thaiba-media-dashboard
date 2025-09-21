// api/roles.js
// Vercel serverless function that returns the configured lists of admins and team members
// Make sure you set ADMIN_USERS and TEAM_MEMBERS env vars in Vercel (see notes below).

export default function handler(req, res) {
  // Read environment variables (expected to be JSON arrays or comma-separated)
  const rawAdmins = process.env.ADMIN_USERS || '[]';
  const rawTeam = process.env.TEAM_MEMBERS || '[]';

  // Accept either JSON array string or comma-separated list
  function parseList(raw) {
    if (!raw) return [];
    // Try JSON
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim()).filter(Boolean);
    } catch (e) {
      // not JSON
    }
    // fallback to comma-separated
    return String(raw).split(',').map(s => s.trim()).filter(Boolean);
  }

  const admins = parseList(rawAdmins);
  const team = parseList(rawTeam);

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // small cache
  return res.json({ ok: true, admins, team });
}
