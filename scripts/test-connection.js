import { testGoogleSheetsConnection } from '../utils/googleAuth.js';

async function testConnection() {
  console.info('🧪 Testing Google Sheets connection...');
  console.info('⏰ Timestamp:', new Date().toISOString());

  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (!spreadsheetId) {
    console.error('❌ GOOGLE_SPREADSHEET_ID not found in environment variables');
    process.exit(1);
  }

  console.info('📊 Environment check:');
  console.info('  - GOOGLE_SPREADSHEET_ID:', spreadsheetId ? '✅ Set' : '❌ Missing');
  console.info(
    '  - GOOGLE_SERVICE_ACCOUNT_KEY:',
    process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing',
  );

  try {
    const success = await testGoogleSheetsConnection(spreadsheetId);

    if (success) {
      console.info('\n🎉 Connection test successful!');
      console.info('💡 Your Google Sheets integration is working correctly.');
    } else {
      console.info('\n❌ Connection test failed!');
      console.info('💡 Check the error messages above for troubleshooting steps.');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n💥 Connection test crashed:', error.message);
    process.exit(1);
  }
}

testConnection();
