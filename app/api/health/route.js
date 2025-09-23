export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json({ ok: true, route: '/api/health', now: new Date().toISOString() });
  } catch (err) {
    console.error('health error', err && (err.stack||err.message||String(err)));
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
