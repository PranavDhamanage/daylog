"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TaskFormData {
  taskName: string;
  description: string;
  project: string;
  hoursSpent: string;
  date: string;
}

interface TaskFormProps {
  onSuccess: () => void;
}

const defaultDate = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export function TaskForm({ onSuccess }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>({
    taskName: "",
    description: "",
    project: "",
    hoursSpent: "",
    date: defaultDate(),
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e: React.BaseSyntheticEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const hours = parseFloat(form.hoursSpent);
    if (isNaN(hours) || hours <= 0 || hours > 24) {
      setError("Hours spent must be a number between 0 and 24.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskName: form.taskName,
          description: form.description || null,
          project: form.project,
          hoursSpent: hours,
          date: form.date,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");

      setSuccess(true);
      setForm({
        taskName: "",
        description: "",
        project: "",
        hoursSpent: "",
        date: defaultDate(),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit task");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label htmlFor="taskName">
            Task Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="taskName"
            name="taskName"
            value={form.taskName}
            onChange={handleChange}
            required
            placeholder="e.g. Implemented login page"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project">
            Project <span className="text-destructive">*</span>
          </Label>
          <Input
            id="project"
            name="project"
            value={form.project}
            onChange={handleChange}
            required
            placeholder="e.g. Portal v2"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="hoursSpent">
            Hours Spent <span className="text-destructive">*</span>
          </Label>
          <Input
            id="hoursSpent"
            name="hoursSpent"
            type="number"
            value={form.hoursSpent}
            onChange={handleChange}
            required
            min="0.25"
            max="24"
            step="0.25"
            placeholder="e.g. 2.5"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="date">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={form.description}
          onChange={handleChange}
          rows={3}
          placeholder="What did you work on? Any blockers or notes..."
          className="resize-none"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          Task logged successfully and synced to Google Sheets.
        </p>
      )}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Logging task..." : "Log Task"}
      </Button>
    </form>
  );
}
