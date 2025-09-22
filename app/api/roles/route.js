import { NextResponse } from "next/server";

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

    const spreadsheetId = process.env.GOOGLE_SHEETS_ID;
    if (!spreadsheetId) {
      console.error("[v0] Missing GOOGLE_SHEETS_ID env var");
      return NextResponse.json({ error: "Server misconfigured: missing spreadsheet id" }, { status: 500 });
    }

    // Lazy import google auth util
    const { getGoogleSheetsClient } = await import("../../../utils/googleAuth.js");
    const sheets = await getGoogleSheetsClient();

    const range = "Team!A:C"; // Adjust range if needed
    console.log("[v0] Reading from spreadsheet:", spreadsheetId);

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = response.data.values || [];
    console.log("[v0] Retrieved rows:", rows.length);

    const userRow = rows.find((row) => row[1] && row[1].toLowerCase() === userEmail.toLowerCase());

    if (!userRow) {
      console.log("[v0] User not found in team sheet");
      return NextResponse.json({
        role: "guest",
        message: "User not found in team sheet",
      }, { status: 200 });
    }

    const role = (userRow[2] || "member").toLowerCase();

    return NextResponse.json({
      role,
      name: userRow[0] || "",
      email: userRow[1] || "",
    }, { status: 200 });
  } catch (error) {
    console.error("[v0] Roles API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
