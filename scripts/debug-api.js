const https = require("https")
const http = require("http")

async function testApiEndpoint(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https:") ? https : http

    const req = protocol.get(url, (res) => {
      let data = ""

      res.on("data", (chunk) => {
        data += chunk
      })

      res.on("end", () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: jsonData,
          })
        } catch (error) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            parseError: error.message,
          })
        }
      })
    })

    req.on("error", (error) => {
      reject(error)
    })

    req.setTimeout(10000, () => {
      req.destroy()
      reject(new Error("Request timeout"))
    })
  })
}

async function debugApi() {
  console.log("🔍 Starting API debugging...")
  console.log("🔍 Environment variables check:")
  console.log("   GOOGLE_SPREADSHEET_ID:", !!process.env.GOOGLE_SPREADSHEET_ID)
  console.log("   GOOGLE_SERVICE_ACCOUNT_KEY:", !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY)

  const baseUrl = process.env.BASE_URL || "http://localhost:3000"
  const endpoints = [`${baseUrl}/api/tasks`, `${baseUrl}/api/roles`]

  for (const endpoint of endpoints) {
    console.log(`\n🔍 Testing: ${endpoint}`)

    try {
      const result = await testApiEndpoint(endpoint)
      console.log(`✅ Status: ${result.status}`)

      if (result.status === 200) {
        console.log(`✅ Success:`, result.data)
      } else {
        console.log(`❌ Error Response:`, result.data)
      }
    } catch (error) {
      console.log(`❌ Request failed:`, error.message)
    }
  }
}

// Run if called directly
if (require.main === module) {
  debugApi().catch(console.error)
}

module.exports = { debugApi, testApiEndpoint }
