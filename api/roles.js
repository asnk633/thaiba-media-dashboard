// api/roles.js
// Returns configured lists of admins and team members
// Cleans env vars so only plain emails remain

export default function handler(req, res) {
  const rawAdmins = process.env.ADMIN_USERS || '[]';
  const rawTeam = process.env.TEAM_MEMBERS || '[]';

  function parseList(raw) {
    if (!raw) return [];
    let items = [];

    try {
      // Try JSON (if stored as ["email1","email2"])
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) items = parsed;
    } catch {
      // Fallback: comma-separated
      items = String(raw).split(',');
    }

    // 🔹 Normalize values: remove names, keep only email
    return items
      .map(s => String(s).trim())
      .filter(Boolean)
      .map(s => {
        const match = s.match(/<?([^<>@\s]+@[^<>@\s]+)>?/); // extract email if inside <>
        return match ? match[1] : s;
      });
  }

  const admins = parseList(rawAdmins);
  const team = parseList(rawTeam);

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
  return res.json({ ok: true, admins, team });
}
