const fetch = require('node-fetch');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testAPI(endpoint, method = 'GET', body = null) {
  console.info(`\n🧪 Testing ${method} ${endpoint}`);
  console.info(`📍 Full URL: ${BASE_URL}${endpoint}`);

  try {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);

    console.info(`📊 Status: ${response.status} ${response.statusText}`);
    console.info(`📊 Headers:`, Object.fromEntries(response.headers.entries()));

    const data = await response.text();

    try {
      const jsonData = JSON.parse(data);
      console.info(`📊 Response:`, JSON.stringify(jsonData, null, 2));

      if (response.ok) {
        console.info(`✅ ${endpoint} - SUCCESS`);
      } else {
        console.info(`❌ ${endpoint} - FAILED`);
      }

      return { success: response.ok, data: jsonData };
    } catch (parseError) {
      console.info(`📊 Raw Response:`, data);
      console.info(`❌ ${endpoint} - FAILED (Invalid JSON)`);
      return { success: false, data: data };
    }
  } catch (error) {
    console.info(`❌ ${endpoint} - NETWORK ERROR:`, error.message);

    if (error.code === 'ECONNREFUSED') {
      console.info(`💡 Connection refused - is your server running on ${BASE_URL}?`);
    }

    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.info(`🚀 Starting API tests against ${BASE_URL}`);
  console.info(`⏰ Timestamp: ${new Date().toISOString()}`);

  const tests = [
    { endpoint: '/api/roles', method: 'GET' },
    { endpoint: '/api/tasks', method: 'GET' },
    {
      endpoint: '/api/tasks',
      method: 'POST',
      body: {
        title: 'Test Task',
        description: 'This is a test task created by the API test script',
        status: 'pending',
      },
    },
  ];

  const results = [];

  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.method, test.body);
    results.push({ ...test, ...result });

    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.info('\n📋 TEST SUMMARY:');
  console.info('================');

  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.info(`${status} ${result.method} ${result.endpoint}`);
  });

  const passCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.info(`\n🎯 Results: ${passCount}/${totalCount} tests passed`);

  if (passCount === totalCount) {
    console.info('🎉 All tests passed! Your API is working correctly.');
  } else {
    console.info('⚠️  Some tests failed. Check the logs above for details.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testAPI, runTests };
