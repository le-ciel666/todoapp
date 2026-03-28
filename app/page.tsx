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
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="9"
        cy="9"
        r="8"
        stroke={checked ? '#6366f1' : '#d1d5db'}
        strokeWidth="1.5"
        fill={checked ? '#6366f1' : 'transparent'}
      />
      {checked && (
        <path
          d="M5.5 9L7.8 11.5L12.5 6.5"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M2 4h12M5.333 4V2.667a1.333 1.333 0 0 1 1.334-1.334h2.666a1.333 1.333 0 0 1 1.334 1.334V4m2 0v9.333A1.333 1.333 0 0 1 11.333 14.667H4.667a1.333 1.333 0 0 1-1.334-1.334V4h9.334z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.667 7.333v4M9.333 7.333v4"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BellIcon({ active, sent }: { active: boolean; sent: boolean }) {
  const color = sent ? '#9ca3af' : active ? '#6366f1' : '#d1d5db'
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.25L2 9.75v.75h12v-.75l-1.5-1.5V6A4.5 4.5 0 0 0 8 1.5z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M6.5 10.5a1.5 1.5 0 0 0 3 0" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
      {sent && (
        <circle cx="12" cy="4" r="2.5" fill="#10b981" />
      )}
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

  // 60秒ごとに通知をチェック
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
    inputRef.current?.focus()
  }

  const toggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    )
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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 flex items-start justify-center pt-16 pb-24 px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-xs font-medium text-indigo-500 tracking-widest uppercase">
              My Tasks
            </span>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
            ToDo リスト
          </h1>
          {mounted && tasks.length > 0 && (
            <p className="text-sm text-gray-400 mt-1">
              {activeCount > 0
                ? `残り ${activeCount} 件のタスク`
                : 'すべて完了！'}
            </p>
          )}
        </div>

        {/* Input */}
        <div className="flex gap-2 mb-6">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.nativeEvent.isComposing) addTask()
            }}
            placeholder="新しいタスクを入力..."
            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 placeholder-gray-300 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent transition"
          />
          <button
            onClick={addTask}
            disabled={!input.trim()}
            className="px-4 py-3 rounded-xl bg-indigo-500 text-white text-sm font-medium shadow-sm hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            追加
          </button>
        </div>

        {/* Filter tabs */}
        {mounted && tasks.length > 0 && (
          <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
            {(
              [
                { key: 'all', label: `すべて (${tasks.length})` },
                { key: 'active', label: `未完了 (${activeCount})` },
                { key: 'done', label: `完了 (${doneCount})` },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === key
                    ? 'bg-indigo-500 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {!mounted ? null : filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-gray-300">
              <div className="text-4xl mb-3">
                {filter === 'done' ? '🎉' : '📝'}
              </div>
              <p className="text-sm">
                {filter === 'done'
                  ? '完了したタスクはありません'
                  : filter === 'active'
                  ? '未完了のタスクはありません'
                  : 'タスクを追加してみましょう'}
              </p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const hasNotification = !!task.notification && !task.notification.sent
              const notificationSent = task.notification?.sent === true
              return (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`group flex items-center gap-3 px-4 py-3.5 rounded-xl bg-white border transition-all shadow-sm hover:shadow-md cursor-pointer ${
                    task.done
                      ? 'border-gray-100 opacity-60'
                      : 'border-gray-100 hover:border-indigo-100'
                  }`}
                >
                  <div className="flex-shrink-0 transition-transform active:scale-90">
                    <CheckIcon checked={task.done} />
                  </div>

                  <span
                    className={`flex-1 text-sm leading-relaxed ${
                      task.done
                        ? 'line-through text-gray-400'
                        : 'text-gray-700'
                    }`}
                  >
                    {task.text}
                  </span>

                  {/* ベルアイコン */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setNotifyingTask(task) }}
                    className="flex-shrink-0 transition-all active:scale-90 opacity-100"
                    aria-label="通知を設定"
                  >
                    <BellIcon active={hasNotification} sent={notificationSent} />
                  </button>

                  {/* 削除アイコン */}
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id) }}
                    className="flex-shrink-0 text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
                    aria-label="削除"
                  >
                    <TrashIcon />
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Clear done */}
        {mounted && doneCount > 0 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setTasks((prev) => prev.filter((t) => !t.done))}
              className="text-xs text-gray-300 hover:text-red-400 transition-colors"
            >
              完了済みを一括削除 ({doneCount}件)
            </button>
          </div>
        )}
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
    </main>
  )
}
