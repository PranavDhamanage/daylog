import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { appendTaskToSheet } from "@/lib/integrations/google-sheets";
import { ServiceType, Status } from "@/generated/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const where = dateParam
      ? {
          date: {
            gte: new Date(`${dateParam}T00:00:00.000Z`),
            lt: new Date(`${dateParam}T23:59:59.999Z`),
          },
        }
      : {};

    const tasks = await prisma.task.findMany({
      where,
      include: { taskStatus: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Failed to fetch tasks:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { taskName, description, project, hoursSpent, date } = body;

    if (!taskName || !project || !hoursSpent || !date) {
      return NextResponse.json(
        { error: "taskName, project, hoursSpent, and date are required" },
        { status: 400 }
      );
    }

    if (typeof hoursSpent !== "number" || hoursSpent <= 0 || hoursSpent > 24) {
      return NextResponse.json(
        { error: "hoursSpent must be a number between 0 and 24" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        taskName: taskName.trim(),
        description: description?.trim() || null,
        project: project.trim(),
        hoursSpent,
        date: new Date(date),
        taskStatus: {
          create: [
            { serviceType: ServiceType.GOOGLE_SHEETS, status: Status.PENDING },
            { serviceType: ServiceType.OUTLOOK, status: Status.PENDING },
            { serviceType: ServiceType.SLACK, status: Status.PENDING },
          ],
        },
      },
      include: { taskStatus: true },
    });

    // Push to Google Sheets immediately on submission
    try {
      await appendTaskToSheet(task);
      await prisma.taskStatus.updateMany({
        where: { taskId: task.id, serviceType: ServiceType.GOOGLE_SHEETS },
        data: { status: Status.SUCCESS },
      });
    } catch (sheetsError) {
      const errorMessage =
        sheetsError instanceof Error ? sheetsError.message : "Unknown error";
      await prisma.taskStatus.updateMany({
        where: { taskId: task.id, serviceType: ServiceType.GOOGLE_SHEETS },
        data: { status: Status.FAILED, errorMessage },
      });
      console.error("Google Sheets sync failed:", sheetsError);
    }

    const updatedTask = await prisma.task.findUnique({
      where: { id: task.id },
      include: { taskStatus: true },
    });

    return NextResponse.json(updatedTask, { status: 201 });
  } catch (error) {
    console.error("Failed to create task:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
