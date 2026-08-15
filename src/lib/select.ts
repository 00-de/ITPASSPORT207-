import { QUESTIONS } from '../data/questions'
import type { AnswerLog, Category, Question } from '../types'
import { shuffle, weakRanking } from './util'

/** 未出題を優先し、次に誤答した問題、最後に既出題を混ぜて出題順を作る */
export const pickDaily = (logs: AnswerLog[], count = 10): Question[] => {
  const seen = new Set(logs.map((l) => l.qid))
  const wrongIds = new Set(
    logs.filter((l) => !l.correct).map((l) => l.qid),
  )
  const fresh = shuffle(QUESTIONS.filter((q) => !seen.has(q.id)))
  const wrong = shuffle(QUESTIONS.filter((q) => wrongIds.has(q.id)))
  const rest = shuffle(QUESTIONS.filter((q) => seen.has(q.id) && !wrongIds.has(q.id)))
  const merged = [...fresh, ...wrong, ...rest]
  const out: Question[] = []
  for (const q of merged) {
    if (out.length >= count) break
    if (!out.find((x) => x.id === q.id)) out.push(q)
  }
  return out
}

/** 正解率の低い分野から優先的に出題する */
export const pickWeak = (logs: AnswerLog[], count = 10): Question[] => {
  const ranking = weakRanking(logs).filter((w) => w.rate < 100)
  if (ranking.length === 0) return pickDaily(logs, count)
  const out: Question[] = []
  for (const w of ranking) {
    for (const q of shuffle(QUESTIONS.filter((q) => q.field === w.field))) {
      if (out.length >= count) return out
      if (!out.find((x) => x.id === q.id)) out.push(q)
    }
  }
  if (out.length < count) {
    for (const q of pickDaily(logs, count)) {
      if (out.length >= count) break
      if (!out.find((x) => x.id === q.id)) out.push(q)
    }
  }
  return out
}

export const pickByCategory = (category: Category, count = 10): Question[] =>
  shuffle(QUESTIONS.filter((q) => q.category === category)).slice(0, count)
