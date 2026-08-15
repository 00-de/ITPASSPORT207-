export type Category = 'strategy' | 'management' | 'technology'

export const CATEGORY_LABEL: Record<Category, string> = {
  strategy: 'ストラテジ系',
  management: 'マネジメント系',
  technology: 'テクノロジ系',
}

export const CATEGORY_COLOR: Record<Category, string> = {
  strategy: '#D6362F',
  management: '#E08A00',
  technology: '#1F4FD8',
}

export interface Question {
  id: string
  category: Category
  field: string
  difficulty: 1 | 2 | 3
  question: string
  choices: string[]
  answer: number // 0-based
  explanation: string
}

export interface Term {
  id: string
  term: string
  reading?: string
  category: Category
  field: string
  meaning: string
}

export interface AnswerLog {
  qid: string
  category: Category
  field: string
  correct: boolean
  at: number // epoch ms
  seconds: number
}

export interface DayRecord {
  date: string // YYYY-MM-DD
  answered: number
  correct: number
  seconds: number
}

export interface MockResult {
  at: number
  total: number
  scores: Record<Category, number> // 0-1000 換算
  overall: number
  passed: boolean
  answered: number
  correct: number
}

export interface Profile {
  name: string
  examDate: string // YYYY-MM-DD
  startDate: string
  dailyGoal: number
}

export interface AppState {
  profile: Profile
  logs: AnswerLog[]
  days: Record<string, DayRecord>
  mocks: MockResult[]
  unlocked: string[] // achievement ids
  favorites: string[] // term ids
}
