// api/tasks.js
// This file fetches tasks from the Google Sheet and normalizes statuses

function normalizeStatus(raw) {
  if (!raw) return 'Pending';
  const s = String(raw).trim().toLowerCase();

  if (s === 'working on' || s === 'working' || s === 'in progress') return 'In Progress';
  if (s === 'cancelled' || s === 'canceled') return 'On Hold';
  if (s === 'pending') return 'Pending';
  if (s === 'completed' || s === 'done') return 'Completed';

  // fallback: title-case the text so it's nicer if a new label appears
  return s.split(/\s+/).map(w => w[0]?.toUpperCase() + w.slice(1)).join(' ');
}

// Example: build tasks from Google Sheet rows
// Adjust the indexes if your sheet column order differs
function mapRowToTask(row) {
  return {
    id: row[0] ?? '',              // Task ID column
    description: row[1] ?? '',
    assignedTo: row[2] ?? '',
    priority: row[3] ?? '',
    status: normalizeStatus(row[4]),   // Normalized status
    requestedBy: row[5] ?? '',
    deadline: row[6] ?? '',
    notes: row[7] ?? ''
  };
}

module.exports = { normalizeStatus, mapRowToTask };
