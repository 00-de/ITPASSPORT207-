import type { AppState, AnswerLog, Category } from '../types'

export const STORAGE_KEY = 'itp2027:v1'

export const todayKey = (d: Date = new Date()) => {
  const z = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`
}

export const addDays = (key: string, n: number) => {
  const d = new Date(key + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return todayKey(d)
}

export const daysUntil = (dateStr: string) => {
  if (!dateStr) return null
  const target = new Date(dateStr + 'T00:00:00').getTime()
  const now = new Date(todayKey() + 'T00:00:00').getTime()
  return Math.round((target - now) / 86400000)
}

export const defaultState = (): AppState => ({
  profile: { name: '', examDate: '', startDate: todayKey(), dailyGoal: 10 },
  logs: [],
  days: {},
  mocks: [],
  unlocked: [],
  favorites: [],
})

export const load = (): AppState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()
    return { ...defaultState(), ...(JSON.parse(raw) as AppState) }
  } catch {
    return defaultState()
  }
}

export const save = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* 保存できない環境では無視する */
  }
}

/** 連続学習日数（今日まだ学習していない場合は昨日までの連続を維持） */
export const calcStreak = (days: AppState['days']) => {
  let cursor = todayKey()
  if (!days[cursor] || days[cursor].answered === 0) cursor = addDays(cursor, -1)
  let streak = 0
  while (days[cursor] && days[cursor].answered > 0) {
    streak += 1
    cursor = addDays(cursor, -1)
  }
  return streak
}

export const accuracy = (logs: AnswerLog[]) =>
  logs.length === 0 ? 0 : Math.round((logs.filter((l) => l.correct).length / logs.length) * 100)

export const LEVELS: { lv: number; title: string; xp: number }[] = [
  { lv: 1, title: 'IT初心者', xp: 0 },
  { lv: 5, title: 'IT学習者', xp: 300 },
  { lv: 10, title: 'ITチャレンジャー', xp: 900 },
  { lv: 20, title: 'ITマスター', xp: 2400 },
  { lv: 30, title: 'ITパスポート合格者', xp: 5000 },
]

/** 正解10XP・不正解4XPを基準に、レベルと次レベルまでの進捗を返す */
export const calcLevel = (logs: AnswerLog[]) => {
  const xp = logs.reduce((s, l) => s + (l.correct ? 10 : 4), 0)
  const lv = Math.max(1, Math.floor(Math.sqrt(xp / 6)) + 1)
  const title = [...LEVELS].reverse().find((t) => lv >= t.lv)?.title ?? 'IT初心者'
  const cur = 6 * Math.pow(lv - 1, 2)
  const next = 6 * Math.pow(lv, 2)
  return { xp, lv, title, ratio: Math.min(1, (xp - cur) / (next - cur)), toNext: Math.max(0, next - xp) }
}

/** 分野ごとの正解率（試行回数つき）を弱い順に返す */
export const weakRanking = (logs: AnswerLog[]) => {
  const map = new Map<string, { field: string; category: Category; total: number; correct: number }>()
  for (const l of logs) {
    const e = map.get(l.field) ?? { field: l.field, category: l.category, total: 0, correct: 0 }
    e.total += 1
    if (l.correct) e.correct += 1
    map.set(l.field, e)
  }
  return [...map.values()]
    .map((e) => ({ ...e, rate: Math.round((e.correct / e.total) * 100) }))
    .sort((a, b) => a.rate - b.rate || b.total - a.total)
}

export const formatTime = (sec: number) => {
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  if (h > 0) return `${h}時間${m}分`
  if (m > 0) return `${m}分`
  return `${Math.floor(sec)}秒`
}

export const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
