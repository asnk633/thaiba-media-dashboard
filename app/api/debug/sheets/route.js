export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  console.log("[/api/debug/sheets] handler invoked", {
    time: new Date().toISOString()
  });
  try {
    return Response.json({
      ok: true,
      route: "/api/debug/sheets",
      deployedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/debug/sheets] error", err && (err.stack || err.message || String(err)));
    return Response.json({ ok: false, error: String(err) }, { status: 500 });
  } finally {
    console.log("[/api/debug/sheets] handler end", {
      time: new Date().toISOString()
    });
  }
}
