// Test your live Vercel API and show detailed errors
const BASE_URL = 'https://thaiba-media-dashboard-nnn2vz05j-abdul-shukoors-projects.vercel.app';

async function testLiveAPI() {
  console.info('🔍 Testing live API...');

  try {
    const response = await fetch(`${BASE_URL}/api/tasks`);
    const data = await response.text(); // Get raw response first

    console.info('📊 Response Status:', response.status);
    console.info('📋 Response Headers:', Object.fromEntries(response.headers));
    console.info('📄 Raw Response:', data);

    if (!response.ok) {
      console.info('❌ API Error Details:');
      try {
        const errorData = JSON.parse(data);
        console.info('Error Object:', errorData);
      } catch {
        console.info('Raw Error Text:', data);
      }
    }
  } catch (error) {
    console.info('🚨 Network Error:', error.message);
  }
}

testLiveAPI();
