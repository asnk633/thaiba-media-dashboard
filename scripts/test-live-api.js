// Test your live Vercel API and show detailed errors
const BASE_URL = 'https://thaiba-media-dashboard-nnn2vz05j-abdul-shukoors-projects.vercel.app';

async function testLiveAPI() {
  console.log('🔍 Testing live API...');

  try {
    const response = await fetch(`${BASE_URL}/api/tasks`);
    const data = await response.text(); // Get raw response first

    console.log('📊 Response Status:', response.status);
    console.log('📋 Response Headers:', Object.fromEntries(response.headers));
    console.log('📄 Raw Response:', data);

    if (!response.ok) {
      console.log('❌ API Error Details:');
      try {
        const errorData = JSON.parse(data);
        console.log('Error Object:', errorData);
      } catch {
        console.log('Raw Error Text:', data);
      }
    }
  } catch (error) {
    console.log('🚨 Network Error:', error.message);
  }
}

testLiveAPI();
