// app/api/debug/sheets/route.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("[debug] /api/debug/sheets called");

    const hasKeyRaw = !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;
    const keyPreview = (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY || "")
      ? (process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY).slice(0, 64) + "..."
      : null;

    const sheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
    console.log("[debug] env present:", { hasKeyRaw, sheetId: !!sheetId });

    // don't attempt to connect if missing sheet id or key
    if (!hasKeyRaw || !sheetId) {
      return Response.json({
        ok: false,
        reason: "missing_env",
        hasKeyRaw,
        keyPreview: keyPreview ? keyPreview.replace(/\n/g, "\\n") : null,
        sheetIdPresent: !!sheetId,
      });
    }

    // import helper and attempt connect
    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(sheetId);

    const titles = (doc.sheetsByIndex || []).map(s => s.title || "(untitled)");
    return Response.json({
      ok: true,
      spreadsheet: { title: doc.title || null, sheetCount: doc.sheetCount || titles.length, sheets: titles },
      keyPreview: keyPreview ? keyPreview.replace(/\n/g, "\\n") : null
    });
  } catch (err) {
    console.error("[debug] connect error:", err?.message || err);
    return Response.json({ ok: false, reason: "connect_failed", message: err?.message || String(err) }, { status: 500 });
  }
}
