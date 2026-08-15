import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { AnswerLog, AppState, MockResult, Profile } from '../types'
import { ACHIEVEMENTS } from '../data/achievements'
import { calcLevel, calcStreak, load, save, todayKey } from '../lib/util'
import { fetchRemote, mergeState, pushRemote } from '../lib/sync'
import { useAuth } from './AuthContext'

export type SyncStatus = 'off' | 'syncing' | 'synced' | 'error'

interface Ctx {
  state: AppState
  streak: number
  level: ReturnType<typeof calcLevel>
  todayRecord: { answered: number; correct: number; seconds: number }
  newBadges: string[]
  syncStatus: SyncStatus
  lastSyncedAt: number | null
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
  const { user, enabled } = useAuth()
  const [state, setState] = useState<AppState>(() => load())
  const [newBadges, setNewBadges] = useState<string[]>([])
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('off')
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null)
  const first = useRef(true)
  const pushTimer = useRef<number | null>(null)
  const mergedFor = useRef<string | null>(null)

  // 端末内には常に保存する。通信できない場面でも学習を止めないため
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    save(state)
  }, [state])

  // ログイン時：クラウドの記録を取り込み、端末の記録と突き合わせる
  useEffect(() => {
    if (!enabled || !user) {
      setSyncStatus('off')
      if (!user) mergedFor.current = null
      return
    }
    if (mergedFor.current === user.uid) return
    mergedFor.current = user.uid
    let alive = true
    ;(async () => {
      setSyncStatus('syncing')
      try {
        const remote = await fetchRemote(user.uid)
        if (!alive) return
        setState((local) => {
          const merged = remote ? mergeState(local, remote) : local
          if (!merged.profile.name && user.displayName) merged.profile.name = user.displayName
          void pushRemote(user.uid, merged)
          return merged
        })
        setLastSyncedAt(Date.now())
        setSyncStatus('synced')
      } catch {
        if (alive) setSyncStatus('error')
      }
    })()
    return () => {
      alive = false
    }
  }, [user?.uid, enabled])

  // 学習内容が変わったら、少し待ってからまとめて書き込む
  useEffect(() => {
    if (!enabled || !user || mergedFor.current !== user.uid) return
    if (pushTimer.current) window.clearTimeout(pushTimer.current)
    pushTimer.current = window.setTimeout(async () => {
      setSyncStatus('syncing')
      try {
        await pushRemote(user.uid, state)
        setLastSyncedAt(Date.now())
        setSyncStatus('synced')
      } catch {
        setSyncStatus('error')
      }
    }, 2500)
    return () => {
      if (pushTimer.current) window.clearTimeout(pushTimer.current)
    }
  }, [state, user?.uid, enabled])

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
      syncStatus,
      lastSyncedAt,
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
    [state, newBadges, syncStatus, lastSyncedAt],
  )

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export const useApp = () => {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('AppProvider の内側で useApp を呼び出してください')
  return ctx
}
