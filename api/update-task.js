// api/update-task.js
import { google } from "googleapis";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { row, updates } = req.body;
    if (!row) {
      return res.status(400).json({ error: "Missing row number" });
    }

    // Auth with service account
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const spreadsheetId = process.env.SHEET_ID;
    const range = `Sheet1!C${row}:E${row}`; // C=AssignedTo, D=Priority, E=Status

    // Determine new values (fallback to existing if not provided)
    const assignedTo = updates.assignedTo || "";
    const priority = updates.priority || "";
    const status = updates.status || "";

    const values = [[assignedTo, priority, status]];

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    return res.json({ ok: true, row, updates });
  } catch (err) {
    console.error("Update error:", err);
    return res.status(500).json({ error: "Server error", details: err.message });
  }
}
