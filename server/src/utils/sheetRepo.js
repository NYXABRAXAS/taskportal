const {
  getSheetsClient,
  SHEET_ID,
  TASKS_TAB,
  USERS_TAB,
  ACTIVITY_TAB,
} = require('../config/googleSheets');
const { TASK_COLUMNS, RANGE_LAST_COLUMN, USER_COLUMNS, ACTIVITY_COLUMNS } = require('../config/schema');

function colLetter(index) {
  // 0 -> A, 1 -> B ...
  let n = index + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function rowArrayToTask(rowArr, rowNumber) {
  const obj = { rowNumber };
  TASK_COLUMNS.forEach((col, idx) => {
    obj[col.key] = rowArr[idx] !== undefined ? rowArr[idx] : '';
  });
  return obj;
}

function taskToRowArray(task) {
  return TASK_COLUMNS.map((col) => task[col.key] ?? '');
}

async function readTasks() {
  const sheets = getSheetsClient();
  const range = `'${TASKS_TAB()}'!A2:${RANGE_LAST_COLUMN}`;
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range,
  });
  const rows = res.data.values || [];
  return rows
    .map((r, i) => rowArrayToTask(r, i + 2))
    .filter((t) => (t.apiName || '').toString().trim() !== '');
}

// RAW (not USER_ENTERED) is deliberate: USER_ENTERED lets Sheets "helpfully"
// parse date-looking strings into real date serials and re-render them using
// the spreadsheet's locale (which may be day-first), silently transposing
// day/month on the next read since our parsers assume month-first input.
// RAW stores exactly the string we send, so date values stay stable.
async function writeTaskRow(rowNumber, task) {
  const sheets = getSheetsClient();
  const values = [taskToRowArray(task)];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `'${TASKS_TAB()}'!A${rowNumber}:${RANGE_LAST_COLUMN}${rowNumber}`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

async function appendTaskRow(task) {
  const sheets = getSheetsClient();
  const values = [taskToRowArray(task)];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `'${TASKS_TAB()}'!A:${RANGE_LAST_COLUMN}`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

async function getSheetIdByTitle(title) {
  const sheets = getSheetsClient();
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID() });
  const sheet = meta.data.sheets.find((s) => s.properties.title === title);
  if (!sheet) throw new Error(`Sheet tab "${title}" not found`);
  return sheet.properties.sheetId;
}

async function deleteTaskRow(rowNumber) {
  const sheets = getSheetsClient();
  const sheetId = await getSheetIdByTitle(TASKS_TAB());
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId,
              dimension: 'ROWS',
              startIndex: rowNumber - 1,
              endIndex: rowNumber,
            },
          },
        },
      ],
    },
  });
}

async function replaceAllTasks(tasks) {
  const sheets = getSheetsClient();
  const header = TASK_COLUMNS.map((c) => c.header);
  const values = [header, ...tasks.map(taskToRowArray)];
  // Clear existing data first (keep header row intact by overwriting range fully)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID(),
    range: `'${TASKS_TAB()}'!A1:${RANGE_LAST_COLUMN}`,
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `'${TASKS_TAB()}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values },
  });
}

// ---------- Users ----------

async function readUsers() {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `'${USERS_TAB()}'!A2:F`,
  });
  const rows = res.data.values || [];
  return rows
    .map((r, i) => {
      const obj = { rowNumber: i + 2 };
      USER_COLUMNS.forEach((key, idx) => (obj[key] = r[idx] !== undefined ? r[idx] : ''));
      return obj;
    })
    .filter((u) => (u.username || '').toString().trim() !== '');
}

async function appendUser(user) {
  const sheets = getSheetsClient();
  const values = [USER_COLUMNS.map((k) => user[k] ?? '')];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `'${USERS_TAB()}'!A:F`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

async function writeUserRow(rowNumber, user) {
  const sheets = getSheetsClient();
  const values = [USER_COLUMNS.map((k) => user[k] ?? '')];
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID(),
    range: `'${USERS_TAB()}'!A${rowNumber}:F${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values },
  });
}

async function deleteUserRow(rowNumber) {
  const sheets = getSheetsClient();
  const sheetId = await getSheetIdByTitle(USERS_TAB());
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID(),
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: rowNumber - 1, endIndex: rowNumber },
          },
        },
      ],
    },
  });
}

// ---------- Activity Log ----------

async function appendActivity(entry) {
  const sheets = getSheetsClient();
  const values = [ACTIVITY_COLUMNS.map((k) => entry[k] ?? '')];
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID(),
    range: `'${ACTIVITY_TAB()}'!A:G`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values },
  });
}

async function readActivity(limit = 200) {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID(),
    range: `'${ACTIVITY_TAB()}'!A2:G`,
  });
  const rows = res.data.values || [];
  const items = rows
    .map((r) => {
      const obj = {};
      ACTIVITY_COLUMNS.forEach((key, idx) => (obj[key] = r[idx] !== undefined ? r[idx] : ''));
      return obj;
    })
    .filter((a) => a.timestamp);
  return items.slice(-limit).reverse();
}

module.exports = {
  colLetter,
  readTasks,
  writeTaskRow,
  appendTaskRow,
  deleteTaskRow,
  replaceAllTasks,
  readUsers,
  appendUser,
  writeUserRow,
  deleteUserRow,
  appendActivity,
  readActivity,
  getSheetIdByTitle,
};
