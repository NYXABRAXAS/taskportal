// One-time setup: creates the "Users" and "ActivityLog" tabs on the target
// spreadsheet (if missing), writes their headers, and seeds a default admin
// account. Safe to re-run - it will not duplicate tabs or headers.
//
// Usage:  npm run setup   (from the server/ directory)

require('dotenv').config();
const { getSheetsClient, SHEET_ID, USERS_TAB, ACTIVITY_TAB } = require('../src/config/googleSheets');
const { USER_COLUMNS, ACTIVITY_COLUMNS } = require('../src/config/schema');

async function ensureTab(sheets, title) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() });
  const exists = meta.data.sheets.some((s) => s.properties.title === title);
  if (exists) {
    console.log(`Tab "${title}" already exists.`);
    return;
  }
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: { requests: [{ addSheet: { properties: { title } } }] },
  });
  console.log(`Created tab "${title}".`);
}

async function ensureHeader(sheets, title, headers) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `'${title}'!A1:Z1`,
  });
  const current = (res.data.values && res.data.values[0]) || [];
  if (current.length > 0) {
    console.log(`Tab "${title}" already has a header row.`);
    return;
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `'${title}'!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [headers] },
  });
  console.log(`Wrote header row for "${title}".`);
}

async function ensureAdminSeed(sheets) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `'${USERS_TAB()}'!A2:F`,
  });
  const rows = res.data.values || [];
  if (rows.length > 0) {
    console.log('Users tab already has data - skipping admin seed.');
    return;
  }
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `'${USERS_TAB()}'!A:F`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [['admin', 'admin123', 'Admin', 'Administrator', '', 'Active']],
    },
  });
  console.log('Seeded default admin user -> username: admin / password: admin123 (change this immediately).');
}

async function main() {
  const sheets = getSheetsClient();

  await ensureTab(sheets, USERS_TAB());
  await ensureTab(sheets, ACTIVITY_TAB());

  await ensureHeader(sheets, USERS_TAB(), ['Username', 'Password', 'Role', 'Full Name', 'Email', 'Status']);
  await ensureHeader(sheets, ACTIVITY_TAB(), ['Timestamp', 'User', 'API Name', 'Field', 'Old Value', 'New Value', 'Remarks']);

  await ensureAdminSeed(sheets);

  console.log('\nSetup complete.');
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
