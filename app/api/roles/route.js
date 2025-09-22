import { NextResponse } from "next/server";

// Helper: find a row by email using google-spreadsheet rows with headers
function normalizeStr(s) {
  return (s || "").toString().trim().toLowerCase();
}

export async function GET(request) {
  try {
    console.log("[v0] Roles API called");

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      console.log("[v0] No email provided");
      return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
    }

    console.log("[v0] Fetching role for email:", userEmail);

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.error("[v0] Missing GOOGLE_SHEETS_ID/GOOGLE_SPREADSHEET_ID env var");
      return NextResponse.json({ error: "Server misconfigured: missing spreadsheet id" }, { status: 500 });
    }

    // Import helper that returns a GoogleSpreadsheet doc
    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    if (typeof getGoogleSpreadsheetClient !== "function") {
      console.error("[v0] getGoogleSpreadsheetClient is not exported from utils/googleAuth.js");
      return NextResponse.json({ error: "Server misconfigured: google auth util missing" }, { status: 500 });
    }

    const doc = await getGoogleSpreadsheetClient(spreadsheetId);

    // Choose sheet by title "Team" (adjust to your actual sheet title)
    const sheetTitle = "Team";
    const sheet = doc.sheetsByTitle?.[sheetTitle] ?? doc.sheetsByIndex?.[0];

    if (!sheet) {
      console.error("[v0] Sheet not found:", sheetTitle);
      return NextResponse.json({ error: `Sheet '${sheetTitle}' not found` }, { status: 500 });
    }

    // Ensure header row is loaded (so row property names like 'Email' work)
    try {
      await sheet.loadHeaderRow();
    } catch (e) {
      console.warn("[v0] loadHeaderRow failed or not needed:", e?.message || e);
    }

    // Get all rows (google-spreadsheet API)
    const rows = await sheet.getRows();
    console.log("[v0] Retrieved rows:", rows.length);

    // Find row by email -- prefer header name 'Email' if present, otherwise fallback to indexing
    let userRow = rows.find((r) => {
      // Try header-based field first
      if (r.Email !== undefined) {
        return normalizeStr(r.Email) === normalizeStr(userEmail);
      }
      // Fallback to raw data if headers aren't present (row._rawData is array of cells)
      if (Array.isArray(r._rawData)) {
        return normalizeStr(r._rawData[1]) === normalizeStr(userEmail);
      }
      return false;
    });

    if (!userRow) {
      console.log("[v0] User not found in team sheet");
      return NextResponse.json({
        role: "guest",
        message: "User not found in team sheet",
      }, { status: 200 });
    }

    // extract role/name/email robustly
    const role = (userRow.Role ?? userRow.role ?? userRow._rawData?.[2] ?? "member").toString().toLowerCase();
    const name = userRow.Name ?? userRow.name ?? userRow._rawData?.[0] ?? "";
    const email = userRow.Email ?? userRow.email ?? userRow._rawData?.[1] ?? "";

    console.log("[v0] Found role for user:", role);

    return NextResponse.json({ role, name, email }, { status: 200 });
  } catch (error) {
    console.error("[v0] Roles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
