export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = (searchParams.get("email") || "").trim().toLowerCase();

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js");
    const sheetId = process.env.GOOGLE_SHEETS_ID;
    const doc = await getGoogleSpreadsheetClient(sheetId);

    const taskSheet = doc.sheetsByTitle["tasks"] || doc.sheetsByTitle["MediaTasks"];
    if (!taskSheet) {
      return Response.json({ tasks: [] });
    }

    const rows = await taskSheet.getRows();
    const filtered = userEmail
      ? rows.filter(r =>
          Object.values(r._rawData).some(val => val.toString().trim().toLowerCase() === userEmail)
        )
      : rows;

    const tasks = filtered.map(r => ({
      id: r.id || r.ID || "",
      title: r.title || r.Task || r.task || "",
      status: r.status || r.Status || "pending",
      assignedTo: r.assignedTo || r.AssignedTo || "",
      deadline: r.deadline || r.Deadline || "",
    }));

    return Response.json({ tasks });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
