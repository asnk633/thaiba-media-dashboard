export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  try {
    console.log("[v0] Tasks API called");
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get("email") || "").trim();

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(process.env.GOOGLE_SHEETS_ID);

    // find tasks sheet
    const sheetTitles = ["tasks", "Tasks", "MediaTasks", "Media Tasks"];
    let tasksSheet = null;
    for (const t of sheetTitles) {
      if (doc.sheetsByTitle[t]) { tasksSheet = doc.sheetsByTitle[t]; break; }
    }
    if (!tasksSheet) {
      tasksSheet = doc.sheetsByIndex.find(s => s.title.toLowerCase().includes("task"));
    }
    if (!tasksSheet) {
      console.log("[v0] No tasks sheet found");
      return Response.json({ tasks: [] });
    }

    console.log("[v0] Using tasks sheet:", tasksSheet.title);
    const rows = await tasksSheet.getRows();

    const tasks = rows.map(r => {
      const normalized = {};
      for (const k of Object.keys(r)) {
        if (!k) continue;
        normalized[k.toLowerCase()] = r[k];
      }
      const raw = r._rawData || [];
      return {
        id: normalized["id"] || raw[0] || "",
        title: normalized["title"] || raw[1] || "",
        description: normalized["description"] || raw[2] || "No description",
        assignee: (normalized["assignee"] || raw[3] || "").toString(),
        status: normalized["status"] || raw[4] || "",
        priority: normalized["priority"] || raw[5] || "",
        dueDate: normalized["duedate"] || normalized["due date"] || raw[6] || "",
        requestedBy: normalized["requestedby"] || raw[7] || "",
        submittedBy: (normalized["submittedby"] || raw[8] || "").toString(),
      };
    });

    // resolve userName if email provided
    let userName = null;
    if (userEmail) {
      const findUserName = async (sheetTitle) => {
        try {
          const sheet = doc.sheetsByTitle[sheetTitle];
          if (!sheet) return null;
          const rows = await sheet.getRows();
          const eLower = userEmail.toLowerCase();
          for (const row of rows) {
            // header-based
            for (const key of Object.keys(row)) {
              if (key && key.toLowerCase().includes("email")) {
                const val = (row[key] || "").toString().trim().toLowerCase();
                if (val === eLower) {
                  return (row.Name || row.name || row._rawData?.[0] || "").toString().trim();
                }
              }
            }
            // raw-data fallback
            const raw = row._rawData || [];
            if (raw.some(c => (c || "").toString().trim().toLowerCase() === eLower)) {
              return (row.Name || row.name || raw[0] || "").toString().trim();
            }
          }
        } catch (err) { console.error("[v0] findUserName error", err); }
        return null;
      };

      userName = (await findUserName("Team")) || (await findUserName("users")) || (await findUserName("TeamEmails"));

      // fallback: search all sheets for an associated name if still null
      if (!userName) {
        for (const s of doc.sheetsByIndex) {
          const n = await findUserName(s.title);
          if (n) { userName = n; break; }
        }
      }
      console.log("[v0] tasks API - resolved userName:", userName);
    }

    // Filtering logic:
    // - If userName available -> match by name in assignee/submittedBy
    // - Else if userEmail provided -> match email string inside assignee/submittedBy cells
    let filtered = tasks;
    if (userName) {
      const ln = userName.toLowerCase();
      filtered = tasks.filter(t => {
        const a = (t.assignee || "").toLowerCase();
        const s = (t.submittedBy || "").toLowerCase();
        return a.includes(ln) || s.includes(ln);
      });
    } else if (userEmail) {
      const le = userEmail.toLowerCase();
      filtered = tasks.filter(t => {
        const a = (t.assignee || "").toLowerCase();
        const s = (t.submittedBy || "").toLowerCase();
        return a.includes(le) || s.includes(le);
      });
    }

    return Response.json({ tasks: filtered });
  } catch (error) {
    console.error("[v0] Tasks API error:", error);
    return Response.json({ error: "Failed to fetch tasks", details: error.message || String(error) }, { status: 500 });
  }
}
