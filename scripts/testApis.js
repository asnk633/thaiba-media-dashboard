const BASE_URL = process.env.BASE_URL || "http://localhost:3000"

async function testAPI(endpoint, method = "GET", body = null) {
  console.log(`\n🧪 Testing ${method} ${endpoint}`)
  console.log(`📍 Full URL: ${BASE_URL}${endpoint}`)

  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
      },
    }

    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options)

    console.log(`📊 Status: ${response.status} ${response.statusText}`)
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()))

    const data = await response.text()

    try {
      const jsonData = JSON.parse(data)
      console.log(`📊 Response:`, JSON.stringify(jsonData, null, 2))

      if (response.ok) {
        console.log(`✅ ${endpoint} - SUCCESS`)
      } else {
        console.log(`❌ ${endpoint} - FAILED`)
      }

      return { success: response.ok, data: jsonData }
    } catch (parseError) {
      console.log(`📊 Raw Response:`, data)
      console.log(`❌ ${endpoint} - FAILED (Invalid JSON)`)
      return { success: false, data: data }
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - NETWORK ERROR:`, error.message)

    if (error.code === "ECONNREFUSED") {
      console.log(`💡 Connection refused - is your server running on ${BASE_URL}?`)
    }

    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log(`🚀 Starting API tests against ${BASE_URL}`)
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`)

  const tests = [
    { endpoint: "/api/roles", method: "GET" },
    { endpoint: "/api/tasks", method: "GET" },
    {
      endpoint: "/api/tasks",
      method: "POST",
      body: {
        title: "Test Task",
        description: "This is a test task created by the API test script",
        status: "pending",
      },
    },
  ]

  const results = []

  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.method, test.body)
    results.push({ ...test, ...result })

    // Wait a bit between requests
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  console.log("\n📋 TEST SUMMARY:")
  console.log("================")

  results.forEach((result) => {
    const status = result.success ? "✅ PASS" : "❌ FAIL"
    console.log(`${status} ${result.method} ${result.endpoint}`)
  })

  const passCount = results.filter((r) => r.success).length
  const totalCount = results.length

  console.log(`\n🎯 Results: ${passCount}/${totalCount} tests passed`)

  if (passCount === totalCount) {
    console.log("🎉 All tests passed! Your API is working correctly.")
  } else {
    console.log("⚠️  Some tests failed. Check the logs above for details.")
  }
}

export { testAPI, runTests }

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().catch(console.error)
}
