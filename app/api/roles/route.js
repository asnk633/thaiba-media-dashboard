export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get("email") || "").trim().toLowerCase();

    if (!userEmail) {
      return Response.json({ error: "Email parameter required" }, { status: 400 });
    }

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const doc = await getGoogleSpreadsheetClient(sheetId);

    const teamSheet = doc.sheetsByTitle["TeamEmails"] || doc.sheetsByTitle["Team"] || doc.sheetsByTitle["users"];
    if (!teamSheet) {
      return Response.json({ error: "Team sheet not found" }, { status: 500 });
    }

    const rows = await teamSheet.getRows();
    const row = rows.find(r =>
      Object.values(r._rawData).some(val => val.toString().trim().toLowerCase() === userEmail)
    );

    if (!row) {
      return Response.json({ role: "guest", email: userEmail });
    }

    return Response.json({
      role: (row.Role || row.role || "member").toLowerCase(),
      name: row.Name || row.name || "",
      email: userEmail,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
