// testApis.js
const fetch = require('node-fetch'); // if using node 18+, you can use global fetch
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

const endpoints = [
  { path: '/api/tasks', method: 'GET' },
  { path: '/api/roles', method: 'GET' },
];

async function testEndpoint(ep) {
  const url = BASE_URL + ep.path;
  try {
    const options = { method: ep.method, headers: { 'Content-Type': 'application/json' } };
    const res = await fetch(url, options);
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }

    console.log(`\n${ep.method} ${url} -> ${res.status}`);
    if (res.ok) console.log('✅', body);
    else console.error('❌', body);
  } catch (err) {
    console.error(`❌ Fetch failed for ${url}:`, err.message || err);
  }
}

(async () => {
  for (const ep of endpoints) {
    await testEndpoint(ep);
  }
})();
