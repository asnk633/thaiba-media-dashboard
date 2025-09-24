export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const incomingNonce = req.headers?.get('x-debug-nonce') || 'no-nonce';
  console.log('[/api/debug/sheets] handler invoked', {
    time: new Date().toISOString(),
    nonce: incomingNonce,
  });

  return new Response(JSON.stringify({
    ok: true,
    route: '/api/debug/sheets',
    deployedAt: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' }});
}
