export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function fetchRoles() {
  // original implementation may call remote services — keep this minimal so error surfaces
  // If your real code uses Google Sheets / env vars, it'll run here and any thrown error will be logged.
  // Return a sample structure to avoid breaking callers while we debug.
  return { admins: [], team: [] };
}

export async function GET() {
  console.log('[api/roles] handler start', { time: new Date().toISOString() });
  try {
    const roles = await fetchRoles();
    console.log('[api/roles] roles fetched', { roles });
    return Response.json({ ok: true, roles });
  } catch (err) {
    // log full error (Vercel will capture this in runtime logs)
    console.error('[api/roles] UNHANDLED ERROR', err && (err.stack || err.message || String(err)));
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    console.log('[api/roles] handler end', { time: new Date().toISOString() });
  }
}
