export async function GET(request) {
  try {
    console.log("[v0] Tasks API called");

    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get("email");

    // Get Google Sheets client
    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const doc = await getGoogleSpreadsheetClient(process.env.GOOGLE_SHEETS_ID);

    // load tasks sheet - try common sheet names (tasks, Tasks, MediaTasks)
    const sheetTitles = ["tasks", "Tasks", "MediaTasks", "Media Tasks"];
    let tasksSheet = null;
    for (const t of sheetTitles) {
      if (doc.sheetsByTitle[t]) {
        tasksSheet = doc.sheetsByTitle[t];
        break;
      }
    }
    if (!tasksSheet) {
      // fallback to first sheet named 'tasks' by index scan
      tasksSheet = doc.sheetsByIndex.find(s => s.title.toLowerCase().includes("task"));
    }
    if (!tasksSheet) {
      console.log("[v0] No tasks sheet found");
      return Response.json({ tasks: [] });
    }

    console.log("[v0] Using tasks sheet:", tasksSheet.title);
    const rows = await tasksSheet.getRows();
    // Convert sheet rows into JS objects (try to use headers if present)
    const tasks = rows.map(r => {
      // try headered properties first (case-insensitive)
      const normalized = {};
      for (const k of Object.keys(r)) {
        if (!k) continue;
        normalized[k.toLowerCase()] = r[k];
      }
      // fallback values from rawData (common indices)
      const raw = r._rawData || [];
      return {
        id: normalized["id"] || raw[0] || "",
        title: normalized["title"] || raw[1] || "",
        description: normalized["description"] || raw[2] || "No description",
        assignee: normalized["assignee"] || raw[3] || "",
        status: normalized["status"] || raw[4] || "",
        priority: normalized["priority"] || raw[5] || "",
        dueDate: normalized["duedate"] || normalized["due date"] || raw[6] || "",
        requestedBy: normalized["requestedby"] || raw[7] || "",
        submittedBy: normalized["submittedby"] || raw[8] || "",
      };
    });

    // If email provided, find user's name via Team/TeamEmails/users
    let userName = null;
    if (userEmail) {
      const findUser = async (sheetTitle, email) => {
        try {
          const sheet = doc.sheetsByTitle[sheetTitle];
          if (!sheet) return null;
          const rows = await sheet.getRows();
          const eLower = (email || "").toLowerCase();
          for (const row of rows) {
            // header-based check
            for (const key of Object.keys(row)) {
              if (key && key.toLowerCase().includes("email")) {
                const val = (row[key] || "").toString().trim().toLowerCase();
                if (val === eLower) {
                  return (row.Name || row.name || row._rawData[0] || "").toString().trim();
                }
              }
            }
            // raw cells check
            const raw = row._rawData || [];
            if (raw.some(c => (c || "").toString().trim().toLowerCase() === eLower)) {
              return (row.Name || row.name || raw[0] || "").toString().trim();
            }
          }
        } catch (err) {
          console.error("[v0] findUser error for sheet", sheetTitle, err);
        }
        return null;
      };

      userName = (await findUser("Team", userEmail)) || (await findUser("users", userEmail)) || (await findUser("TeamEmails", userEmail));
      console.log("[v0] tasks API - resolved userName:", userName);
    }

    // If we have a userName, filter tasks where assignee/submittedBy contains the name (case-insensitive)
    let filtered = tasks;
    if (userName) {
      const lowerName = userName.toLowerCase();
      filtered = tasks.filter(t => {
        const assignee = (t.assignee || "").toString().toLowerCase();
        const submittedBy = (t.submittedBy || "").toString().toLowerCase();
        return assignee.includes(lowerName) || submittedBy.includes(lowerName);
      });
    }

    return Response.json({ tasks: filtered });
  } catch (error) {
    console.error("[v0] Tasks API error:", error);
    return Response.json(
      {
        error: "Failed to fetch tasks",
        details: error.message || String(error),
      },
      { status: 500 },
    );
  }
}
