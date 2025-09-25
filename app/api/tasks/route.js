import zlib from 'node:zlib';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function tryParseResponseAsJson(res) {
  try {
    // If server returned a body with gzip encoding, gunzip before parsing
    const enc = res.headers && res.headers.get ? res.headers.get('content-encoding') : '';
    const buf = Buffer.from(await res.arrayBuffer());
    if (enc && enc.toLowerCase().includes('gzip')) {
      const unzipped = zlib.gunzipSync(buf).toString('utf8');
      return JSON.parse(unzipped);
    }
    // otherwise try parse as text
    const txt = buf.toString('utf8');
    return JSON.parse(txt);
  } catch (err) {
    // don't throw—return null so caller can handle gracefully
    console.error('tryParseResponseAsJson failed:', String(err));
    return null;
  }
}

export async function GET(req) {
  try {
    // Example: if your original handler fetched some remote URL, adjust below.
    // Replace REMOTE_URL with whatever your handler actually calls, or adapt
    // to re-use your existing logic but use tryParseResponseAsJson() for parsing.
    const REMOTE_URL = process.env.TASKS_SOURCE_URL || 'https://example.com/placeholder.json';

    const r = await fetch(REMOTE_URL, { next: { revalidate: 0 } });
    const parsed = await tryParseResponseAsJson(r);

    // If parsed is null, return empty tasks rather than erroring
    const tasks = parsed?.tasks ?? [];

    return new Response(JSON.stringify({ ok: true, tasks }), { headers: { 'Content-Type': 'application/json' }});
  } catch (err) {
    console.error('GET /api/tasks uncaught error:', err && err.stack ? err.stack : String(err));
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' }});
  }
}
