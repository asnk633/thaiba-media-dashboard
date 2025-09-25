import { testGoogleSheetsConnection } from '../utils/googleAuth.js';

async function testConnection() {
  console.log('🧪 Testing Google Sheets connection...');
  console.log('⏰ Timestamp:', new Date().toISOString());

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SPREADSHEET_ID not found in environment variables');
    process.exit(1);
  }

  console.log('📊 Environment check:');
  console.log('  - GOOGLE_SPREADSHEET_ID:', spreadsheetId ? '✅ Set' : '❌ Missing');
  console.log(
    '  - GOOGLE_SERVICE_ACCOUNT_KEY:',
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing',
  );

  try {
    const success = await testGoogleSheetsConnection(spreadsheetId);

    if (success) {
      console.log('\n🎉 Connection test successful!');
      console.log('💡 Your Google Sheets integration is working correctly.');
    } else {
      console.log('\n❌ Connection test failed!');
      console.log('💡 Check the error messages above for troubleshooting steps.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Connection test crashed:', error.message);
    process.exit(1);
  }
}

testConnection();
