import { useEffect, useRef, useState } from 'react'
import { askTeacher, generateSimilar } from '../lib/ai'
import type { GeneratedQuestion } from '../lib/ai'
import { QUESTIONS } from '../data/questions'
import { useApp } from '../state/AppContext'
import { SectionTitle } from '../components/ui'
import { shuffle, weakRanking } from '../lib/util'

interface Msg {
  role: 'user' | 'ai'
  text: string
  provider?: string
}

const QUICK = [
  'ネットワークが苦手です。まず何から覚えればいいですか？',
  '公開鍵暗号方式をもう少し簡単に説明して',
  '正規化とは何か、身近なたとえで教えて',
  '試験前日にやるべきことを教えて',
]

export default function Teacher() {
  const { state } = useApp()
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [gen, setGen] = useState<GeneratedQuestion | null>(null)
  const [genPicked, setGenPicked] = useState<number | null>(null)
  const bottom = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs, busy])

  const send = async (text: string) => {
    if (!text.trim() || busy) return
    setError('')
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setBusy(true)
    try {
      const weak = weakRanking(state.logs).slice(0, 3)
      const context =
        weak.length > 0
          ? `（参考：この学習者の苦手分野は ${weak.map((w) => `${w.field}${w.rate}%`).join('、')} です）\n\n`
          : ''
      const r = await askTeacher(context + text)
      setMsgs((m) => [...m, { role: 'ai', text: r.text, provider: r.provider }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const makeQuestion = async () => {
    if (busy) return
    setError('')
    setBusy(true)
    setGen(null)
    setGenPicked(null)
    try {
      const weak = weakRanking(state.logs)[0]?.field
      const base = shuffle(weak ? QUESTIONS.filter((q) => q.field === weak) : QUESTIONS)[0] ?? QUESTIONS[0]
      setGen(await generateSimilar(base))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="eyebrow">AI TEACHER</div>
        <h2 className="font-display font-black text-xl mt-1">AI先生に質問する</h2>
        <p className="text-sm text-slate1 mt-2 leading-relaxed">
          分からないところを、そのまま日本語で聞いてください。あなたの苦手分野をふまえて答えます。
        </p>
      </div>

      {msgs.length === 0 && !gen && (
        <div className="space-y-2">
          <p className="eyebrow px-1">よくある質問</p>
          {QUICK.map((q) => (
            <button key={q} className="card w-full text-left p-4 text-sm" onClick={() => send(q)} disabled={busy}>
              {q}
            </button>
          ))}
        </div>
      )}

      {msgs.map((m, i) => (
        <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
          <div
            className={`max-w-[92%] rounded-2xl px-4 py-3 ${
              m.role === 'user' ? 'bg-ink text-white' : 'card'
            }`}
          >
            <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
            {m.provider && <p className="eyebrow mt-2 text-slate1/60">{m.provider === 'groq' ? 'GROQ' : 'CHATGPT'}</p>}
          </div>
        </div>
      ))}

      {busy && (
        <div className="card p-4">
          <p className="text-sm text-slate1">AI先生が考えています…</p>
        </div>
      )}

      {error && (
        <div className="card p-4 border-seal/40">
          <p className="text-sm text-seal leading-relaxed">{error}</p>
        </div>
      )}

      {gen && (
        <div className="card p-5 animate-slideup">
          <SectionTitle eyebrow="AI QUESTION" title="AI先生が作った問題" />
          <p className="font-display font-bold text-[16px] leading-relaxed">{gen.question}</p>
          <div className="mt-4 space-y-2">
            {gen.choices.map((c, i) => {
              const answered = genPicked !== null
              const cls = !answered
                ? 'border-line1 hover:border-ink/40'
                : i === gen.answer
                  ? 'border-leaf bg-leaf/[.07]'
                  : i === genPicked
                    ? 'border-seal bg-seal/[.07]'
                    : 'border-line1 opacity-50'
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => setGenPicked(i)}
                  className={`w-full text-left rounded-xl border-2 px-4 py-3 flex gap-3 ${cls}`}
                >
                  <span className="font-num font-bold text-slate1">{'ABCD'[i]}</span>
                  <span className="text-[15px] leading-relaxed">{c}</span>
                </button>
              )
            })}
          </div>
          {genPicked !== null && (
            <div className="mt-4">
              <p className={`font-display font-black ${genPicked === gen.answer ? 'text-leaf' : 'text-seal'}`}>
                {genPicked === gen.answer ? '正解！' : `不正解（正解は ${'ABCD'[gen.answer]}）`}
              </p>
              <p className="text-[15px] leading-relaxed mt-2">{gen.explanation}</p>
              <p className="text-xs text-slate1 mt-3">
                AIが作った問題です。学習記録には加算されません。内容に不安があるときは、公式シラバスで確認してください。
              </p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-2">
        <button className="btn-ghost" onClick={makeQuestion} disabled={busy}>
          苦手分野から1問つくってもらう
        </button>
      </div>

      <div className="sticky bottom-24 card p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) send(input)
          }}
          placeholder="質問を入力"
          className="flex-1 rounded-xl border border-line1 px-4 py-3 text-[15px] focus:border-ai"
        />
        <button className="btn-primary px-5" onClick={() => send(input)} disabled={busy || !input.trim()}>
          送信
        </button>
      </div>
      <div ref={bottom} />
    </div>
  )
}
