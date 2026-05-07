'use client'

import { useState, useMemo, useEffect } from 'react'
import { StarBackground } from '@/components/star-background'
import { TaskCard, type Task } from '@/components/task-card'
import { TaskModal } from '@/components/task-modal'
import { TodoView } from '@/components/todo-view'
import { MatrixView } from '@/components/matrix-view'
import { CalendarView } from '@/components/calendar-view'
import { useTasks } from '@/hooks/use-tasks'
import { todayStr } from '@/lib/dateUtils'
import { isRepeating } from '@/lib/repeatUtils'
import { CalendarDays, ListTodo, LayoutGrid, CheckCircle, RefreshCw, Plus } from 'lucide-react'

const getTodayDay = () => new Date().getDay()

// 탭 순서: 캘린더를 첫 번째로
type View = 'calendar' | 'todo' | 'matrix' | 'all'

const TABS: { id: View; label: string; Icon: React.FC<{ width?: number; height?: number }> }[] = [
  { id: 'calendar', label: 'Calendar', Icon: CalendarDays },
  { id: 'todo',     label: 'TODO',     Icon: ListTodo     },
  { id: 'matrix',  label: 'MATRIX',   Icon: LayoutGrid   },
  { id: 'all',     label: 'ALL',      Icon: CheckCircle  },
]

export default function HakunaApp() {
  const { tasks, isLoading, addTask, updateTask, deleteTask, toggleTask, refresh } = useTasks()

  // 기본 탭: 캘린더
  const [view, setView]         = useState<View>('calendar')
  const [showDone, setShowDone] = useState(false)
  const [modalOpen, setModalOpen]   = useState(false)
  const [draft, setDraft]           = useState<Partial<Task> | null>(null)
  const [isEdit, setIsEdit]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [headerOpacity, setHeaderOpacity] = useState(0.5)

  useEffect(() => {
    const handler = () => setHeaderOpacity(Math.min(0.5 + window.scrollY * 0.0022, 0.92))
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const routines = useMemo(() => {
    const todayNum = getTodayDay()
    const dayMap: Record<string, number> = { sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6 }
    return tasks.filter((t) => {
      const repeat = (t.repeat || 'none').toLowerCase()
      if (repeat === 'none') return false
      if (repeat === 'daily') return true
      const days = repeat.split(',').map((s) => s.trim())
      return days.some((d) => dayMap[d] === todayNum || d === todayNum.toString())
    })
  }, [tasks])

  const mainTasks = useMemo(() => tasks.filter((t) => !isRepeating(t.repeat)), [tasks])

  const allVisible = useMemo(() =>
    mainTasks.filter((t) => showDone || !t.done)
      .sort((a, b) => {
        if (!a.date_start && !b.date_start) return 0
        if (!a.date_start) return 1
        if (!b.date_start) return -1
        return a.date_start.localeCompare(b.date_start)
      }),
    [mainTasks, showDone]
  )

  const todoCount    = mainTasks.filter((t) => !t.done).length
  const routineDone  = useMemo(() => {
    const today = todayStr()
    return routines.filter((t) => {
      let c: string[] = []
      if (typeof t.completedDates === 'string') { try { c = JSON.parse(t.completedDates as unknown as string) } catch { c=[] } }
      else if (Array.isArray(t.completedDates)) { c = t.completedDates }
      return c.includes(today)
    }).length
  }, [routines])

  function openAdd() {
    setDraft({ date_start: todayStr(), date_end: todayStr(), assignee: '하나', type: 'ui', repeat: 'none', done: false })
    setIsEdit(false); setModalOpen(true)
  }
  function openEdit(task: Task) {
    setDraft({ ...task, date_end: task.date_end || task.date_start, repeat: task.repeat || 'none' })
    setIsEdit(true); setModalOpen(true)
  }
  async function handleSave(form: Partial<Task>) {
    if (!form.text?.trim()) return
    setSaving(true)
    try {
      if (isEdit && form.id) await updateTask(form)
      else await addTask(form)
      setModalOpen(false)
    } catch { alert('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }
  async function handleToggle(task: Task) { try { await toggleTask(task) } catch (e) { console.error(e) } }
  async function handleDelete(id: string) {
    if (!confirm('이 일정을 삭제할까요?')) return
    try { await deleteTask(id) } catch (e) { console.error(e) }
    if (draft?.id === id) setModalOpen(false)
  }

  return (
    <>
      <StarBackground />
      <div style={{ position: 'relative', zIndex: 1, minHeight: '100dvh', display: 'flex', flexDirection: 'column', maxWidth: 390, margin: '0 auto' }}>

        {/* 헤더 */}
        <header style={{ position: 'sticky', top: 0, zIndex: 100, padding: 'max(14px,env(safe-area-inset-top)) 18px 10px', background: `rgba(4,8,16,${headerOpacity})`, backdropFilter: 'blur(20px) saturate(1.8)', WebkitBackdropFilter: 'blur(20px) saturate(1.8)', borderBottom: '1px solid rgba(255,255,255,0.07)', transition: 'background 0.2s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.4)', border: '1px solid var(--gold-border)', background: '#0d1a2e' }}>
              <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/fPTvS-hxy7JQHRA192mEGeoQiLD7oV1Gmgy3.jpg" alt="Hakuna Matata" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1, lineHeight: 1.1 }}>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 16, fontWeight: 700, color: 'var(--gold-soft)', letterSpacing: '0.01em' }}>Hakuna Matata</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', marginTop: 3, display: 'flex', gap: 8, alignItems: 'center' }}>
                <span>할 일 {todoCount}개</span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>루틴 {routineDone}/{routines.length}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={() => setShowDone((v) => !v)} className="toggle-done-btn">
                {showDone ? '완료 숨기기' : '완료 보기'}
              </button>
              <button type="button" onClick={() => refresh()} className="refresh-btn">
                <RefreshCw width={13} height={13} className={isLoading ? 'spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        {/* 메인 */}
        <main style={{ flex: 1, padding: view==='calendar' ? '12px 10px 100px' : view==='matrix' ? '12px 12px 100px' : '14px 12px 100px', overflowY: 'auto' }}>
          {view === 'calendar' && <CalendarView tasks={tasks} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />}
          {view === 'todo'     && <TodoView tasks={mainTasks} showDone={showDone} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />}
          {view === 'matrix'   && <MatrixView tasks={mainTasks} routines={routines} showDone={showDone} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />}
          {view === 'all'      && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="section-head">
                <span className="section-title">모든 일정</span>
                <span className="section-badge">{allVisible.length}개</span>
              </div>
              {allVisible.map((task) => (
                <TaskCard key={task.id} task={task} onEdit={openEdit} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </main>

        <button type="button" className="fab" onClick={openAdd}><Plus size={22} color="white" /></button>

        {/* 탭 바 */}
        <nav className="tab-bar">
          {TABS.map(({ id, label, Icon }) => (
            <button key={id} type="button" className={`tab-btn ${view===id ? 'active' : ''}`} onClick={() => setView(id)}>
              <Icon width={20} height={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      <TaskModal task={draft} isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} isEditMode={isEdit} />

      <style jsx global>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .refresh-btn { width:32px;height:32px;border-radius:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:var(--text-dim);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all 0.2s; }
        .refresh-btn:hover { background:rgba(255,255,255,0.09); }
        .toggle-done-btn { font-size:10px;padding:5px 11px;border-radius:16px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);color:var(--text-muted);cursor:pointer;white-space:nowrap;transition:all 0.2s;letter-spacing:0.01em; }
        .toggle-done-btn:hover { background:rgba(255,255,255,0.09); }
        .section-head { display:flex;align-items:center;justify-content:space-between;padding:0 4px 8px; }
        .section-title { font-size:12px;font-weight:700;color:var(--gold-soft); }
        .section-badge { font-size:10px;color:var(--text-muted); }
      `}</style>
    </>
  )
}
