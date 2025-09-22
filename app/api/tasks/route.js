// app/api/tasks/route.js
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { URL } from "url";

async function safeImportGoogleAuth() {
  try {
    return await import("../../../utils/googleAuth.js");
  } catch (err) {
    console.error("[tasks] failed to import utils/googleAuth:", err);
    throw new Error("Missing google auth helper");
  }
}

function normalize(s) {
  return (s || "").toString().trim();
}

function guessSheetTitles() {
  // order of preference to find tasks sheet
  return ["tasks", "Tasks", "Tasks - Anwar", "Media Tasks", "MediaTasks", "tasks"];
}

export async function GET(request) {
  try {
    console.log("[v0] Tasks API called");

    // read email query param
    const { searchParams } = new URL(request.url);
    const emailQuery = normalize(searchParams.get("email")).toLowerCase();

    // ensure spreadsheet id env exists
    const sheetId = process.env.GOOGLE_SHEETS_ID || process.env.GOOGLE_SPREADSHEET_ID || process.env.SPREADSHEET_ID;
    if (!sheetId) {
      console.error("[v0] No spreadsheet id env present");
      return Response.json({ error: "Missing spreadsheet id env (GOOGLE_SHEETS_ID/GOOGLE_SPREADSHEET_ID/SPREADSHEET_ID)" }, { status: 500 });
    }

    // import google auth helper
    const { getGoogleSpreadsheetClient } = await safeImportGoogleAuth();
    if (!getGoogleSpreadsheetClient) {
      console.error("[v0] googleAuth missing export getGoogleSpreadsheetClient");
      return Response.json({ error: "Internal: google auth helper not available" }, { status: 500 });
    }

    const doc = await getGoogleSpreadsheetClient(sheetId);
    console.log("[v0] Connected to spreadsheet:", doc?.title || "(no title)");

    // locate tasks sheet using common names (fall back to last sheet)
    let tasksSheet = null;
    const candidates = guessSheetTitles();
    for (const name of candidates) {
      if (doc.sheetsByTitle && doc.sheetsByTitle[name]) {
        tasksSheet = doc.sheetsByTitle[name];
        console.log("[v0] Found tasks sheet by title:", name);
        break;
      }
    }
    if (!tasksSheet && doc.sheetsByIndex && doc.sheetsByIndex.length) {
      // prefer sheet named 'tasks' ignoring case
      tasksSheet = doc.sheetsByIndex.find(s => (s.title || "").toLowerCase() === "tasks") || doc.sheetsByIndex[doc.sheetsByIndex.length - 1];
      console.log("[v0] Fallback tasks sheet chosen:", tasksSheet?.title);
    }

    if (!tasksSheet) {
      console.error("[v0] No tasks sheet available in spreadsheet");
      return Response.json({ error: "Tasks sheet not found" }, { status: 500 });
    }

    // Try to read as rows (google-spreadsheet `getRows`), fallback to values API
    let rows = [];
    try {
      // many versions expose getRows()
      if (typeof tasksSheet.getRows === "function") {
        rows = await tasksSheet.getRows();
        // convert row objects to a uniform shape
        rows = rows.map(r => {
          // prefer common fields
          const raw = r._rawData || [];
          return {
            id: normalize(r.id || r.ID || r.Id || raw[0]),
            title: normalize(r.title || r.Title || r.Task || raw[1]),
            description: normalize(r.description || r.Description || raw[2]),
            assignee: normalize(r.assignee || r.Assignee || r.assigned || raw[3]),
            status: normalize(r.status || r.Status || raw[4]),
            priority: normalize(r.priority || r.Priority || raw[5]),
            dueDate: normalize(r.dueDate || r.DueDate || raw[6] || raw[5]),
            requestedBy: normalize(r.requestedBy || r.RequestedBy || raw[7]),
            submittedBy: normalize(r.submittedBy || r.SubmittedBy || raw[8]),
            _raw: raw,
          };
        });
      } else if (doc.spreadsheets && doc.spreadsheets.values) {
        // legacy fallback using Sheets API wrapper if present
        const range = `${tasksSheet.title || ""}!A:Z`;
        const resp = await doc.spreadsheets.values.get({ spreadsheetId: sheetId, range });
        const values = resp?.data?.values || [];
        const headers = (values[0] || []).map(h => normalize(h).toLowerCase());
        rows = values.slice(1).map(r => {
          const obj = {};
          for (let i = 0; i < headers.length; i++) obj[headers[i]] = r[i] || "";
          return {
            id: obj.id || obj["task id"] || obj["#"] || r[0],
            title: obj.title || obj.name || r[1],
            description: obj.description || "",
            assignee: obj.assignee || obj.assigned || "",
            status: obj.status || "",
            priority: obj.priority || "",
            dueDate: obj.duedate || obj["due date"] || "",
            requestedBy: obj.requestedby || "",
            submittedBy: obj.submittedby || "",
            _raw: r,
          };
        });
      } else {
        console.warn("[v0] tasksSheet has neither getRows nor spreadsheets.values");
      }
    } catch (err) {
      console.error("[v0] Error reading tasks sheet rows:", err?.message || err);
      // return helpful error so Vercel logs show what failed
      return Response.json({ error: "Failed to read sheet rows", details: err?.message || String(err) }, { status: 500 });
    }

    // If no rows found, return empty list
    if (!Array.isArray(rows) || rows.length === 0) {
      console.log("[v0] No task rows found (empty sheet or different format)");
      return Response.json({ tasks: [] });
    }

    // filter by email if provided: match assignee cell (contains single or comma-separated names/emails)
    let filtered = rows;
    if (emailQuery) {
      filtered = rows.filter(row => {
        const assigneeText = (row.assignee || "").toLowerCase();
        // also check raw row cells for direct email match
        const rawMatched = (row._raw || []).some(cell => (cell || "").toString().toLowerCase() === emailQuery);
        return assigneeText.includes(emailQuery) || rawMatched;
      });
      console.log(`[v0] Filtered tasks by email="${emailQuery}" -> ${filtered.length} results`);
    } else {
      console.log("[v0] No email filter provided; returning all tasks count:", rows.length);
    }

    // Normalise output: minimal shape expected by frontend
    const outTasks = filtered.map(t => ({
      id: t.id || null,
      title: t.title || "",
      description: t.description || "",
      assignee: t.assignee || "",
      status: t.status || "",
      priority: t.priority || "",
      dueDate: t.dueDate || "",
      requestedBy: t.requestedBy || "",
      submittedBy: t.submittedBy || "",
    }));

    return Response.json({ tasks: outTasks });
  } catch (error) {
    console.error("[v0] Tasks API error:", error);
    return Response.json({ error: "Failed to fetch tasks", details: error?.message || String(error) }, { status: 500 });
  }
}
