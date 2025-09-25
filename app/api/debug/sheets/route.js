export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  // Keep this handler minimal and valid JS
  return new Response(JSON.stringify({
    ok: true,
    route: '/api/debug/sheets',
    deployedAt: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' }});
}
