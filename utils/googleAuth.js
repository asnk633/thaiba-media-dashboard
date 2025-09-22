import { GoogleSpreadsheet } from "google-spreadsheet";
import { JWT } from "google-auth-library";

// Helper function to safely parse JSON from environment variable (supports raw or base64)
function parseServiceAccountKey() {
  try {
    // Allow either raw JSON string or base64-encoded JSON to be used
    let serviceAccountKeyRaw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_B64;

    if (!serviceAccountKeyRaw && b64) {
      // decode base64
      serviceAccountKeyRaw = Buffer.from(b64, "base64").toString("utf8");
      console.log("🔐 Decoded GOOGLE_SERVICE_ACCOUNT_KEY_B64 into JSON");
    }

    if (!serviceAccountKeyRaw) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set");
    }

    console.log("🔐 Parsing service account key...");
    // Parse the JSON
    const keyData = JSON.parse(serviceAccountKeyRaw);

    const requiredFields = ["type", "project_id", "private_key", "client_email"];
    for (const field of requiredFields) {
      if (!keyData[field]) {
        throw new Error(`Service account key is missing required field: ${field}`);
      }
    }

    // Fix newlines in private key if they were escaped
    if (keyData.private_key) {
      keyData.private_key = keyData.private_key.replace(/\\n/g, "\n");
      console.log("🔐 Private key format corrected");
    }

    console.log("🔐 Service account email:", keyData.client_email);
    console.log("🔐 Project ID:", keyData.project_id);

    return keyData;
  } catch (error) {
    console.error("❌ Error parsing service account key:");
    console.error("   Message:", error.message);
    if (error.message.includes("Unexpected token")) {
      throw new Error(`Service account key is not valid JSON. Check for escaped quotes or formatting issues.`);
    } else if (error.message.includes("not set")) {
      throw new Error(`GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set in your environment.`);
    } else {
      throw new Error(`Failed to parse service account key: ${error.message}`);
    }
  }
}

// Create and configure Google Spreadsheet client
export async function getGoogleSpreadsheetClient(spreadsheetId) {
  try {
    console.log("🔐 Initializing Google Spreadsheet client...");
    const serviceAccountKey = parseServiceAccountKey();

    const serviceAccountAuth = new JWT({
      email: serviceAccountKey.client_email,
      key: serviceAccountKey.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    console.log("🔐 JWT authentication configured");
    console.log("🔐 Connecting to spreadsheet:", spreadsheetId);

    // Create Google Spreadsheet instance (google-spreadsheet accepts auth client differently in v3, but passing JWT works)
    const doc = new GoogleSpreadsheet(spreadsheetId);
    await doc.useServiceAccountAuth({
      client_email: serviceAccountKey.client_email,
      private_key: serviceAccountKey.private_key,
    });

    console.log("📊 Loading spreadsheet info...");
    await doc.loadInfo();

    console.log("✅ Google Spreadsheet client authorized successfully");
    console.log(`📊 Connected to: "${doc.title}"`);
    console.log(`📊 Sheet count: ${doc.sheetCount}`);

    return doc;
  } catch (error) {
    console.error("❌ Google Spreadsheet authorization failed:");
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack || "");
    if (error.message.includes("invalid_grant")) {
      throw new Error("Google authentication failed: invalid_grant. Check system time and service account key format.");
    } else if (error.message.includes("403") || error.message.includes("Forbidden")) {
      throw new Error(`Spreadsheet access denied. Share spreadsheet with the service account email.`);
    } else if (error.message.includes("404") || error.message.includes("Not Found")) {
      throw new Error("Spreadsheet not found. Check the GOOGLE_SHEETS_ID.");
    } else {
      throw error;
    }
  }
}

export async function testGoogleSheetsConnection(spreadsheetId) {
  try {
    const doc = await getGoogleSpreadsheetClient(spreadsheetId);
    console.log("✅ Successfully connected to spreadsheet:", doc.title);
    doc.sheetsByIndex.forEach((sheet, index) => {
      console.log(`   ${index + 1}. ${sheet.title} (${sheet.rowCount} rows)`);
    });
    return true;
  } catch (error) {
    console.error("❌ Connection test failed:", error.message);
    return false;
  }
}
