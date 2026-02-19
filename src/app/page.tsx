"use client";

import { useState, useCallback, useEffect } from "react";
import { TaskForm } from "@/components/TaskForm";
import { TaskList } from "@/components/TaskList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Task {
  id: string;
  taskName: string;
  description: string | null;
  project: string;
  hoursSpent: number;
  date: string;
  createdAt: string;
  taskStatus: {
    id: string;
    serviceType: string;
    status: string;
    errorMessage: string | null;
  }[];
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tasks");
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalHoursToday = tasks
    .filter((t) => new Date(t.date).toDateString() === new Date().toDateString())
    .reduce((sum, t) => sum + t.hoursSpent, 0);

  return (
    <main className="min-h-screen bg-muted/40">
      {/* Header */}
      <header className="bg-background border-b px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">DayLog</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{today}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Logged today</p>
            <p className="text-lg font-bold text-primary">{totalHoursToday}h</p>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Task Entry */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Log a Task</CardTitle>
          </CardHeader>
          <Separator />
          <CardContent className="pt-5">
            <TaskForm onSuccess={fetchTasks} />
          </CardContent>
        </Card>

        {/* Task History */}
        <section>
          <h2 className="text-base font-semibold mb-4">Recent Tasks</h2>
          <TaskList tasks={tasks} loading={loading} />
        </section>
      </div>
    </main>
  );
}
