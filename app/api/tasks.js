import { getGoogleSpreadsheetClient } from "../../utils/googleAuth.js"

export default async function handler(req, res) {
  console.log(`📝 [${new Date().toISOString()}] API Request: ${req.method} /api/tasks`)
  console.log("📝 Environment check:", {
    hasSpreadsheetId: !!process.env.GOOGLE_SPREADSHEET_ID,
    hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    spreadsheetIdLength: process.env.GOOGLE_SPREADSHEET_ID?.length || 0,
    serviceAccountKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
  })

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
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!spreadsheetId) {
      console.error("❌ Missing GOOGLE_SPREADSHEET_ID environment variable")
      throw new Error("GOOGLE_SPREADSHEET_ID environment variable is not set")
    }

    if (!serviceAccountKey) {
      console.error("❌ Missing GOOGLE_SERVICE_ACCOUNT_KEY environment variable")
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set")
    }

    console.log(`🔐 Connecting to spreadsheet: ${spreadsheetId.substring(0, 10)}...`)

    // Get Google Spreadsheet client
    const doc = await getGoogleSpreadsheetClient(spreadsheetId)
    console.log("✅ Google Spreadsheet client initialized successfully")

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
    console.error("❌ API Error Details:")
    console.error("   Message:", error.message)
    console.error("   Stack:", error.stack)

    const errorResponse = {
      error: "Internal server error",
      message: error.message,
      timestamp: new Date().toISOString(),
      debug: {
        hasSpreadsheetId: !!process.env.GOOGLE_SPREADSHEET_ID,
        hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        spreadsheetIdPreview: process.env.GOOGLE_SPREADSHEET_ID
          ? `${process.env.GOOGLE_SPREADSHEET_ID.substring(0, 10)}...`
          : null,
        nodeEnv: process.env.NODE_ENV,
        vercelEnv: process.env.VERCEL_ENV,
        errorType: error.constructor.name,
        isAuthError: error.message.includes("invalid_grant") || error.message.includes("401"),
        isPermissionError: error.message.includes("403") || error.message.includes("Forbidden"),
        isConfigError: error.message.includes("not set") || error.message.includes("environment"),
        isNetworkError: error.message.includes("fetch") || error.message.includes("network"),
      },
    }

    if (error.message.includes("not set") || error.message.includes("environment")) {
      console.error("💡 Configuration Error: Check your environment variables in Vercel dashboard")
      return res.status(500).json({ ...errorResponse, type: "configuration_error" })
    } else if (error.message.includes("invalid_grant")) {
      console.error("💡 Authentication Error: Check service account key format and system time")
      return res.status(401).json({ ...errorResponse, type: "authentication_error" })
    } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
      console.error("💡 Permission Error: Share spreadsheet with service account email")
      return res.status(403).json({ ...errorResponse, type: "permission_error" })
    } else if (error.message.includes("fetch") || error.message.includes("network")) {
      console.error("💡 Network Error: Check internet connection and Google API status")
      return res.status(503).json({ ...errorResponse, type: "network_error" })
    } else {
      console.error("💡 Unknown Error: Check logs for more details")
      return res.status(500).json({ ...errorResponse, type: "unknown_error" })
    }
  }
}

async function handleGetTasks(req, res, doc) {
  console.log("📖 Reading tasks from Google Spreadsheet...")

  try {
    let sheet = doc.sheetsByTitle["Tasks"]
    if (!sheet) {
      console.log("📝 Tasks sheet not found, creating new sheet...")
      sheet = await doc.addSheet({
        title: "Tasks",
        headerValues: ["Title", "Description", "Status", "Created At"],
      })
      console.log("✅ Tasks sheet created successfully")
    }

    // Load all rows
    console.log("📖 Loading rows from Tasks sheet...")
    const rows = await sheet.getRows()
    console.log(`📖 Found ${rows.length} task rows`)

    const tasks = rows.map((row, index) => {
      try {
        return {
          id: index + 1,
          title: row.get("Title") || "",
          description: row.get("Description") || "",
          status: row.get("Status") || "pending",
          createdAt: row.get("Created At") || "",
        }
      } catch (rowError) {
        console.error(`❌ Error processing row ${index + 1}:`, rowError.message)
        return {
          id: index + 1,
          title: "Error loading task",
          description: "Failed to load task data",
          status: "error",
          createdAt: "",
        }
      }
    })

    console.log("✅ Tasks loaded successfully")
    return res.status(200).json({
      success: true,
      data: tasks,
      count: tasks.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("❌ Error in handleGetTasks:", error.message)
    throw error // Re-throw to be handled by main error handler
  }
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
