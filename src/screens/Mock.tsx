import { useEffect, useMemo, useState } from 'react'
import type { Category, MockResult, Question } from '../types'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../types'
import { QUESTIONS } from '../data/questions'
import { useApp } from '../state/AppContext'
import { Bar, CategoryTag } from '../components/ui'
import { shuffle } from '../lib/util'

const CATS: Category[] = ['strategy', 'management', 'technology']

export default function Mock({ onExit }: { onExit: () => void }) {
  const { recordAnswer, recordMock } = useApp()
  const [started, setStarted] = useState(false)
  const [paper] = useState<Question[]>(() => shuffle(QUESTIONS).slice(0, 100))
  const [answers, setAnswers] = useState<(number | null)[]>(() => paper.map(() => null))
  const [i, setI] = useState(0)
  const [result, setResult] = useState<MockResult | null>(null)

  // 本試験は100問120分。問題数に比例させて持ち時間を決める
  const limitSec = Math.max(1200, Math.round((120 * 60 * paper.length) / 100))
  const [left, setLeft] = useState(limitSec)

  useEffect(() => {
    if (!started || result) return
    const t = setInterval(() => setLeft((s) => s - 1), 1000)
    return () => clearInterval(t)
  }, [started, result])

  useEffect(() => {
    if (started && !result && left <= 0) grade()
  }, [left, started, result])

  const unanswered = answers.filter((a) => a === null).length

  const grade = () => {
    const per: Record<Category, { total: number; correct: number }> = {
      strategy: { total: 0, correct: 0 },
      management: { total: 0, correct: 0 },
      technology: { total: 0, correct: 0 },
    }
    let correct = 0
    const spent = Math.round((limitSec - Math.max(0, left)) / Math.max(1, paper.length))
    paper.forEach((q, idx) => {
      const ok = answers[idx] === q.answer
      per[q.category].total += 1
      if (ok) {
        per[q.category].correct += 1
        correct += 1
      }
      recordAnswer({ qid: q.id, category: q.category, field: q.field, correct: ok, at: Date.now(), seconds: spent })
    })
    const scores = CATS.reduce(
      (acc, c) => ({ ...acc, [c]: per[c].total ? Math.round((per[c].correct / per[c].total) * 1000) : 0 }),
      {} as Record<Category, number>,
    )
    const overall = Math.round((correct / paper.length) * 1000)
    const present = CATS.filter((c) => per[c].total > 0)
    const passed = overall >= 600 && present.every((c) => scores[c] >= 300)
    const r: MockResult = { at: Date.now(), total: paper.length, scores, overall, passed, answered: paper.length - unanswered, correct }
    setResult(r)
    recordMock(r)
  }

  const mmss = useMemo(() => {
    const s = Math.max(0, left)
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  }, [left])

  if (result) {
    return (
      <div className="space-y-4 animate-slideup">
        <div className="card p-6 text-center">
          <div className="eyebrow">MOCK EXAM RESULT</div>
          <p className={`font-display font-black text-4xl mt-2 ${result.passed ? 'text-leaf' : 'text-seal'}`}>
            {result.passed ? '合格' : '不合格'}
          </p>
          <p className="font-num font-bold text-2xl mt-3">{result.overall} 点</p>
          <p className="text-xs text-slate1">総合1000点満点（合格基準：総合600点以上・各分野300点以上）</p>
        </div>

        <div className="card p-5 space-y-4">
          {CATS.map((c) => (
            <div key={c}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-display font-bold">{CATEGORY_LABEL[c]}</span>
                <span className="font-num">{result.scores[c]} 点</span>
              </div>
              <Bar value={result.scores[c] / 10} color={CATEGORY_COLOR[c]} />
            </div>
          ))}
          <p className="text-xs text-slate1">正解 {result.correct} / {result.total} 問</p>
        </div>

        <button className="btn-primary w-full" onClick={onExit}>
          ホームに戻る
        </button>
      </div>
    )
  }

  if (!started) {
    return (
      <div className="card p-6 space-y-4">
        <div>
          <div className="eyebrow">MOCK EXAM</div>
          <h2 className="font-display font-black text-2xl">模擬試験</h2>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-paper p-3">
            <dt className="eyebrow">問題数</dt>
            <dd className="font-num font-bold text-lg">{paper.length} 問</dd>
          </div>
          <div className="rounded-xl bg-paper p-3">
            <dt className="eyebrow">試験時間</dt>
            <dd className="font-num font-bold text-lg">{Math.round(limitSec / 60)} 分</dd>
          </div>
        </dl>
        <p className="text-sm text-slate1 leading-relaxed">
          途中で問題を行き来できます。時間切れになると、その時点の解答で自動採点します。
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button className="btn-ghost" onClick={onExit}>
            やめる
          </button>
          <button className="btn-primary" onClick={() => setStarted(true)}>
            試験を始める
          </button>
        </div>
      </div>
    )
  }

  const q = paper[i]
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="font-num text-sm text-slate1">{i + 1}/{paper.length}</span>
        <div className="flex-1">
          <Bar value={((i + 1) / paper.length) * 100} />
        </div>
        <span className={`font-num font-bold ${left < 300 ? 'text-seal' : ''}`}>{mmss}</span>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <CategoryTag category={q.category} />
          <span className="eyebrow">{q.field}</span>
        </div>
        <p className="font-display font-bold text-[17px] leading-relaxed">{q.question}</p>
        <div className="mt-4 space-y-2">
          {q.choices.map((c, ci) => (
            <button
              key={ci}
              onClick={() => setAnswers((a) => a.map((v, idx) => (idx === i ? ci : v)))}
              className={`w-full text-left rounded-xl border-2 px-4 py-3 flex gap-3 items-start transition ${
                answers[i] === ci ? 'border-ai bg-ai/[.06]' : 'border-line1 hover:border-ink/40'
              }`}
            >
              <span className="font-num font-bold text-slate1 mt-[1px]">{'ABCD'[ci]}</span>
              <span className="text-[15px] leading-relaxed">{c}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button className="btn-ghost" disabled={i === 0} onClick={() => setI((v) => v - 1)}>
          前へ
        </button>
        <button className="btn-ghost" disabled={i + 1 === paper.length} onClick={() => setI((v) => v + 1)}>
          次へ
        </button>
        <button className="btn-primary" onClick={grade}>
          採点する
        </button>
      </div>
      <p className="text-center text-xs text-slate1">未解答 {unanswered} 問</p>
    </div>
  )
}
