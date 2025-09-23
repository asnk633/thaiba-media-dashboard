// api/users.js
module.exports = async (req, res) => {
  // If TEAM_MEMBERS env var exists (JSON array), return that
  try {
    const raw = process.env.TEAM_MEMBERS || '';
    if (raw) {
      let arr = [];
      try { arr = JSON.parse(raw); } catch(e){ arr = raw.split(',').map(s=>s.trim()); }
      return res.status(200).json({ users: arr });
    }
  } catch(e){
    // ignore and use fallback
  }

  const sample = {
    users: ['Anwar <anwar@example.com>','Sabith <sabith@example.com>','Sidheeq <sid@example.com>','Shukoor <shukoor@example.com>']
  };
  return res.status(200).json(sample);
};
