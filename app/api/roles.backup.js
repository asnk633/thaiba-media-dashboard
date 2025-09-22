import { getGoogleSpreadsheetClient } from "../../utils/googleAuth.js"

export default async function handler(req, res) {
  console.log(`📝 API Request: ${req.method} /api/roles`)

  // Set CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  try {
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable is not set")
    }

    console.log("🔐 Initializing Google Spreadsheet client...")
    const doc = await getGoogleSpreadsheetClient(spreadsheetId)

    if (req.method === "GET") {
      console.log("📖 Reading roles from Google Spreadsheet...")

      let sheet = doc.sheetsByTitle["Roles"]
      if (!sheet) {
        console.log("📝 Creating Roles sheet...")
        sheet = await doc.addSheet({
          title: "Roles",
          headerValues: ["Name", "Description", "Permissions"],
        })
      }

      const rows = await sheet.getRows()
      console.log(`📖 Found ${rows.length} role rows`)

      const roles = rows.map((row, index) => ({
        id: index + 1,
        name: row.get("Name") || "",
        description: row.get("Description") || "",
        permissions: row.get("Permissions") || "",
      }))

      return res.status(200).json({
        success: true,
        data: roles,
        count: roles.length,
        timestamp: new Date().toISOString(),
      })
    }

    res.setHeader("Allow", ["GET"])
    return res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    console.error("❌ API Error:", error.message)

    return res.status(500).json({
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
    })
  }
}
