const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

let sheetsClient = null;

function getAuth() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Missing GOOGLE_CLIENT_EMAIL or GOOGLE_PRIVATE_KEY environment variables.'
    );
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: SCOPES,
  });
}

function getSheetsClient() {
  if (!sheetsClient) {
    sheetsClient = google.sheets({ version: 'v4', auth: getAuth() });
  }
  return sheetsClient;
}

const SHEET_ID = () => process.env.GOOGLE_SHEET_ID;
const TASKS_TAB = () => process.env.GOOGLE_SHEET_TAB_NAME || 'Api list';
const USERS_TAB = () => process.env.GOOGLE_USERS_TAB_NAME || 'Users';
const ACTIVITY_TAB = () => process.env.GOOGLE_ACTIVITY_TAB_NAME || 'ActivityLog';
const EMAIL_AUDIT_TAB = () => process.env.GOOGLE_EMAIL_AUDIT_TAB_NAME || 'EmailAuditLog';

module.exports = {
  getSheetsClient,
  SHEET_ID,
  TASKS_TAB,
  USERS_TAB,
  ACTIVITY_TAB,
  EMAIL_AUDIT_TAB,
};
