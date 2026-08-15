import { auth } from './firebase'
import type { Question } from '../types'

export type Provider = 'auto' | 'groq' | 'openai'
export const PROVIDER_KEY = 'itp2027:aiProvider'

export const getPreferredProvider = (): Provider => {
  const v = localStorage.getItem(PROVIDER_KEY)
  return v === 'groq' || v === 'openai' ? v : 'auto'
}

export const setPreferredProvider = (p: Provider) => localStorage.setItem(PROVIDER_KEY, p)

export interface AiReply {
  text: string
  provider: 'groq' | 'openai'
}

const request = async (mode: 'chat' | 'similar', prompt: string): Promise<AiReply> => {
  const idToken = auth?.currentUser ? await auth.currentUser.getIdToken() : undefined
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, prompt, prefer: getPreferredProvider(), idToken }),
  })
  const data = await res.json().catch(() => ({}) as Record<string, unknown>)
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'AI先生に接続できませんでした')
  return { text: (data as { text: string }).text, provider: (data as { provider: 'groq' | 'openai' }).provider }
}

export const askTeacher = (prompt: string) => request('chat', prompt)

/** 問題文と選択肢を、AIに渡す形へ整える */
export const questionToPrompt = (q: Question) =>
  `【分野】${q.field}\n【問題】${q.question}\n【選択肢】${q.choices.map((c, i) => `${'ABCD'[i]}. ${c}`).join(' / ')}\n【正解】${'ABCD'[q.answer]}\n【解説】${q.explanation}`

export interface GeneratedQuestion {
  question: string
  choices: string[]
  answer: number
  explanation: string
}

export const generateSimilar = async (q: Question): Promise<GeneratedQuestion> => {
  const { text } = await request('similar', `${questionToPrompt(q)}\n\nこの問題と同じ分野・同じ難易度の4択問題を1問作ってください。`)
  const cleaned = text.replace(/```json|```/g, '').trim()
  const parsed = JSON.parse(cleaned) as GeneratedQuestion
  if (
    typeof parsed.question !== 'string' ||
    !Array.isArray(parsed.choices) ||
    parsed.choices.length !== 4 ||
    typeof parsed.answer !== 'number' ||
    parsed.answer < 0 ||
    parsed.answer > 3
  ) {
    throw new Error('問題の形式が正しくありませんでした。もう一度お試しください')
  }
  return parsed
}
