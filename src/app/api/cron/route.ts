import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendDailyTasksToSheet } from "@/lib/integrations/google-sheets";
import { ServiceType, Status } from "@/generated/prisma";

// This endpoint is called by Vercel Cron at 6:00 PM IST (12:30 UTC) on weekdays
// Cron schedule: 30 12 * * 1-5

export async function GET(request: NextRequest) {
  // Verify the request is from Vercel Cron or an authorized source
  const authHeader = request.headers.get("authorization");
  if (
    process.env.NODE_ENV === "production" &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get today's date in IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30
    const istNow = new Date(now.getTime() + istOffset);

    // Skip weekends
    const dayOfWeek = istNow.getUTCDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json({ message: "Skipped: weekend" });
    }

    const todayIST = istNow.toISOString().split("T")[0];
    const startOfDay = new Date(`${todayIST}T00:00:00+05:30`);
    const endOfDay = new Date(`${todayIST}T23:59:59+05:30`);

    const tasks = await prisma.task.findMany({
      where: {
        date: { gte: startOfDay, lte: endOfDay },
      },
      include: { taskStatus: true },
    });

    if (tasks.length === 0) {
      return NextResponse.json({ message: "No tasks for today" });
    }

    const results: Record<string, string> = {};

    // Google Sheets
    try {
      await appendDailyTasksToSheet(tasks);
      await prisma.taskStatus.updateMany({
        where: {
          taskId: { in: tasks.map((t) => t.id) },
          serviceType: ServiceType.GOOGLE_SHEETS,
          status: Status.PENDING,
        },
        data: { status: Status.SUCCESS },
      });
      results.googleSheets = "success";
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      await prisma.taskStatus.updateMany({
        where: {
          taskId: { in: tasks.map((t) => t.id) },
          serviceType: ServiceType.GOOGLE_SHEETS,
          status: Status.PENDING,
        },
        data: { status: Status.FAILED, errorMessage: msg },
      });
      results.googleSheets = `failed: ${msg}`;
    }

    // Outlook and Slack will be added in later phases
    results.outlook = "pending implementation";
    results.slack = "pending implementation";

    return NextResponse.json({
      message: `Processed ${tasks.length} task(s) for ${todayIST}`,
      results,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
  }
}
