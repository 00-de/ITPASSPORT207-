import { useMemo } from 'react'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../types'
import type { Category } from '../types'
import { useApp } from '../state/AppContext'
import { ACHIEVEMENTS } from '../data/achievements'
import { Bar, Empty, SectionTitle, Stat } from '../components/ui'
import { accuracy, addDays, formatTime, todayKey, weakRanking } from '../lib/util'

const CATS: Category[] = ['strategy', 'management', 'technology']

export default function Records() {
  const { state, streak, level } = useApp()
  const logs = state.logs

  const last14 = useMemo(() => {
    const arr: { date: string; answered: number; correct: number }[] = []
    let k = addDays(todayKey(), -13)
    for (let i = 0; i < 14; i++) {
      const d = state.days[k]
      arr.push({ date: k, answered: d?.answered ?? 0, correct: d?.correct ?? 0 })
      k = addDays(k, 1)
    }
    return arr
  }, [state.days])

  const maxDay = Math.max(10, ...last14.map((d) => d.answered))
  const totalSeconds = Object.values(state.days).reduce((a, d) => a + d.seconds, 0)
  const weak = weakRanking(logs)

  const byCategory = CATS.map((c) => {
    const l = logs.filter((x) => x.category === c)
    return { c, total: l.length, rate: l.length ? Math.round((l.filter((x) => x.correct).length / l.length) * 100) : 0 }
  })

  if (logs.length === 0) {
    return <Empty title="まだ記録がありません" hint="今日の10問を解くと、ここに学習の軌跡が残ります。" />
  }

  return (
    <div className="space-y-6">
      <div className="card p-5 grid grid-cols-4 gap-3">
        <Stat label="TOTAL" value={logs.length} unit="問" />
        <Stat label="ACCURACY" value={accuracy(logs)} unit="%" />
        <Stat label="STREAK" value={streak} unit="日" />
        <Stat label="LEVEL" value={level.lv} />
      </div>

      <section>
        <SectionTitle eyebrow="LAST 14 DAYS" title="学習量の推移" right={<span className="text-xs text-slate1">累計 {formatTime(totalSeconds)}</span>} />
        <div className="card p-5">
          <div className="flex items-end gap-1.5 h-32">
            {last14.map((d) => (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col justify-end h-full">
                  <div
                    className="w-full rounded-t bg-line1"
                    style={{ height: `${(d.answered / maxDay) * 100}%`, minHeight: d.answered ? 4 : 0 }}
                  >
                    <div
                      className="w-full rounded-t bg-ai"
                      style={{ height: d.answered ? `${(d.correct / d.answered) * 100}%` : '0%' }}
                    />
                  </div>
                </div>
                <span className="font-num text-[9px] text-slate1">{d.date.slice(8)}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate1 mt-3">
            <span className="inline-block w-2 h-2 rounded-sm bg-ai align-middle mr-1" />正解
            <span className="inline-block w-2 h-2 rounded-sm bg-line1 align-middle ml-3 mr-1" />不正解
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="BY CATEGORY" title="分野別の正解率" />
        <div className="card p-5 space-y-4">
          {byCategory.map(({ c, rate, total }) => (
            <div key={c}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-display font-bold">{CATEGORY_LABEL[c]}</span>
                <span className="font-num text-slate1">
                  {rate}%<span className="text-xs">（{total}問）</span>
                </span>
              </div>
              <Bar value={rate} color={CATEGORY_COLOR[c]} />
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="WEAK POINTS" title="苦手ランキング" />
        <ol className="card divide-y divide-line1">
          {weak.slice(0, 5).map((w, i) => (
            <li key={w.field} className="flex items-center gap-3 px-5 py-3">
              <span className="font-num font-bold text-slate1 w-6">{i + 1}位</span>
              <span className="flex-1 font-display font-bold text-sm">{w.field}</span>
              <span className="font-num text-sm" style={{ color: w.rate < 60 ? '#D6362F' : '#3D4A63' }}>
                {w.rate}%
              </span>
              <span className="text-xs text-slate1">{w.total}問</span>
            </li>
          ))}
        </ol>
      </section>

      {state.mocks.length > 0 && (
        <section>
          <SectionTitle eyebrow="MOCK EXAM" title="模擬試験の履歴" />
          <ul className="card divide-y divide-line1">
            {[...state.mocks].reverse().map((m) => (
              <li key={m.at} className="flex items-center gap-3 px-5 py-3">
                <span className="font-num text-xs text-slate1 w-20">
                  {new Date(m.at).toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' })}
                </span>
                <span className="font-num font-bold flex-1">{m.overall} 点</span>
                <span className={`font-display font-bold text-sm ${m.passed ? 'text-leaf' : 'text-seal'}`}>
                  {m.passed ? '合格' : '不合格'}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <SectionTitle eyebrow="ACHIEVEMENTS" title={`実績（${state.unlocked.length}/${ACHIEVEMENTS.length}）`} />
        <ul className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = state.unlocked.includes(a.id)
            return (
              <li key={a.id} className={`card p-4 ${got ? '' : 'opacity-45'}`}>
                <p className="font-display font-bold text-sm">
                  {got ? '🏅 ' : '🔒 '}
                  {a.title}
                </p>
                <p className="text-xs text-slate1 mt-1 leading-relaxed">{a.description}</p>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
