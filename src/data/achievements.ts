import type { AppState } from '../types'
import { calcStreak } from '../lib/util'

export interface Achievement {
  id: string
  title: string
  description: string
  check: (s: AppState) => boolean
}

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', title: 'はじめの一歩', description: '最初の1問に解答する', check: (s) => s.logs.length >= 1 },
  { id: 'q100', title: '100問達成', description: '累計100問に解答する', check: (s) => s.logs.length >= 100 },
  { id: 'q500', title: '500問達成', description: '累計500問に解答する', check: (s) => s.logs.length >= 500 },
  { id: 'q1000', title: '1,000問達成', description: '累計1,000問に解答する', check: (s) => s.logs.length >= 1000 },
  { id: 'streak7', title: '7日連続学習', description: '7日続けて学習する', check: (s) => calcStreak(s.days) >= 7 },
  { id: 'streak30', title: '30日連続学習', description: '30日続けて学習する', check: (s) => calcStreak(s.days) >= 30 },
  {
    id: 'acc80',
    title: '正解率80%',
    description: '累計50問以上で正解率80%を超える',
    check: (s) =>
      s.logs.length >= 50 && s.logs.filter((l) => l.correct).length / s.logs.length >= 0.8,
  },
  {
    id: 'mockpass',
    title: '模擬試験に合格',
    description: '模擬試験で合格基準を満たす',
    check: (s) => s.mocks.some((m) => m.passed),
  },
  {
    id: 'mockpass3',
    title: '安定の合格ライン',
    description: '模擬試験に3回合格する',
    check: (s) => s.mocks.filter((m) => m.passed).length >= 3,
  },
  {
    id: 'time10h',
    title: '学習時間10時間',
    description: '累計10時間学習する',
    check: (s) => Object.values(s.days).reduce((a, d) => a + d.seconds, 0) >= 36000,
  },
]
