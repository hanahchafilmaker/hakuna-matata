import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase, type TaskRow } from '@/lib/supabase/client'
import type { Task } from '@/components/tasks/task-card'

// Singleton realtime subscription manager
let tasksSubscription: any = null
let tasksListeners: Set<(tasks: Task[]) => void> = new Set()

// ── 타입 변환 ──────────────────────────────────────
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

function taskToRow(task: Partial<Task>): Partial<Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>> {
  const row: Partial<Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>> = {}
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

// ── 훅 ────────────────────────────────────────────
export function useTasks() {
  const [tasks, setTasks]   = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState<string | null>(null)

  // Realtime listeners management
  useEffect(() => {
    // Register listener for this component instance
    const listener = (newTasks: Task[]) => {
      setTasks(newTasks)
    }

    tasksListeners.add(listener)

    // Initialize subscription if this is the first listener
    if (!tasksSubscription) {
      tasksSubscription = supabase
        .channel('tasks-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tasks' },
          async () => {
            // Fetch latest tasks when any change occurs
            const { data, error } = await supabase
              .from('tasks')
              .select('*')
              .order('created_at', { ascending: true })

            if (error) {
              console.error('Realtime error:', error)
              return
            }
            // Notify all listeners with fresh data (properly convert TaskRow to Task)
            tasksListeners.forEach(l => l(data.map(rowToTask)))
          }
        )
        .subscribe()
    }

    // Cleanup on unmount
    return () => {
      tasksListeners.delete(listener)

      // If no more listeners, cleanup subscription
      if (tasksListeners.size === 0 && tasksSubscription) {
        supabase.removeChannel(tasksSubscription)
        tasksSubscription = null
      }
    }
  }, [])

  // 초기 전체 로드
  const fetchAll = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      setError(error.message)
    } else {
      setTasks(data as Task[])
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [])

  // ── CRUD ──────────────────────────────────────────
  const addTask = useCallback(async (form: Partial<Task>) => {
    const payload = {
      text:       form.text?.trim() ?? '',
      assignee:   form.assignee   ?? '하나',
      type:       (form.type      ?? 'ui') as TaskRow['type'],
      date_start: form.date_start ?? '',
      date_end:   form.date_end   ?? form.date_start ?? '',
      time:       form.time       ?? '',
      location:   form.location   ?? '',
      memo:       form.memo       ?? '',
      repeat:     form.repeat     ?? 'none',
      done:       form.done       ?? false,
    }

    // Optimistic update (임시 ID)
    const tempId = `temp-${Date.now()}`
    const optimistic: Task = { ...payload, id: tempId } as Task
    setTasks((prev) => [...prev, optimistic])

    const { data, error } = await supabase
      .from('tasks')
      .insert(payload)
      .select()
      .single()

    if (error) {
      setTasks((prev) => prev.filter((t) => t.id !== tempId))
      throw new Error(error.message)
    }

    // 실제 row로 교체 (Realtime이 더 빠른 경우 중복 방지)
    setTasks((prev) =>
      prev.map((t) => (t.id === tempId ? rowToTask(data as TaskRow) : t))
    )
  }, [])

  const updateTask = useCallback(async (form: Partial<Task>) => {
    if (!form.id) throw new Error('task id가 없습니다')

    // 롤백용 백업
    const backup = tasksRef.current.find((t) => t.id === form.id)

    // Optimistic update
    setTasks((prev) =>
      prev.map((t) => (t.id === form.id ? { ...t, ...form } : t))
    )

    const { error } = await supabase
      .from('tasks')
      .update(taskToRow(form))
      .eq('id', form.id)

    if (error) {
      if (backup) {
        setTasks((prev) =>
          prev.map((t) => (t.id === form.id ? backup : t)))
      } else {
        await fetchAll()
      }
      throw new Error(error.message)
    }
  }, [fetchAll])

  const deleteTask = useCallback(async (id: string) => {
    const backup = tasksRef.current.find((t) => t.id === id)

    // Optimistic update
    setTasks((prev) => prev.filter((t) => t.id !== id))

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)

    if (error) {
      if (backup) setTasks((prev) => [...prev, backup])
      throw new Error(error.message)
    }
  }, [])

  const toggleTask = useCallback(async (task: Task) => {
    await updateTask({ id: task.id, done: !task.done })
  }, [updateTask])

  // Realtime 콜백 내에서 최신 tasks 참조
  const tasksRef = useRef<Task[]>([])
  tasksRef.current = tasks

  return { tasks, loading, error, addTask, updateTask, deleteTask, toggleTask }
}