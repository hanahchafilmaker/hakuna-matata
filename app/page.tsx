"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeScreen } from "@/components/home/home-screen";
import { MoreScreen } from "@/components/more/more-screen";
import { AppBackground } from "@/components/background/app-background";
import { CalendarView } from "@/components/calendar-view";
import { TaskModal } from "@/components/task-modal";
import { useAppView } from "@/hooks/use-app-view";
import { useTasks } from "@/hooks/use-tasks";
import { todayStr } from "@/lib/dateUtils";
import { isRepeating } from "@/lib/repeatUtils";
import type { Task } from "@/components/task-card";

export default function Page() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { view, setView } = useAppView();
  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Task> | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const routines = useMemo(() => {
    const todayNum = new Date().getDay();
    const dayMap: Record<string, number> = {
      sun: 0,
      mon: 1,
      tue: 2,
      wed: 3,
      thu: 4,
      fri: 5,
      sat: 6,
    };
    return tasks.filter((task) => {
      const repeat = (task.repeat || "none").toLowerCase();
      if (repeat === "none") return false;
      if (repeat === "daily") return true;
      return repeat
        .split(",")
        .map((item) => item.trim())
        .some((item) => dayMap[item] === todayNum || item === todayNum.toString());
    });
  }, [tasks]);

  const mainTasks = useMemo(() => tasks.filter((task) => !isRepeating(task.repeat)), [tasks]);

  function openAdd() {
    setDraft({
      date_start: todayStr(),
      date_end: todayStr(),
      assignee: "하나",
      type: "ui",
      repeat: "none",
      done: false,
    });
    setIsEdit(false);
    setModalOpen(true);
  }

  function openEdit(task: Task) {
    setDraft({
      ...task,
      date_end: task.date_end || task.date_start,
      repeat: task.repeat || "none",
    });
    setIsEdit(true);
    setModalOpen(true);
  }

  async function handleSave(form: Partial<Task>) {
    if (!form.text?.trim()) return;
    setSaving(true);
    try {
      if (isEdit && form.id) {
        await updateTask(form);
      } else {
        await addTask(form);
      }
      setModalOpen(false);
    } catch (error) {
      console.error("저장 중 오류", error);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(task: Task) {
    try {
      await toggleTask(task);
    } catch (error) {
      console.error(error);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 일정을 삭제할까요?")) return;
    try {
      await deleteTask(id);
    } catch (error) {
      console.error(error);
    }
    if (draft?.id === id) {
      setModalOpen(false);
    }
  }

  return (
    <>
      <AppBackground />
      <AppShell>
        <div className="app-main">
          <TopHeader view={view} />

          {view === "home" && (
            <HomeScreen
              tasks={tasks}
              routines={routines}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onAdd={openAdd}
            />
          )}

          {view === "calendar" && (
            <CalendarView
              tasks={tasks}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}

          {view === "more" && (
            <MoreScreen
              tasks={tasks}
              routines={routines}
              showDone={false}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}
        </div>

        <button type="button" className="fab" onClick={openAdd}>
          +
        </button>

        <BottomNav view={view} setView={setView} />
      </AppShell>

      <TaskModal
        task={draft}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        isEditMode={isEdit}
      />
    </>
  );
}
