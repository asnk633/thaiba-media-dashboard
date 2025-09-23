export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  // Minimal, guaranteed-to-work route to confirm deployment/routing
  try {
    return Response.json({
      ok: true,
      route: "/api/debug/sheets",
      deployedAt: new Date().toISOString()
    });
  } catch (err) {
    // Should never hit here, but return JSON so Vercel doesn't return FUNCTION_INVOCATION_FAILED
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
