const fs = require('fs');
const path = require('path');

const [, , serviceFile, sheetId] = process.argv;

if (!serviceFile || !sheetId) {
  console.error('Usage: node create-env.js <service-account.json> <GOOGLE_SHEETS_ID>');
  process.exit(2);
}

const servicePath = path.resolve(serviceFile);

if (!fs.existsSync(servicePath)) {
  console.error('File not found:', servicePath);
  process.exit(3);
}

const raw = fs.readFileSync(servicePath, 'utf8');

let parsed;
try {
  parsed = JSON.parse(raw);
} catch (e) {
  console.error('Failed to parse JSON from', servicePath, e.message);
  process.exit(4);
}

// stringify to ensure proper escaping of inner quotes/newlines
const singleLine = JSON.stringify(parsed);

const out = `GOOGLE_SERVICE_ACCOUNT_KEY=${singleLine}
GOOGLE_SHEETS_ID=${sheetId}
`;

fs.writeFileSync('.env.local', out, { encoding: 'utf8' });
console.log('.env.local created (not committed).');
