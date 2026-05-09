"use client";

import { useMemo, useState } from "react";
import { LayoutGrid, ListTodo, Repeat2, Settings2, ArrowLeft } from "lucide-react";
import { TodoView } from "@/components/todo-view";
import { MatrixView } from "@/components/matrix-view";
import { TaskCard, type Task } from "@/components/task-card";
import { getDdayLabel, parseLocalDate, todayStr } from "@/lib/dateUtils";

type Section = "list" | "todo" | "matrix" | "routine" | "settings";

type Props = {
  tasks: Task[];
  routines: Task[];
  showDone: boolean;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
};

const ACTIONS: Array<{ key: Section; label: string; description: string }> = [
  { key: "todo", label: "전체 할 일", description: "모든 할 일을 한 곳에서 관리" },
  { key: "routine", label: "루틴", description: "반복 일을 빠르게 확인" },
  { key: "matrix", label: "매트릭스", description: "우선순위 중심으로 보기" },
  { key: "settings", label: "설정", description: "앱 환경을 조정" },
];

export function MoreScreen({ tasks, routines, showDone, onEdit, onToggle, onDelete }: Props) {
  const [activeSection, setActiveSection] = useState<Section>("list");
  const today = todayStr();

  const ddayTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.date_start && task.date_start !== today)
        .map((task) => ({
          task,
          diff: Math.abs(
            (parseLocalDate(task.date_start) ? Number(parseLocalDate(task.date_start)) : 0) -
              Number(parseLocalDate(today) ?? new Date()),
          ),
        }))
        .slice(0, 4),
    [tasks, today],
  );

  const activeTitle = {
    todo: "전체 할 일",
    matrix: "매트릭스",
    routine: "루틴",
    settings: "설정",
    list: "더보기",
  }[activeSection];

  return (
    <div className="section-stack">
      <div className="section-header">
        <div>
          <p className="section-label">{activeTitle}</p>
          <p className="section-description">
            {activeSection === "list"
              ? "자주 쓰는 기능을 모아두었습니다."
              : "화면을 아래로 스크롤 해보세요."}
          </p>
        </div>
        {activeSection !== "list" && (
          <button type="button" className="link-button" onClick={() => setActiveSection("list")}>
            <ArrowLeft size={16} /> 뒤로
          </button>
        )}
      </div>

      {activeSection === "list" ? (
        <div className="home-actions">
          {ACTIONS.map((action) => (
            <button
              key={action.key}
              type="button"
              className="action-card"
              onClick={() => setActiveSection(action.key)}
            >
              <strong>{action.label}</strong>
              <span>{action.description}</span>
            </button>
          ))}
        </div>
      ) : activeSection === "todo" ? (
        <TodoView
          tasks={tasks.filter((task) => showDone || !task.done)}
          showDone={showDone}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ) : activeSection === "matrix" ? (
        <MatrixView
          tasks={tasks.filter((task) => showDone || !task.done)}
          routines={routines}
          showDone={showDone}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ) : activeSection === "routine" ? (
        <div className="home-list">
          {routines.length > 0 ? (
            routines.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={onEdit}
                onToggle={onToggle}
                onDelete={() => {}}
                compact
              />
            ))
          ) : (
            <div className="home-empty">오늘 루틴 일정이 없습니다.</div>
          )}
        </div>
      ) : (
        <div className="card home-card">
          <p className="section-label">설정 화면은 추후 확장 예정입니다.</p>
          <p className="section-description">앱 테마, 알림, 백업 설정 등을 넣을 수 있습니다.</p>
        </div>
      )}

      {activeSection === "list" && ddayTasks.length > 0 && (
        <section className="home-card card">
          <div className="section-header">
            <div>
              <p className="section-label">다음 디데이</p>
              <p className="section-description">가까운 4개를 보여줍니다.</p>
            </div>
          </div>
          <div className="home-dday-grid">
            {ddayTasks.map(({ task }) => (
              <div key={task.id} className="dday-card">
                <p className="dday-title">{task.text}</p>
                <p className="dday-label">{getDdayLabel(task.date_start)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
