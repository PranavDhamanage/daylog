"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface TaskStatus {
  id: string;
  serviceType: string;
  status: string;
  errorMessage: string | null;
}

interface Task {
  id: string;
  taskName: string;
  description: string | null;
  project: string;
  hoursSpent: number;
  date: string;
  createdAt: string;
  taskStatus: TaskStatus[];
}

interface TaskListProps {
  tasks: Task[];
  loading: boolean;
}

const serviceLabel: Record<string, string> = {
  GOOGLE_SHEETS: "Sheets",
  OUTLOOK: "Email",
  SLACK: "Slack",
};

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

const statusVariant: Record<string, BadgeVariant> = {
  SUCCESS: "default",
  FAILED: "destructive",
  PENDING: "secondary",
};

function StatusBadge({ status, label }: { status: string; label: string }) {
  return (
    <Badge variant={statusVariant[status] ?? "outline"}>
      {label}: {status.toLowerCase()}
    </Badge>
  );
}

export function TaskList({ tasks, loading }: TaskListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No tasks logged yet. Add your first task above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <Card key={task.id}>
          <CardContent className="px-5 py-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-semibold truncate">
                    {task.taskName}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {task.project}
                  </Badge>
                </div>
                {task.description && (
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                    {task.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-sm font-semibold">{task.hoursSpent}h</span>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {new Date(task.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>

            {task.taskStatus.length > 0 && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {task.taskStatus.map((ts) => (
                  <StatusBadge
                    key={ts.id}
                    status={ts.status}
                    label={serviceLabel[ts.serviceType] ?? ts.serviceType}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
