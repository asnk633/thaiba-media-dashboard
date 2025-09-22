export async function GET(request) {
  try {
    console.log("[v0] Roles API called");

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    if (!userEmail) {
      console.log("[v0] No email provided");
      return Response.json({ error: "Email parameter required" }, { status: 400 });
    }

    console.log("[v0] Fetching role for email:", userEmail);

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(process.env.GOOGLE_SHEETS_ID);

    console.log("[v0] Spreadsheet title:", doc.title);

    // helper to search a sheet (headered or simple list)
    const findInSheetByEmail = async (sheetTitle, email) => {
      try {
        const sheet = doc.sheetsByTitle[sheetTitle];
        if (!sheet) {
          console.log(`[v0] Sheet not found: ${sheetTitle}`);
          return null;
        }
        console.log(`[v0] Searching sheet "${sheetTitle}" (rows: ${sheet.rowCount})`);
        const rows = await sheet.getRows();
        const eLower = email.toLowerCase();

        for (const row of rows) {
          const raw = row._rawData || [];

          // header-based: find a column whose header name includes 'email'
          for (const key of Object.keys(row)) {
            if (key && typeof key === "string" && key.toLowerCase().includes("email")) {
              const val = (row[key] || "").toString().trim().toLowerCase();
              if (val === eLower) {
                const name = (row.Name || row.name || raw[0] || "").toString().trim();
                const role = (row.Role || row.role || raw[2] || "").toString().trim();
                return { name, email: val, role: role || "member" };
              }
            }
          }

          // fallback: check raw cells for direct email match (common for single-column lists)
          for (const cell of raw) {
            if (!cell) continue;
            const cellStr = cell.toString().trim().toLowerCase();
            if (cellStr === eLower) {
              return { name: "", email: cellStr, role: "member" };
            }
          }
        }

        return null;
      } catch (err) {
        console.error(`[v0] Error searching sheet ${sheetTitle}:`, err);
        return null;
      }
    };

    // 1) Try Team (structured)
    let userRow = await findInSheetByEmail("Team", userEmail);

    // 2) Then TeamEmails (email-only list)
    if (!userRow) {
      userRow = await findInSheetByEmail("TeamEmails", userEmail);
    }

    // 3) Then users (fallback)
    if (!userRow) {
      userRow = await findInSheetByEmail("users", userEmail);
    }

    // If we found an email in TeamEmails but name missing, enrich from Team/users
    if (userRow && !userRow.name) {
      try {
        const fallback = doc.sheetsByTitle["Team"] || doc.sheetsByTitle["users"];
        if (fallback) {
          const fallbackRows = await fallback.getRows();
          const eLower = userRow.email.toLowerCase();
          const found = fallbackRows.find(r => {
            const raw = (r._rawData || []).map(c => (c || "").toString().toLowerCase());
            if (raw.includes(eLower)) return true;
            // also check headered fields
            for (const val of Object.values(r)) {
              if ((val || "").toString().toLowerCase() === eLower) return true;
            }
            return false;
          });
          if (found) {
            userRow.name = userRow.name || (found.Name || found.name || found._rawData[0] || "").toString().trim();
            userRow.role = userRow.role || (found.Role || found.role || found._rawData[2] || "member").toString().trim();
            console.log("[v0] Enriched userRow from fallback sheet:", userRow.name, userRow.role);
          }
        }
      } catch (err) {
        console.error("[v0] fallback enrichment failed:", err);
      }
    }

    if (!userRow) {
      console.log("[v0] User not found in any inspected sheet");
      return Response.json({
        role: "guest",
        message: "User not found in team sheet",
      });
    }

    return Response.json({
      role: (userRow.role || "member").toLowerCase(),
      name: userRow.name || "",
      email: userRow.email || userEmail,
    });
  } catch (error) {
    console.error("[v0] Roles API error:", error);
    return Response.json(
      {
        error: "Failed to fetch user role",
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}
