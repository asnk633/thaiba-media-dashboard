export async function GET() {
  return Response.json({ ok: true, app: "thaiba-media-dashboard", ts: Date.now() });
}
