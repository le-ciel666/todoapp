import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'メール通知機能は現在無効です' }, { status: 503 })
}
