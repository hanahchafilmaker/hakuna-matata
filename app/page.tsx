"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TopHeader } from "@/components/layout/top-header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { HomeScreen } from "@/components/home/home-screen";
import { SettingsScreen } from "@/components/settings/settings-screen";
import type { DdayItem, BgTheme } from "@/components/settings/settings-screen";
import { AppBackground } from "@/components/background/app-background";
import { CalendarView } from "@/components/calendar/calendar-view";
import { TaskModal } from "@/components/tasks/task-modal";
import { useAppView } from "@/hooks/use-app-view";
import { useTasks } from "@/hooks/use-tasks";
import { todayStr } from "@/lib/dateUtils";
import type { Task } from "@/components/tasks/task-card";

const DEFAULT_DDAYS: DdayItem[] = [
  { id: "dday-1", label: "금연", date: "2024-11-23" },
  { id: "dday-2", label: "민효와 처음 만난 날", date: "2024-06-30" },
];

export default function Page() {
  const { tasks, addTask, updateTask, deleteTask, toggleTask } = useTasks();
  const { view, setView } = useAppView();

  const [modalOpen, setModalOpen] = useState(false);
  const [draft, setDraft] = useState<Partial<Task> | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  const [ddayItems, setDdayItems] = useState<DdayItem[]>(DEFAULT_DDAYS);
  const [bgTheme, setBgTheme] = useState<BgTheme>("night");

  const routines = useMemo(() => {
    const todayNum = new Date().getDay();
    const dayMap: Record<string, number> = {
      sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
    };
    return tasks.filter((task) => {
      const repeat = (task.repeat || "none").toLowerCase();
      if (repeat === "none") return false;
      if (repeat === "daily") return true;
      return repeat
        .split(",")
        .map((item: string) => item.trim())
        .some((item: string) => dayMap[item] === todayNum || item === todayNum.toString());
    });
  }, [tasks]);

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
    try { await toggleTask(task); } catch (e) { console.error(e); }
  }

  async function handleDelete(id: string) {
    if (!confirm("이 일정을 삭제할까요?")) return;
    try { await deleteTask(id); } catch (e) { console.error(e); }
    if (draft?.id === id) setModalOpen(false);
  }

  return (
    <>
      {/* ✅ 수정 1: theme prop 제거 — AppBackground가 이벤트로 직접 처리 */}
      <AppBackground />

      <AppShell>
        <div className="app-main">
          <TopHeader view={view} />

          {view === "home" && (
            <HomeScreen
              tasks={tasks}
              routines={routines}
              ddayItems={ddayItems}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}

          {view === "calendar" && (
            <CalendarView
              tasks={tasks}
              addTask={addTask}
              updateTask={updateTask}
              deleteTask={deleteTask}
              toggleTask={toggleTask}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          )}

          {view === "settings" && (
            <SettingsScreen
              ddayItems={ddayItems}
              onDdayChange={setDdayItems}
              currentTheme={bgTheme}
              onThemeChange={setBgTheme}
            />
          )}
        </div>

        {/* ✅ 수정 2: 설정 탭에서 FAB 숨김 */}
        <button
          type="button"
          className={`fab ${view === "settings" ? "is-hidden" : ""}`}
          onClick={openAdd}
          aria-label="일정 추가"
        >
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