const { getGoogleSpreadsheetClient } = require("../../utils/googleAuth")

export default async function handler(req, res) {
  // Log incoming request for debugging
  console.log(`📝 API Request: ${req.method} /api/tasks`)
  console.log("📝 Headers:", JSON.stringify(req.headers, null, 2))
  console.log("📝 Query:", JSON.stringify(req.query, null, 2))

  // Set CORS headers for local development
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization")

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end()
    return
  }

  try {
    // Validate environment variables
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    if (!spreadsheetId) {
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable is not set")
    }

    // Get Google Spreadsheet client
    console.log("🔐 Initializing Google Spreadsheet client...")
    const doc = await getGoogleSpreadsheetClient(spreadsheetId)

    // Handle different HTTP methods
    switch (req.method) {
      case "GET":
        return await handleGetTasks(req, res, doc)
      case "POST":
        return await handleCreateTask(req, res, doc)
      case "PUT":
        return await handleUpdateTask(req, res, doc)
      case "DELETE":
        return await handleDeleteTask(req, res, doc)
      default:
        res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"])
        return res.status(405).json({
          error: "Method not allowed",
          allowedMethods: ["GET", "POST", "PUT", "DELETE"],
        })
    }
  } catch (error) {
    console.error("❌ API Error:", error.message)
    console.error("❌ Stack trace:", error.stack)

    // Return helpful error response (without exposing secrets)
    const errorResponse = {
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
      // Add helpful debugging info
      debug: {
        hasSpreadsheetId: !!process.env.GOOGLE_SPREADSHEET_ID,
        hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
      },
    }

    // Different status codes for different error types
    if (error.message.includes("not set")) {
      return res.status(500).json({ ...errorResponse, type: "configuration_error" })
    } else if (error.message.includes("invalid_grant")) {
      return res.status(401).json({ ...errorResponse, type: "authentication_error" })
    } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
      return res.status(403).json({ ...errorResponse, type: "permission_error" })
    } else {
      return res.status(500).json({ ...errorResponse, type: "unknown_error" })
    }
  }
}

async function handleGetTasks(req, res, doc) {
  console.log("📖 Reading tasks from Google Spreadsheet...")

  // Get or create the Tasks sheet
  let sheet = doc.sheetsByTitle["Tasks"]
  if (!sheet) {
    console.log("📝 Creating Tasks sheet...")
    sheet = await doc.addSheet({
      title: "Tasks",
      headerValues: ["Title", "Description", "Status", "Created At"],
    })
  }

  // Load all rows
  const rows = await sheet.getRows()
  console.log(`📖 Found ${rows.length} task rows`)

  // Convert rows to objects
  const tasks = rows.map((row, index) => ({
    id: index + 1,
    title: row.get("Title") || "",
    description: row.get("Description") || "",
    status: row.get("Status") || "pending",
    createdAt: row.get("Created At") || "",
  }))

  return res.status(200).json({
    success: true,
    data: tasks,
    count: tasks.length,
    timestamp: new Date().toISOString(),
  })
}

async function handleCreateTask(req, res, doc) {
  console.log("➕ Creating new task...")

  const { title, description, status = "pending" } = req.body

  if (!title) {
    return res.status(400).json({
      error: "Bad request",
      message: "Title is required",
    })
  }

  let sheet = doc.sheetsByTitle["Tasks"]
  if (!sheet) {
    console.log("📝 Creating Tasks sheet...")
    sheet = await doc.addSheet({
      title: "Tasks",
      headerValues: ["Title", "Description", "Status", "Created At"],
    })
  }

  const createdAt = new Date().toISOString()

  // Add new row
  await sheet.addRow({
    Title: title,
    Description: description,
    Status: status,
    "Created At": createdAt,
  })

  console.log("✅ Task created successfully")

  return res.status(201).json({
    success: true,
    message: "Task created successfully",
    data: {
      title,
      description,
      status,
      createdAt,
    },
  })
}

async function handleUpdateTask(req, res, doc) {
  // Implementation for updating tasks
  return res.status(501).json({
    error: "Not implemented",
    message: "Update functionality not yet implemented",
  })
}

async function handleDeleteTask(req, res, doc) {
  // Implementation for deleting tasks
  return res.status(501).json({
    error: "Not implemented",
    message: "Delete functionality not yet implemented",
  })
}
