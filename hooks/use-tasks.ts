'use client'

import useSWR from 'swr'
import type { Task } from '@/components/task-card'
import { todayStr } from '@/lib/dateUtils'
import { isRepeating } from '@/lib/repeatUtils'

const fetcher = (url: string) =>
  fetch(url).then((r) => r.json()).then((j) => j.data as Task[])

async function gasPost(action: string, payload: unknown): Promise<Task> {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(json.error)
  return json.data as Task
}

function parseCompletedDates(raw: unknown): string[] {
  if (!raw) return []
  if (Array.isArray(raw)) return raw
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) } catch { return [] }
  }
  return []
}

export function useTasks() {
  const { data, error, isLoading, mutate } = useSWR<Task[]>('/api/tasks', fetcher, {
    onErrorRetry: (err, _key, _cfg, revalidate, { retryCount }) => {
      if (retryCount >= 2) return
      setTimeout(() => revalidate({ retryCount }), 3000)
    },
    fallbackData: [],
  })

  const today = todayStr()

  // 루틴 일정: completedDates 기반으로 오늘 done 상태 주입 (매일 자동 초기화)
  const tasks: Task[] = (data ?? []).map((t) => {
    if (!isRepeating(t.repeat)) return t
    const completedDates = parseCompletedDates(t.completedDates)
    return {
      ...t,
      completedDates,
      done: completedDates.includes(today),
      occurrenceDate: today,
    }
  })

  const hasSheet = !error && !isLoading && data !== undefined

  async function addTask(form: Partial<Task>): Promise<Task> {
    const id = crypto.randomUUID()
    const newTask: Task = { ...(form as Task), id, done: false }
    mutate([newTask, ...tasks], false)
    try {
      const saved = await gasPost('add', { ...form, id })
      mutate(); return saved
    } catch (e) { mutate(); throw e }
  }

  async function updateTask(form: Partial<Task>): Promise<Task> {
    mutate(tasks.map((t) => (t.id === form.id ? { ...t, ...form } as Task : t)), false)
    try {
      const saved = await gasPost('update', form)
      mutate(); return saved
    } catch (e) { mutate(); throw e }
  }

  async function deleteTask(id: string): Promise<void> {
    mutate(tasks.filter((t) => t.id !== id), false)
    try { await gasPost('delete', { id }); mutate() }
    catch (e) { mutate(); throw e }
  }

  async function toggleTask(task: Task): Promise<void> {
    const originalId      = task.originalId ?? task.id
    const occurrenceDate  = task.occurrenceDate ?? today
    const repeating       = isRepeating(task.repeat)

    if (repeating) {
      const originalTask = tasks.find((t) => t.id === originalId)
      if (!originalTask) return
      const completedDates   = parseCompletedDates(originalTask.completedDates)
      const isCompleted      = completedDates.includes(occurrenceDate)
      const newCompleted     = isCompleted
        ? completedDates.filter((d) => d !== occurrenceDate)
        : [...completedDates, occurrenceDate]

      mutate(tasks.map((t) => t.id !== originalId ? t : { ...t, completedDates: newCompleted, done: newCompleted.includes(today) }), false)
      try {
        await gasPost('update', { id: originalId, completedDates: JSON.stringify(newCompleted) })
        mutate()
      } catch (e) { mutate(); throw e }
    } else {
      mutate(tasks.map((t) => t.id === originalId ? { ...t, done: !t.done } : t), false)
      try { await gasPost('toggle', { id: originalId }); mutate() }
      catch (e) { mutate(); throw e }
    }
  }

  return { tasks, isLoading, hasError: !!error, hasSheet, addTask, updateTask, deleteTask, toggleTask, refresh: () => mutate() }
}
