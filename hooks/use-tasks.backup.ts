"use client";

import useSWR from "swr";
import type { Task } from "@/components/tasks/task-card";
import { todayStr } from "@/lib/dateUtils";
import { isRepeating } from "@/lib/repeatUtils";

const fetcher = async (url: string): Promise<Task[]> => {
  const res = await fetch(url);
  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "데이터를 불러오지 못했습니다.");
  return (json.data ?? []) as Task[];
};

async function gasPost<T = Task>(action: string, payload: unknown): Promise<T> {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, payload }),
  });

  const json = await res.json();
  if (!json.ok) throw new Error(json.error || "요청 처리에 실패했습니다.");
  return json.data as T;
}

function parseCompletedDates(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String);

  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeTaskFromServer(task: Task, today: string): Task {
  if (!isRepeating(task.repeat)) return task;

  const completedDates = parseCompletedDates(task.completedDates);

  return {
    ...task,
    completedDates,
    done: completedDates.includes(today),
    occurrenceDate: today,
  };
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>("/api/tasks", fetcher, {
    fallbackData: [],
    revalidateOnFocus: false,
    onErrorRetry: (_err, _key, _cfg, revalidate, { retryCount }) => {
      if (retryCount >= 2) return;
      setTimeout(() => revalidate({ retryCount }), 3000);
    },
  });

  const today = todayStr();

  const tasks: Task[] = (data ?? []).map((task) => normalizeTaskFromServer(task, today));
  const hasSheet = !error && !isLoading && data !== undefined;

  async function addTask(form: Partial<Task>): Promise<Task> {
    const id = crypto.randomUUID();

    const optimisticTask: Task = {
      id,
      text: form.text || "",
      date_start: form.date_start || today,
      date_end: form.date_end || form.date_start || today,
      assignee: (form.assignee as Task["assignee"]) || "하나",
      location: form.location || "",
      time: form.time || "",
      type: (form.type as Task["type"]) || "nuni",
      repeat: form.repeat || "none",
      done: !!form.done,
      completedDates: form.completedDates || "",
    };

    mutate([optimisticTask, ...tasks], false);

    try {
      const saved = await gasPost<Task>("add", { ...form, id });
      await mutate();
      return saved;
    } catch (e) {
      await mutate();
      throw e;
    }
  }

  async function updateTask(form: Partial<Task>): Promise<Task> {
    mutate(
      tasks.map((task) => (task.id === form.id ? ({ ...task, ...form } as Task) : task)),
      false,
    );

    try {
      const saved = await gasPost<Task>("update", form);
      await mutate();
      return saved;
    } catch (e) {
      await mutate();
      throw e;
    }
  }

  async function deleteTask(id: string): Promise<void> {
    mutate(
      tasks.filter((task) => task.id !== id),
      false,
    );

    try {
      await gasPost<{ id: string }>("delete", { id });
      await mutate();
    } catch (e) {
      await mutate();
      throw e;
    }
  }

  async function toggleTask(task: Task): Promise<void> {
    const originalId = task.originalId ?? task.id;
    const occurrenceDate = task.occurrenceDate ?? today;
    const repeating = isRepeating(task.repeat);

    if (repeating) {
      const originalTask = tasks.find((t) => t.id === originalId);
      if (!originalTask) return;

      const completedDates = parseCompletedDates(originalTask.completedDates);
      const isCompleted = completedDates.includes(occurrenceDate);

      const nextCompletedDates = isCompleted
        ? completedDates.filter((d) => d !== occurrenceDate)
        : [...completedDates, occurrenceDate];

      mutate(
        tasks.map((t) =>
          t.id !== originalId
            ? t
            : {
                ...t,
                completedDates: nextCompletedDates,
                done: nextCompletedDates.includes(today),
              },
        ),
        false,
      );

      try {
        await gasPost<Task>("update", {
          id: originalId,
          completedDates: JSON.stringify(nextCompletedDates),
        });
        await mutate();
      } catch (e) {
        await mutate();
        throw e;
      }

      return;
    }

    mutate(
      tasks.map((t) => (t.id === originalId ? { ...t, done: !t.done } : t)),
      false,
    );

    try {
      await gasPost<Task>("toggle", { id: originalId });
      await mutate();
    } catch (e) {
      await mutate();
      throw e;
    }
  }

  return {
    tasks,
    isLoading,
    hasError: !!error,
    hasSheet,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    refresh: () => mutate(),
  };
}
