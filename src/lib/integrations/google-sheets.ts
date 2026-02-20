import { google } from "googleapis";
import { Task } from "@/generated/prisma/client";

const SHEET_NAME = "Timesheet";
const HEADER_ROW = ["Date", "Task Name", "Description", "Project", "Hours Spent", "Status"];

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

async function ensureHeaderRow(sheets: ReturnType<typeof google.sheets>, spreadsheetId: string) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${SHEET_NAME}!A1:F1`,
  });

  const existingHeader = response.data.values?.[0];
  if (!existingHeader || existingHeader.length === 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: "RAW",
      requestBody: { values: [HEADER_ROW] },
    });
  }
}

export async function appendTaskToSheet(task: Task): Promise<void> {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  await ensureHeaderRow(sheets, spreadsheetId);

  const date = new Date(task.date).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const row = [
    date,
    task.taskName,
    task.description ?? "",
    task.project,
    task.hoursSpent.toString(),
    "Submitted",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });
}

export async function appendDailyTasksToSheet(tasks: Task[]): Promise<void> {
  if (tasks.length === 0) return;

  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID!;

  await ensureHeaderRow(sheets, spreadsheetId);

  const rows = tasks.map((task) => {
    const date = new Date(task.date).toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return [
      date,
      task.taskName,
      task.description ?? "",
      task.project,
      task.hoursSpent.toString(),
      "Submitted",
    ];
  });

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${SHEET_NAME}!A:F`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: rows },
  });
}
