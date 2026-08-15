import type { Category, Question } from '../../types'
import { PACK_BASE } from './pack-base'
import { PACK_TECH_01 } from './pack-tech-01'

/**
 * 問題パックの一覧。
 * 問題を追加するときは、新しいパックのファイルを置き、
 * import 行と下の配列に1行ずつ足すだけで反映されます。
 */
const PACKS: Question[][] = [
  PACK_BASE,
  PACK_TECH_01,
]

/** 同じidが重複した場合は、後のパックの内容で上書きする */
const dedupe = (list: Question[]): Question[] => {
  const map = new Map<string, Question>()
  for (const q of list) map.set(q.id, q)
  return [...map.values()]
}

export const QUESTIONS: Question[] = dedupe(PACKS.flat())

export const QUESTIONS_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]))

/** 分野ごとの収録数（設定画面などの表示用） */
export const countByCategory = (): Record<Category, number> =>
  QUESTIONS.reduce(
    (acc, q) => ({ ...acc, [q.category]: (acc[q.category] ?? 0) + 1 }),
    { strategy: 0, management: 0, technology: 0 } as Record<Category, number>,
  )
