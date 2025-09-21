export async function GET(request) {
  try {
    console.log("[v0] Tasks API called")

    // Get user email from query parameters
    const { searchParams } = new URL(request.url)
    const userEmail = searchParams.get("email")

    if (!userEmail) {
      console.log("[v0] No email provided")
      return Response.json({ error: "Email parameter required" }, { status: 400 })
    }

    console.log("[v0] Fetching tasks for email:", userEmail)

    const { getGoogleSpreadsheetClient } = await import("../../../utils/googleAuth.js")
    const spreadsheetId = process.env.GOOGLE_SHEETS_ID

    if (!spreadsheetId) {
      console.log("[v0] No spreadsheet ID provided")
      return Response.json({ error: "GOOGLE_SHEETS_ID environment variable not set" }, { status: 500 })
    }

    console.log("[v0] Connecting to spreadsheet:", spreadsheetId)
    const doc = await getGoogleSpreadsheetClient(spreadsheetId)

    // Get the first sheet (Tasks sheet)
    const sheet = doc.sheetsByIndex[0]
    if (!sheet) {
      console.log("[v0] No sheets found in spreadsheet")
      return Response.json({ error: "No sheets found in spreadsheet" }, { status: 500 })
    }

    console.log("[v0] Reading from sheet:", sheet.title)

    // Load the sheet data
    await sheet.loadHeaderRow()
    const rows = await sheet.getRows()

    console.log("[v0] Retrieved rows:", rows.length)

    // Convert rows to task objects
    const tasks = rows.map((row, index) => ({
      id: row.get("Task ID") || index + 1,
      title: row.get("Task Description") || `Task ${index + 1}`,
      description: row.get("Notes") || "No description",
      assignee: row.get("Assigned To") || "",
      status: row.get("Status") || "",
      priority: row.get("Priority") || "",
      dueDate: row.get("Deadline") || "",
      requestedBy: row.get("Requested By") || "",
      submittedBy: row.get("Submitted By") || "",
    }))

    // Filter tasks for the specific user
    const userTasks = tasks.filter((task) => {
      const assignee = task.assignee.toLowerCase()
      const email = userEmail.toLowerCase()

      // Check if the assignee matches common names from your sheet
      return (
        (assignee.includes("sabith") && email.includes("asnk633")) ||
        (assignee.includes("anwar") && email.includes("anwar")) ||
        (assignee.includes("shukoor") && email.includes("shukoor")) ||
        assignee === email
      )
    })

    console.log("[v0] Filtered tasks for user:", userTasks.length)

    return Response.json({ tasks: userTasks })
  } catch (error) {
    console.error("[v0] Tasks API error:", error)
    return Response.json(
      {
        error: "Failed to fetch tasks",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
