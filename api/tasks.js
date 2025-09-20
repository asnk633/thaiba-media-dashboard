// normalizeStatus(raw)
// - converts many sheet labels into the frontend canonical set:
//   "Pending", "In Progress", "On Hold", "Completed"
function normalizeStatus(raw) {
  if (!raw) return 'Pending';
  const s = String(raw).trim().toLowerCase();

  // map common variations to canonical values
  if (s === 'working on' || s === 'working' || s === 'in progress' || s === 'workingon' || s === 'working-on') {
    return 'In Progress';
  }
  if (s === 'cancelled' || s === 'canceled' || s === 'cancel' || s === 'cancelled ') {
    return 'On Hold';
  }
  if (s === 'pending' || s === 'open' || s === 'todo') {
    return 'Pending';
  }
  if (s === 'completed' || s === 'done' || s === 'finished') {
    return 'Completed';
  }

  // fallback: title-case whatever label we received
  return s.split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}
