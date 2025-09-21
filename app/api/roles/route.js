export async function GET(request) {
  try {
    console.log("[v0] Roles API called")

    // Get user email from query parameters
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("email")

    if (!userEmail) {
      console.log("[v0] No email provided")
      return Response.json({ error: "Email parameter required" }, { status: 400 })
    }

    console.log("[v0] Fetching role for email:", userEmail)

    // Get Google Sheets client
    const { getGoogleSheetsClient } = await import("../../../utils/googleAuth.js")
    const sheets = await getGoogleSheetsClient()

    // Read from the spreadsheet
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID
    const range = "Team!A:C" // Adjust range as needed

    console.log("[v0] Reading from spreadsheet:", spreadsheetId)

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    })

    const rows = response.data.values || []
    console.log("[v0] Retrieved rows:", rows.length)

    // Find user role (assuming columns: Name, Email, Role)
    const userRow = rows.find((row) => row[1] && row[1].toLowerCase() === userEmail.toLowerCase())

    if (!userRow) {
      console.log("[v0] User not found in team sheet")
      return Response.json({
        role: "guest",
        message: "User not found in team sheet",
      })
    }

    const role = userRow[2] || "member"
    console.log("[v0] Found role for user:", role)

    return Response.json({
      role: role.toLowerCase(),
      name: userRow[0] || "",
      email: userRow[1] || "",
    })
  } catch (error) {
    console.error("[v0] Roles API error:", error)
    return Response.json(
      {
        error: "Failed to fetch user role",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
