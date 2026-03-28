'use client'

import { useState, useRef, useEffect } from 'react'
import NotificationModal from '@/components/NotificationModal'

type Notification = {
  email: string
  scheduledAt: number
  sent: boolean
}

type Task = {
  id: string
  text: string
  done: boolean
  createdAt: number
  notification?: Notification
}

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle
        cx="12" cy="12" r="10"
        stroke={checked ? '#6366f1' : '#d1d5db'}
        strokeWidth="1.5"
        fill={checked ? '#6366f1' : 'transparent'}
      />
      {checked && (
        <path
          d="M8 12L10.8 15L16 9"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.667 7.333v4M9.333 7.333v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function BellIcon({ active, sent }: { active: boolean; sent: boolean }) {
  const color = sent ? '#9ca3af' : active ? '#6366f1' : '#c4c4c4'
  return (
    <svg width="18" height="18" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.25L2 9.75v.75h12v-.75l-1.5-1.5V6A4.5 4.5 0 0 0 8 1.5z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {sent && <circle cx="12" cy="4" r="2.5" fill="#10b981" />}
      {active && !sent && <circle cx="12" cy="4" r="2.5" fill="#6366f1" />}
    </svg>
  )
}

function AddIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  )
}

const STORAGE_KEY = 'todo-tasks'

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [input, setInput] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'done'>('all')
  const [mounted, setMounted] = useState(false)
  const [notifyingTask, setNotifyingTask] = useState<Task | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setTasks(JSON.parse(saved))
      } catch {
        setTasks([])
      }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    }
  }, [tasks, mounted])

  useEffect(() => {
    if (!mounted) return
    const check = async () => {
      const now = Date.now()
      const due = tasks.filter(
        (t) => t.notification && !t.notification.sent && t.notification.scheduledAt <= now
      )
      for (const task of due) {
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              taskText: task.text,
              email: task.notification!.email,
              scheduledAt: task.notification!.scheduledAt,
            }),
          })
          setTasks((prev) =>
            prev.map((t) =>
              t.id === task.id
                ? { ...t, notification: { ...t.notification!, sent: true } }
                : t
            )
          )
        } catch {
          // 送信失敗は次回再試行
        }
      }
    }
    check()
    const timer = setInterval(check, 60_000)
    return () => clearInterval(timer)
  }, [mounted, tasks])

  const addTask = () => {
    const text = input.trim()
    if (!text) return
    setTasks((prev) => [
      { id: crypto.randomUUID(), text, done: false, createdAt: Date.now() },
      ...prev,
    ])
    setInput('')
  }

  const toggleTask = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  const saveNotification = (taskId: string, email: string, scheduledAt: number) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, notification: { email, scheduledAt, sent: false } } : t
      )
    )
  }

  const deleteNotification = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t
        const { notification: _, ...rest } = t
        return rest
      })
    )
  }

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'active') return !t.done
    if (filter === 'done') return t.done
    return true
  })

  const activeCount = tasks.filter((t) => !t.done).length
  const doneCount = tasks.filter((t) => t.done).length

  return (
    <div className="flex flex-col h-screen bg-gray-50">

      {/* ヘッダー */}
      <header className="header-safe bg-white border-b border-gray-100 px-5 pb-4 flex-shrink-0">
        <div className="flex items-center gap-2 mt-4 mb-1">
          <div className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-xs font-semibold text-indigo-500 tracking-widest uppercase">My Tasks</span>
        </div>
        <div className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">ToDo リスト</h1>
          {mounted && tasks.length > 0 && (
            <span className="text-sm text-gray-400">
              {activeCount > 0 ? `残り ${activeCount} 件` : 'すべて完了！🎉'}
            </span>
          )}
        </div>
      </header>

      {/* フィルタータブ */}
      {mounted && tasks.length > 0 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex-shrink-0">
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            {([
              { key: 'all', label: 'すべて', count: tasks.length },
              { key: 'active', label: '未完了', count: activeCount },
              { key: 'done', label: '完了', count: doneCount },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === key
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-gray-500 active:bg-white/60'
                }`}
              >
                {label}
                <span className={`ml-1 text-xs ${filter === key ? 'text-indigo-400' : 'text-gray-400'}`}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* タスクリスト（スクロール可能エリア） */}
      <div className="flex-1 overflow-y-auto">
        {!mounted ? null : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 pb-20">
            <div className="text-5xl mb-4">
              {filter === 'done' ? '🎉' : '📝'}
            </div>
            <p className="text-base">
              {filter === 'done'
                ? '完了したタスクはありません'
                : filter === 'active'
                ? '未完了のタスクはありません'
                : 'タスクを追加してみましょう'}
            </p>
          </div>
        ) : (
          <div className="px-4 py-3 space-y-2">
            {filteredTasks.map((task) => {
              const hasNotification = !!task.notification && !task.notification.sent
              const notificationSent = task.notification?.sent === true
              return (
                <div
                  key={task.id}
                  className={`flex items-center gap-2 px-3 py-3 rounded-2xl bg-white border shadow-sm transition-all active:scale-[0.99] ${
                    task.done ? 'border-gray-100 opacity-60' : 'border-gray-100'
                  }`}
                >
                  {/* チェックボタン */}
                  <button
                    onClick={() => toggleTask(task.id)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center"
                    aria-label={task.done ? '未完了に戻す' : '完了にする'}
                  >
                    <CheckIcon checked={task.done} />
                  </button>

                  {/* タスクテキスト */}
                  <span
                    onClick={() => toggleTask(task.id)}
                    className={`flex-1 text-base leading-snug cursor-pointer ${
                      task.done ? 'line-through text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {task.text}
                  </span>

                  {/* ベルボタン */}
                  <button
                    onClick={() => setNotifyingTask(task)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl active:bg-indigo-50 transition-colors"
                    aria-label="通知を設定"
                  >
                    <BellIcon active={hasNotification} sent={notificationSent} />
                  </button>

                  {/* 削除ボタン（常に表示） */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-gray-300 active:bg-red-50 active:text-red-400 transition-colors"
                    aria-label="削除"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )
            })}

            {/* 完了済み一括削除 */}
            {doneCount > 0 && (
              <button
                onClick={() => setTasks((prev) => prev.filter((t) => !t.done))}
                className="w-full py-4 text-sm text-gray-400 active:text-red-400 transition-colors"
              >
                完了済みを一括削除（{doneCount}件）
              </button>
            )}
          </div>
        )}
      </div>

      {/* 下部入力バー（固定） */}
      <div className="pb-safe bg-white border-t border-gray-100 px-4 pt-3 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) addTask()
            }}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-3.5 rounded-2xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent focus:bg-white transition"
          />
          <button
            onClick={addTask}
            disabled={!input.trim()}
            className="w-14 h-14 flex items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-sm active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            aria-label="追加"
          >
            <AddIcon />
          </button>
        </div>
      </div>

      {/* 通知設定モーダル */}
      {notifyingTask && (
        <NotificationModal
          task={notifyingTask}
          onClose={() => setNotifyingTask(null)}
          onSave={(email, scheduledAt) => saveNotification(notifyingTask.id, email, scheduledAt)}
          onDelete={() => deleteNotification(notifyingTask.id)}
        />
      )}
    </div>
  )
}
