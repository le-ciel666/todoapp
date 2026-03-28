'use client'

import { useState } from 'react'

type Notification = {
  email: string
  scheduledAt: number
  sent: boolean
}

type Task = {
  id: string
  text: string
  notification?: Notification
}

type Props = {
  task: Task
  onClose: () => void
  onSave: (email: string, scheduledAt: number) => void
  onDelete: () => void
}

function formatDatetimeLocal(ms: number): string {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function minDatetimeLocal(): string {
  return formatDatetimeLocal(Date.now() + 60_000)
}

export default function NotificationModal({ task, onClose, onSave, onDelete }: Props) {
  const existing = task.notification
  const [email, setEmail] = useState(existing?.email ?? '')
  const [datetime, setDatetime] = useState(
    existing && !existing.sent ? formatDatetimeLocal(existing.scheduledAt) : ''
  )
  const [error, setError] = useState('')

  const handleSave = () => {
    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('有効なメールアドレスを入力してください')
      return
    }
    if (!datetime) {
      setError('通知日時を選択してください')
      return
    }
    const ms = new Date(datetime).getTime()
    if (ms <= Date.now()) {
      setError('現在より後の日時を選択してください')
      return
    }
    onSave(email, ms)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* ボトムシート */}
      <div className="relative w-full max-w-lg bg-white rounded-t-3xl shadow-2xl z-10">
        {/* ハンドルバー */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-200" />
        </div>

        <div className="px-6 pb-safe">
          {/* ヘッダー */}
          <div className="flex items-center justify-between pt-3 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <BellIcon className="text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-500 tracking-widest uppercase">Notification</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800">通知を設定</h2>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200 transition-colors"
              aria-label="閉じる"
            >
              <CloseIcon />
            </button>
          </div>

          {/* タスク名 */}
          <div className="bg-indigo-50 rounded-2xl px-4 py-3 mb-5">
            <p className="text-base font-medium text-indigo-700 truncate">{task.text}</p>
          </div>

          {/* 送信済みの場合 */}
          {existing?.sent && (
            <div className="bg-green-50 border border-green-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-2">
              <span className="text-green-500 text-lg">✓</span>
              <p className="text-base text-green-700">この通知は送信済みです</p>
            </div>
          )}

          {/* フォーム */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                メールアドレス
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                placeholder="example@email.com"
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-base text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-gray-50 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                通知日時
              </label>
              <input
                type="datetime-local"
                value={datetime}
                min={minDatetimeLocal()}
                onChange={(e) => { setDatetime(e.target.value); setError('') }}
                className="w-full px-4 py-4 rounded-2xl border border-gray-200 text-base text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent bg-gray-50 focus:bg-white transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 px-1">{error}</p>
            )}
          </div>

          {/* フッター */}
          <div className="mt-6 mb-2 flex flex-col gap-2">
            <button
              onClick={handleSave}
              className="w-full py-4 rounded-2xl bg-indigo-500 text-white text-base font-semibold active:scale-[0.98] transition-all"
            >
              保存する
            </button>
            {existing && !existing.sent && (
              <button
                onClick={() => { onDelete(); onClose() }}
                className="w-full py-3 text-sm text-gray-400 active:text-red-400 transition-colors"
              >
                通知を解除する
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5v2.25L2 9.75v.75h12v-.75l-1.5-1.5V6A4.5 4.5 0 0 0 8 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 10.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 5L5 13M5 5l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
