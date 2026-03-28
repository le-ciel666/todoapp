import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { taskText, email, scheduledAt } = await req.json()

  if (!email || !taskText) {
    return NextResponse.json({ error: 'email and taskText are required' }, { status: 400 })
  }

  const date = new Date(scheduledAt).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const { error } = await resend.emails.send({
    from: 'ToDo通知 <onboarding@resend.dev>',
    to: email,
    subject: `【ToDo通知】${taskText}`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f8f7f4;">
        <div style="background: white; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
            <div style="width: 8px; height: 8px; border-radius: 50%; background: #6366f1;"></div>
            <span style="font-size: 11px; font-weight: 600; color: #6366f1; letter-spacing: 0.1em; text-transform: uppercase;">My Tasks</span>
          </div>
          <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0 0 24px;">ToDo リマインダー</h1>
          <div style="background: #f0f0ff; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="font-size: 18px; font-weight: 600; color: #3730a3; margin: 0;">${taskText}</p>
          </div>
          <p style="font-size: 13px; color: #6b7280; margin: 0;">
            設定した通知日時: <strong style="color: #374151;">${date}</strong>
          </p>
        </div>
        <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 20px;">
          このメールはToDo管理アプリから自動送信されました
        </p>
      </div>
    `,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
