import { GoogleSpreadsheet } from "google-spreadsheet"
import { JWT } from "google-auth-library"

// Helper function to safely parse JSON from environment variable
function parseServiceAccountKey() {
  try {
    const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY

    if (!serviceAccountKey) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set")
    }

    console.log("🔐 Parsing service account key...")
    console.log("🔐 Key length:", serviceAccountKey.length)
    console.log("🔐 Key starts with:", serviceAccountKey.substring(0, 20) + "...")

    // Parse the JSON
    const keyData = JSON.parse(serviceAccountKey)

    const requiredFields = ["type", "project_id", "private_key", "client_email"]
    for (const field of requiredFields) {
      if (!keyData[field]) {
        throw new Error(`Service account key is missing required field: ${field}`)
      }
    }

    // Fix newlines in private key if they were escaped
    if (keyData.private_key) {
      keyData.private_key = keyData.private_key.replace(/\\n/g, "\n")
      console.log("🔐 Private key format corrected")
    }

    console.log("🔐 Service account email:", keyData.client_email)
    console.log("🔐 Project ID:", keyData.project_id)

    return keyData
  } catch (error) {
    console.error("❌ Error parsing service account key:")
    console.error("   Message:", error.message)

    if (error.message.includes("Unexpected token")) {
      throw new Error(`Service account key is not valid JSON. Check for escaped quotes or formatting issues.`)
    } else if (error.message.includes("not set")) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set in your Vercel project settings.`)
    } else {
      throw new Error(`Failed to parse service account key: ${error.message}`)
    }
  }
}

// Create and configure Google Spreadsheet client
async function getGoogleSpreadsheetClient(spreadsheetId) {
  try {
    console.log("🔐 Initializing Google Spreadsheet client...")
    const serviceAccountKey = parseServiceAccountKey()

    const serviceAccountAuth = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    })

    console.log("🔐 JWT authentication configured")
    console.log("🔐 Connecting to spreadsheet:", spreadsheetId)

    // Create Google Spreadsheet instance
    const doc = new GoogleSpreadsheet(spreadsheetId, serviceAccountAuth)

    console.log("📊 Loading spreadsheet info...")
    await doc.loadInfo()

    console.log("✅ Google Spreadsheet client authorized successfully")
    console.log(`📊 Connected to: "${doc.title}"`)
    console.log(`📊 Sheet count: ${doc.sheetCount}`)

    return doc
  } catch (error) {
    console.error("❌ Google Spreadsheet authorization failed:")
    console.error("   Message:", error.message)
    console.error("   Stack:", error.stack)

    if (error.message.includes("invalid_grant")) {
      console.error("💡 invalid_grant error solutions:")
      console.error("   1. Check system clock is synchronized (JWT tokens are time-sensitive)")
      console.error("   2. Verify private key format (newlines should be actual \\n characters)")
      console.error("   3. Ensure service account hasn't been deleted or disabled")
      console.error("   4. Check if service account key has been rotated")
      throw new Error("Google authentication failed: invalid_grant. Check system time and service account key format.")
    } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
      console.error("💡 403 Forbidden error solutions:")
      console.error("   1. Share the spreadsheet with service account email:", parseServiceAccountKey().client_email)
      console.error("   2. Grant 'Editor' permissions to the service account")
      console.error("   3. Verify the spreadsheet ID is correct")
      throw new Error(`Spreadsheet access denied. Share spreadsheet with: ${parseServiceAccountKey().client_email}`)
    } else if (error.message.includes("404") || error.message.includes("Not Found")) {
      console.error("💡 404 Not Found error solutions:")
      console.error("   1. Verify the spreadsheet ID is correct")
      console.error("   2. Check if the spreadsheet exists and is accessible")
      throw new Error("Spreadsheet not found. Check the GOOGLE_SPREADSHEET_ID.")
    } else {
      throw error
    }
  }
}

// Test function to verify connection
async function testGoogleSheetsConnection(spreadsheetId) {
  try {
    const doc = await getGoogleSpreadsheetClient(spreadsheetId)

    console.log("✅ Successfully connected to spreadsheet:", doc.title)
    console.log(`📊 Sheet count: ${doc.sheetCount}`)

    // List available sheets
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.title} (${sheet.rowCount} rows, ${sheet.columnCount} cols)`)
    })

    return true
  } catch (error) {
    console.error("❌ Connection test failed:", error.message)

    if (error.message.includes("403") || error.message.includes("Forbidden")) {
      console.error("💡 403 Forbidden usually means:")
      console.error("   - Spreadsheet is not shared with service account")
      console.error("   - Service account email:", parseServiceAccountKey().client_email)
    }

    return false
  }
}

export { getGoogleSpreadsheetClient, testGoogleSheetsConnection }
