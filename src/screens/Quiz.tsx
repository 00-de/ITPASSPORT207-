import { useMemo, useRef, useState } from 'react'
import type { Question } from '../types'
import { QUESTIONS } from '../data/questions'
import { useApp } from '../state/AppContext'
import { Bar, CategoryTag } from '../components/ui'
import { shuffle } from '../lib/util'
import { askTeacher, questionToPrompt } from '../lib/ai'

interface Props {
  title: string
  questions: Question[]
  onExit: () => void
}

export default function Quiz({ title, questions, onExit }: Props) {
  const { recordAnswer } = useApp()
  const [queue, setQueue] = useState<Question[]>(questions)
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [results, setResults] = useState<{ q: Question; correct: boolean }[]>([])
  const [aiText, setAiText] = useState('')
  const [aiBusy, setAiBusy] = useState(false)
  const [aiError, setAiError] = useState('')
  const startedAt = useRef(Date.now())

  const q = queue[index]
  const finished = index >= queue.length

  const similar = useMemo(
    () => (q ? QUESTIONS.filter((x) => x.field === q.field && x.id !== q.id) : []),
    [q?.id],
  )

  if (queue.length === 0) {
    return (
      <div className="card p-8 text-center">
        <p className="font-display font-bold">出題できる問題がありません</p>
        <p className="text-sm text-slate1 mt-1">条件を変えるか、まずは今日の10問から始めましょう。</p>
        <button className="btn-primary mt-5 w-full" onClick={onExit}>
          ホームに戻る
        </button>
      </div>
    )
  }

  if (finished) {
    const correct = results.filter((r) => r.correct).length
    const rate = Math.round((correct / results.length) * 100)
    const wrong = results.filter((r) => !r.correct)
    return (
      <div className="space-y-4 animate-slideup">
        <div className="card p-6 text-center">
          <div className="eyebrow">RESULT</div>
          <p className="font-display font-black text-3xl mt-1">
            {correct}
            <span className="text-base font-bold text-slate1"> / {results.length} 問正解</span>
          </p>
          <div className="mt-4">
            <Bar value={rate} color={rate >= 60 ? '#0E9E6E' : '#E08A00'} height={10} />
          </div>
          <p className="text-sm text-slate1 mt-2">正解率 {rate}%</p>
        </div>

        {wrong.length > 0 && (
          <div className="card p-5">
            <p className="font-display font-bold mb-3">間違えた問題（{wrong.length}問）</p>
            <ul className="space-y-3">
              {wrong.map(({ q: wq }) => (
                <li key={wq.id} className="border-l-2 border-seal pl-3">
                  <p className="text-sm font-medium">{wq.question}</p>
                  <p className="text-sm text-leaf mt-1">正解：{wq.choices[wq.answer]}</p>
                  <p className="text-xs text-slate1 mt-1 leading-relaxed">{wq.explanation}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            className="btn-ghost"
            onClick={() => {
              setQueue(shuffle(questions))
              setIndex(0)
              setPicked(null)
              setResults([])
              startedAt.current = Date.now()
            }}
          >
            もう一度解く
          </button>
          <button className="btn-primary" onClick={onExit}>
            ホームに戻る
          </button>
        </div>
      </div>
    )
  }

  const answered = picked !== null
  const isCorrect = picked === q.answer

  const choose = (i: number) => {
    if (answered) return
    setPicked(i)
    const seconds = Math.min(300, Math.round((Date.now() - startedAt.current) / 1000))
    const correct = i === q.answer
    recordAnswer({ qid: q.id, category: q.category, field: q.field, correct, at: Date.now(), seconds })
    setResults((r) => [...r, { q, correct }])
  }

  const next = () => {
    setPicked(null)
    setAiText('')
    setAiError('')
    setIndex((i) => i + 1)
    startedAt.current = Date.now()
  }

  const askSimpler = async () => {
    setAiBusy(true)
    setAiError('')
    try {
      const r = await askTeacher(
        `${questionToPrompt(q)}\n\nこの問題について、ITが苦手な人にも分かるよう、もっと簡単に説明してください。`,
      )
      setAiText(r.text)
    } catch (e) {
      setAiError((e as Error).message)
    } finally {
      setAiBusy(false)
    }
  }

  const addSimilar = () => {
    const pick = shuffle(similar)[0]
    if (!pick) return
    setQueue((qs) => [...qs.slice(0, index + 1), pick, ...qs.slice(index + 1)])
    next()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button className="text-slate1 text-sm font-display" onClick={onExit}>
          ← 中断
        </button>
        <div className="flex-1">
          <Bar value={((index + (answered ? 1 : 0)) / queue.length) * 100} />
        </div>
        <span className="font-num text-sm text-slate1">
          {index + 1}/{queue.length}
        </span>
      </div>

      <div className="card p-5 animate-pop">
        <div className="flex items-center justify-between mb-3">
          <CategoryTag category={q.category} />
          <span className="eyebrow">{q.field}・難易度 {'★'.repeat(q.difficulty)}</span>
        </div>
        <p className="font-display font-bold text-[17px] leading-relaxed">{q.question}</p>

        <div className="mt-4 space-y-2">
          {q.choices.map((c, i) => {
            const state = !answered
              ? 'idle'
              : i === q.answer
                ? 'correct'
                : i === picked
                  ? 'wrong'
                  : 'dim'
            const cls =
              state === 'correct'
                ? 'border-leaf bg-leaf/[.07]'
                : state === 'wrong'
                  ? 'border-seal bg-seal/[.07]'
                  : state === 'dim'
                    ? 'border-line1 opacity-50'
                    : 'border-line1 hover:border-ink/40'
            return (
              <button
                key={i}
                onClick={() => choose(i)}
                disabled={answered}
                className={`w-full text-left rounded-xl border-2 px-4 py-3 flex gap-3 items-start transition ${cls}`}
              >
                <span className="font-num font-bold text-slate1 mt-[1px]">{'ABCD'[i]}</span>
                <span className="text-[15px] leading-relaxed">{c}</span>
              </button>
            )
          })}
        </div>
      </div>

      {answered && (
        <div className="card p-5 animate-slideup">
          <p className={`font-display font-black text-xl ${isCorrect ? 'text-leaf' : 'text-seal'}`}>
            {isCorrect ? '正解！' : '不正解'}
          </p>
          {!isCorrect && <p className="text-sm mt-1">正解は {'ABCD'[q.answer]}：{q.choices[q.answer]}</p>}
          <p className="eyebrow mt-4">解説</p>
          <p className="text-[15px] leading-relaxed mt-1">{q.explanation}</p>

          {aiText && (
            <div className="mt-4 rounded-xl bg-ai/[.05] border border-ai/20 p-4 animate-slideup">
              <p className="eyebrow text-ai">AI先生のやさしい説明</p>
              <p className="text-[15px] leading-relaxed mt-1 whitespace-pre-wrap">{aiText}</p>
            </div>
          )}
          {aiError && <p className="text-sm text-seal mt-3">{aiError}</p>}

          <button className="btn-ghost w-full mt-4" onClick={askSimpler} disabled={aiBusy || Boolean(aiText)}>
            {aiBusy ? 'AI先生が考えています…' : 'もっと簡単に説明して'}
          </button>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button className="btn-ghost" onClick={addSimilar} disabled={similar.length === 0}>
              類似問題に挑戦
            </button>
            <button className="btn-primary" onClick={next}>
              {index + 1 === queue.length ? '結果を見る' : '次の問題へ'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
