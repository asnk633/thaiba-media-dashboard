export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const sheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID;
    const hasKey = !!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64 || process.env.GOOGLE_SERVICE_ACCOUNT_KEY);

    if (!sheetId || !hasKey) {
      return Response.json({
        ok: false,
        reason: "missing_env",
        sheetIdPresent: !!sheetId,
        hasKey,
      });
    }

    const { getGoogleSpreadsheetClient } = await import("../../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(sheetId);

    return Response.json({
      ok: true,
      spreadsheet: {
        title: doc.title,
        sheetCount: doc.sheetCount,
        sheets: doc.sheetsByIndex.map(s => s.title),
      },
    });
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 });
  }
}
