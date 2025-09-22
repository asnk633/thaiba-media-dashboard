export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    console.log("[v0] Roles API called");
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get("email") || "").trim();
    if (!userEmail) {
      console.log("[v0] No email provided");
      return Response.json({ error: "Email parameter required" }, { status: 400 });
    }
    console.log("[v0] Fetching role for email:", userEmail);

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(process.env.GOOGLE_SHEETS_ID);
    console.log("[v0] Spreadsheet title:", doc.title);

    const eLower = userEmail.toLowerCase();

    // Search a specific sheet for an exact email match and return a normalized row object
    const findInSheet = async (sheet) => {
      try {
        if (!sheet) return null;
        const rows = await sheet.getRows();
        for (const row of rows) {
          // header-based check: any header containing 'email'
          for (const key of Object.keys(row)) {
            if (key && typeof key === "string" && key.toLowerCase().includes("email")) {
              const val = (row[key] || "").toString().trim().toLowerCase();
              if (val === eLower) {
                // try to locate name and role fields by common header names
                const name = (row.Name || row.name || row.FullName || row.fullname || row["display name"] || row["display_name"] || row._rawData?.[0] || "").toString().trim();
                const role = (row.Role || row.role || row.Access || row.access || row._rawData?.[2] || "").toString().trim();
                return { name, email: val, role: role || "member" };
              }
            }
          }
          // raw-data fallback: check each cell for direct email match
          const raw = row._rawData || [];
          for (let i = 0; i < raw.length; i++) {
            const cell = (raw[i] || "").toString().trim().toLowerCase();
            if (cell === eLower) {
              // name guess: prefer a neighboring cell (left or right), else first cell
              const nameGuess = (raw[i-1] || raw[0] || "").toString().trim();
              return { name: nameGuess, email: cell, role: "member" };
            }
          }
        }
        return null;
      } catch (err) {
        console.error("[v0] findInSheet error", err);
        return null;
      }
    };

    // 1) Try Team and users
    let userRow = null;
    const trySheets = ["Team", "users", "TeamEmails"];
    for (const t of trySheets) {
      const s = doc.sheetsByTitle[t];
      if (s) {
        userRow = await findInSheet(s);
        if (userRow) {
          console.log("[v0] Found in sheet:", t);
          break;
        }
      }
    }

    // 2) If not found, search all sheets (last resort)
    if (!userRow) {
      console.log("[v0] Searching all sheets as fallback");
      for (const s of doc.sheetsByIndex) {
        userRow = await findInSheet(s);
        if (userRow) {
          console.log("[v0] Found in sheet (fallback):", s.title);
          break;
        }
      }
    }

    if (!userRow) {
      console.log("[v0] User not found in any sheet");
      return Response.json({ role: "guest", message: "User not found in team sheet" });
    }

    return Response.json({
      role: (userRow.role || "member").toLowerCase(),
      name: userRow.name || "",
      email: userRow.email || userEmail,
    });
  } catch (error) {
    console.error("[v0] Roles API error:", error);
    return Response.json(
      { error: "Failed to fetch user role", details: error.message || String(error) },
      { status: 500 },
    );
  }
}
