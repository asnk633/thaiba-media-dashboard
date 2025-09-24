# Remove the console.log(...) line, then CTRL+O, Enter, CTRL+X to save & 
# exitexport const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  const incomingNonce = req.headers?.get('x-debug-nonce') || 'no-nonce';

  return new Response(JSON.stringify({
    ok: true,
    route: '/api/debug/sheets',
    deployedAt: new Date().toISOString()
  }), { headers: { 'Content-Type': 'application/json' }});
}
