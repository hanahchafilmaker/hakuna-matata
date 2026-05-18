# Hakuna Matata → Supabase 마이그레이션 가이드

> Google Sheets + GAS → Supabase (익명 접근 + Realtime)

---

## 목차

1. [Supabase 프로젝트 설정](#1-supabase-프로젝트-설정)
2. [DB 스키마 (SQL)](#2-db-스키마-sql)
3. [RLS 정책](#3-rls-정책-row-level-security)
4. [패키지 설치](#4-패키지-설치)
5. [환경변수 설정](#5-환경변수-설정)
6. [Supabase 클라이언트](#6-supabase-클라이언트-libsupabaseclientts)
7. [use-tasks 훅 교체](#7-use-tasks-훅-교체-hooksuse-tasksts)
8. [API Route 삭제](#8-api-route-삭제)
9. [app/page.tsx 수정 (선택)](#9-appapagetsx-수정-선택)
10. [검증 체크리스트](#10-검증-체크리스트)

---

## 1. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) → New project 생성
2. **Region**: Northeast Asia (도쿄) 권장
3. 생성 후 **Settings → API** 에서 아래 두 값 복사:
   - `Project URL`
   - `anon public` key

---

## 2. DB 스키마 (SQL)

Supabase 대시보드 → **SQL Editor** → New query에 아래 전체를 붙여넣고 실행.

```sql
-- tasks 테이블
create table if not exists public.tasks (
  id          text        primary key default gen_random_uuid()::text,
  text        text        not null,
  assignee    text        not null default '하나',
  type        text        not null default 'ui',   -- 'ui' | 'nui' | 'uni'
  date_start  text        not null default '',
  date_end    text        not null default '',
  time        text        not null default '',
  location    text        not null default '',
  memo        text        not null default '',
  repeat      text        not null default 'none',
  done        boolean     not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- updated_at 자동 갱신 트리거
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Realtime 활성화
alter publication supabase_realtime add table public.tasks;
```

---

## 3. RLS 정책 (Row Level Security)

익명 접근 허용 (두 사람이 같은 Anon Key로 공유).

```sql
-- RLS 활성화
alter table public.tasks enable row level security;

-- 모든 작업 허용 (anon 포함)
create policy "allow_all" on public.tasks
  for all
  using (true)
  with check (true);
```

> **보안 참고**: 이 설정은 anon key를 아는 누구나 접근 가능합니다.
> 추후 두 사람만 접근하도록 제한하려면 Supabase Auth + user_id 컬럼을 추가하세요.

---

## 4. 패키지 설치

```bash
npm install @supabase/supabase-js
# SWR은 이미 있으므로 추가 불필요
```

---

## 5. 환경변수 설정

프로젝트 루트에 `.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> `NEXT_PUBLIC_` 접두사 필수 — 클라이언트 컴포넌트에서 사용하기 위함.

`.gitignore`에 추가 확인:

```
.env.local
.env
```

---

## 6. Supabase 클라이언트 (`lib/supabase/client.ts`)

새 파일 생성:

```ts
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key  = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key, {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// DB 타입 (Task와 동일 구조)
export type TaskRow = {
  id: string
  text: string
  assignee: string
  type: 'ui' | 'nui' | 'uni'
  date_start: string
  date_end: string
  time: string
  location: string
  memo: string
  repeat: string
  done: boolean
  created_at: string
  updated_at: string
}
```

---

## 7. `use-tasks` 훅 교체 (`hooks/use-tasks.ts`)

기존 파일을 아래로 **전체 교체**:

```ts
// hooks/use-tasks.ts
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, type TaskRow } from '@/lib/supabase/client'
import type { Task } from '@/components/tasks/task-card'

// Supabase row → 앱 내부 Task 타입 변환
function rowToTask(row: TaskRow): Task {
  return {
    id:         row.id,
    text:       row.text,
    assignee:   row.assignee as Task['assignee'],
    type:       row.type as Task['type'],
    date_start: row.date_start,
    date_end:   row.date_end,
    time:       row.time,
    location:   row.location,
    memo:       row.memo,
    repeat:     row.repeat,
    done:       row.done,
  }
}

// Task → Supabase insert/update payload
function taskToRow(task: Partial<Task>): Partial<TaskRow> {
  const row: Partial<TaskRow> = {}
  if (task.text       !== undefined) row.text       = task.text
  if (task.assignee   !== undefined) row.assignee   = task.assignee
  if (task.type       !== undefined) row.type       = task.type as TaskRow['type']
  if (task.date_start !== undefined) row.date_start = task.date_start
  if (task.date_end   !== undefined) row.date_end   = task.date_end
  if (task.time       !== undefined) row.time       = task.time
  if (task.location   !== undefined) row.location   = task.location
  if (task.memo       !== undefined) row.memo       = task.memo
  if (task.repeat     !== undefined) row.repeat     = task.repeat
  if (task.done       !== undefined) row.done       = task.done
  return row
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  // 최신 tasks를 Realtime 콜백에서 참조하기 위한 ref
  const tasksRef = useRef<Task[]>([])
  tasksRef.current = tasks

  // 초기 데이터 로드
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTasks((data as TaskRow[]).map(rowToTask))
      setError(null)
    }
    setLoading(false)
  }, [])

  // Realtime 구독
  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newTask = rowToTask(payload.new as TaskRow)
            setTasks((prev) => {
              // 이미 있으면 중복 추가 방지 (optimistic update 충돌)
              if (prev.some((t) => t.id === newTask.id)) return prev
              return [...prev, newTask]
            })
          }

          if (payload.eventType === 'UPDATE') {
            const updated = rowToTask(payload.new as TaskRow)
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            )
          }

          if (payload.eventType === 'DELETE') {
            setTasks((prev) => prev.filter((t) => t.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchAll])

  // ── CRUD ──────────────────────────────────────────

  const addTask = useCallback(async (form: Partial<Task>) => {
    const payload = {
      text:       form.text?.trim() ?? '',
      assignee:   form.assignee   ?? '하나',
      type:       form.type       ?? 'ui',
      date_start: form.date_start ?? '',
      date_end:   form.date_end   ?? form.date_start ?? '',
      time:       form.time       ?? '',
      location:   form.location   ?? '',
      memo:       form.memo       ?? '',
      repeat:     form.repeat     ?? 'none',
      done:       form.done       ?? false,
    }

    // Optimistic update
    const tempId = `temp-${Date.now()}`
    const optimistic: Task = { ...payload, id: tempId } as Task
    setTasks((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      // 롤백
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
      throw new Error(error.message)
    }

    // temp → 실제 id로 교체 (Realtime INSERT가 더 빠를 수 있어 중복 방지)
    setTasks((prev) =>
      prev.map((t) => (t.id === tempId ? rowToTask(data as TaskRow) : t))
    )
  }, [])

  const updateTask = useCallback(async (form: Partial<Task>) => {
    if (!form.id) throw new Error('id 없음')

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === form.id ? { ...t, ...form } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update(taskToRow(form))
      .eq('id', form.id)

    if (error) {
      // 롤백: 서버에서 다시 받아오기
      await fetchAll()
      throw new Error(error.message)
    }
  }, [fetchAll])

  const deleteTask = useCallback(async (id: string) => {
    // Optimistic update
    const backup = tasksRef.current.find((t) => t.id === id)
    setTasks((prev) => prev.filter((t) => t.id !== id))

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      // 롤백
      if (backup) setTasks((prev) => [...prev, backup])
      throw new Error(error.message)
    }
  }, [])

  const toggleTask = useCallback(async (task: Task) => {
    await updateTask({ id: task.id, done: !task.done })
  }, [updateTask])

  return { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask }
}
```

---

## 8. API Route 삭제

아래 파일/폴더를 **삭제**:

```
app/api/tasks/route.ts
app/api/tasks/          ← 폴더 전체
app/api/                ← tasks만 있었다면 이것도
```

`package.json`의 `swr` 의존성은 훅에서 더 이상 쓰지 않으므로 선택적으로 제거 가능:

```bash
npm uninstall swr
```

---

## 9. `app/page.tsx` 수정 (선택)

`use-tasks` 인터페이스가 동일(`tasks`, `addTask`, `updateTask`, `deleteTask`, `toggleTask`)하게 유지되어 **page.tsx는 거의 수정 없이 동작**합니다.

단, loading/error 상태 UI를 추가하면 좋습니다:

```tsx
// app/page.tsx 상단에 추가
const { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask } = useTasks()

// 로딩 화면 (선택)
if (loading) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>
      불러오는 중...
    </div>
  )
}
```

---

## 10. 검증 체크리스트

작업 완료 후 아래 순서로 확인:

- [ ] `npm run dev` — 콘솔 에러 없음
- [ ] 일정 추가 → Supabase 대시보드 Table Editor에 row 생김
- [ ] 브라우저 두 탭 열고 한쪽에서 추가 → 다른 탭에 즉시 반영 (Realtime)
- [ ] 일정 수정/삭제 → 양쪽 동기화 확인
- [ ] 완료 토글 → 양쪽 동기화 확인
- [ ] 모바일(or 두 번째 기기)에서 동시 접속 테스트

---

## 요약: 변경 파일 목록

| 작업 | 파일 |
|------|------|
| **신규 생성** | `lib/supabase/client.ts` |
| **전체 교체** | `hooks/use-tasks.ts` |
| **삭제** | `app/api/tasks/route.ts` |
| **수정 (선택)** | `app/page.tsx` (로딩 UI) |
| **신규 생성** | `.env.local` |
| **SQL 실행** | Supabase SQL Editor |
