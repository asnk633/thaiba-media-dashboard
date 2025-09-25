import { google } from 'googleapis';

export function getGoogleAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return auth;
}

export async function getGoogleSheetsClient() {
  const auth = getGoogleAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}
