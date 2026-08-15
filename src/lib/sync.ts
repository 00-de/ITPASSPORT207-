import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { AppState, DayRecord } from '../types'
import { defaultState } from './util'

/** 1件のドキュメントに収める上限。古い解答ログから切り捨てる */
const MAX_LOGS = 4000

export const trimState = (s: AppState): AppState => ({
  ...s,
  logs: s.logs.slice(-MAX_LOGS),
})

/**
 * 端末ごとに進んだ記録を突き合わせる。
 * 解答ログ・模試・実績・お気に入りは和集合、日別記録は多いほうを採用する。
 */
export const mergeState = (a: AppState, b: AppState): AppState => {
  const logKey = (l: { qid: string; at: number }) => `${l.qid}@${l.at}`
  const logs = [...a.logs, ...b.logs]
  const seen = new Set<string>()
  const mergedLogs = logs
    .filter((l) => {
      const k = logKey(l)
      if (seen.has(k)) return false
      seen.add(k)
      return true
    })
    .sort((x, y) => x.at - y.at)

  const days: Record<string, DayRecord> = { ...a.days }
  for (const [k, d] of Object.entries(b.days)) {
    const cur = days[k]
    days[k] = cur
      ? {
          date: k,
          answered: Math.max(cur.answered, d.answered),
          correct: Math.max(cur.correct, d.correct),
          seconds: Math.max(cur.seconds, d.seconds),
        }
      : d
  }

  const mocks = [...a.mocks, ...b.mocks]
    .filter((m, i, arr) => arr.findIndex((x) => x.at === m.at) === i)
    .sort((x, y) => x.at - y.at)

  // プロフィールは入力済みの値を優先する
  const profile = {
    name: a.profile.name || b.profile.name,
    examDate: a.profile.examDate || b.profile.examDate,
    startDate: [a.profile.startDate, b.profile.startDate].filter(Boolean).sort()[0] ?? a.profile.startDate,
    dailyGoal: a.profile.dailyGoal || b.profile.dailyGoal || 10,
  }

  return {
    profile,
    logs: mergedLogs,
    days,
    mocks,
    unlocked: [...new Set([...a.unlocked, ...b.unlocked])],
    favorites: [...new Set([...a.favorites, ...b.favorites])],
  }
}

export const fetchRemote = async (uid: string): Promise<AppState | null> => {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  const data = snap.data() as Partial<AppState>
  return { ...defaultState(), ...data }
}

export const pushRemote = async (uid: string, state: AppState) => {
  if (!db) return
  const s = trimState(state)
  await setDoc(
    doc(db, 'users', uid),
    {
      profile: s.profile,
      logs: s.logs,
      days: s.days,
      mocks: s.mocks,
      unlocked: s.unlocked,
      favorites: s.favorites,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
