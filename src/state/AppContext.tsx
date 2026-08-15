import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AnswerLog, AppState, MockResult, Profile } from '../types'
import { ACHIEVEMENTS } from '../data/achievements'
import { calcLevel, calcStreak, load, save, todayKey } from '../lib/util'

interface Ctx {
  state: AppState
  streak: number
  level: ReturnType<typeof calcLevel>
  todayRecord: { answered: number; correct: number; seconds: number }
  newBadges: string[]
  clearNewBadges: () => void
  recordAnswer: (log: AnswerLog) => void
  addStudySeconds: (sec: number) => void
  recordMock: (result: MockResult) => void
  updateProfile: (p: Partial<Profile>) => void
  toggleFavorite: (termId: string) => void
  resetAll: () => void
}

const AppCtx = createContext<Ctx | null>(null)

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AppState>(() => load())
  const [newBadges, setNewBadges] = useState<string[]>([])
  const first = useRef(true)

  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    save(state)
  }, [state])

  // 実績の判定は状態が変わるたびに行い、新規解放だけを通知する
  useEffect(() => {
    const unlocked = ACHIEVEMENTS.filter((a) => a.check(state)).map((a) => a.id)
    const fresh = unlocked.filter((id) => !state.unlocked.includes(id))
    if (fresh.length > 0) {
      setNewBadges((b) => [...b, ...fresh])
      setState((s) => ({ ...s, unlocked: [...s.unlocked, ...fresh] }))
    }
  }, [state.logs.length, state.mocks.length, state.days])

  const touchDay = (s: AppState, patch: { answered?: number; correct?: number; seconds?: number }) => {
    const key = todayKey()
    const cur = s.days[key] ?? { date: key, answered: 0, correct: 0, seconds: 0 }
    return {
      ...s.days,
      [key]: {
        date: key,
        answered: cur.answered + (patch.answered ?? 0),
        correct: cur.correct + (patch.correct ?? 0),
        seconds: cur.seconds + (patch.seconds ?? 0),
      },
    }
  }

  const value = useMemo<Ctx>(
    () => ({
      state,
      streak: calcStreak(state.days),
      level: calcLevel(state.logs),
      todayRecord: state.days[todayKey()] ?? { answered: 0, correct: 0, seconds: 0 },
      newBadges,
      clearNewBadges: () => setNewBadges([]),
      recordAnswer: (log) =>
        setState((s) => ({
          ...s,
          logs: [...s.logs, log],
          days: touchDay(s, { answered: 1, correct: log.correct ? 1 : 0, seconds: log.seconds }),
        })),
      addStudySeconds: (sec) => setState((s) => ({ ...s, days: touchDay(s, { seconds: sec }) })),
      recordMock: (result) => setState((s) => ({ ...s, mocks: [...s.mocks, result] })),
      updateProfile: (p) => setState((s) => ({ ...s, profile: { ...s.profile, ...p } })),
      toggleFavorite: (id) =>
        setState((s) => ({
          ...s,
          favorites: s.favorites.includes(id) ? s.favorites.filter((f) => f !== id) : [...s.favorites, id],
        })),
      resetAll: () => {
        localStorage.removeItem('itp2027:v1')
        location.reload()
      },
    }),
    [state, newBadges],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('AppProvider の内側で useApp を呼び出してください')
  return ctx
}
