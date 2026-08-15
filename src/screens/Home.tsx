import type { Category } from '../types'
import { CATEGORY_LABEL } from '../types'
import { useApp } from '../state/AppContext'
import { Bar, CountdownSeal, SectionTitle } from '../components/ui'
import { accuracy, daysUntil, formatTime } from '../lib/util'

export type StartMode =
  | { kind: 'daily' }
  | { kind: 'weak' }
  | { kind: 'category'; category: Category }

interface Props {
  onStart: (m: StartMode) => void
  onMock: () => void
  onGo: (tab: 'terms' | 'records' | 'settings') => void
}

const WEEK_PLAN: { day: string; label: string; action: StartMode | 'terms' | 'mock' }[] = [
  { day: '月', label: 'ストラテジ系 10問', action: { kind: 'category', category: 'strategy' } },
  { day: '火', label: 'テクノロジ系 10問', action: { kind: 'category', category: 'technology' } },
  { day: '水', label: 'マネジメント系 10問', action: { kind: 'category', category: 'management' } },
  { day: '木', label: '苦手問題 10問', action: { kind: 'weak' } },
  { day: '金', label: '用語暗記', action: 'terms' },
  { day: '土', label: '模擬試験', action: 'mock' },
  { day: '日', label: '復習（今日の10問）', action: { kind: 'daily' } },
]

export default function Home({ onStart, onMock, onGo }: Props) {
  const { state, streak, level, todayRecord } = useApp()
  const left = daysUntil(state.profile.examDate)
  const goal = state.profile.dailyGoal
  const hour = new Date().getHours()
  const greeting = hour < 11 ? 'おはようございます' : hour < 18 ? 'こんにちは' : 'おつかれさまです'
  const todayIdx = (new Date().getDay() + 6) % 7 // 月曜はじまり
  const plan = WEEK_PLAN[todayIdx]

  const runPlan = (action: (typeof WEEK_PLAN)[number]['action']) => {
    if (action === 'terms') onGo('terms')
    else if (action === 'mock') onMock()
    else onStart(action)
  }

  return (
    <div className="space-y-6">
      {/* ヒーロー：合格発表の朱印を模した残日数 */}
      <div className="card p-5 flex items-center gap-5">
        <CountdownSeal days={left} />
        <div className="min-w-0">
          <p className="text-sm text-slate1">
            {greeting}
            {state.profile.name && `、${state.profile.name}さん`}
          </p>
          <h1 className="font-display font-black text-xl leading-snug mt-1">
            {left === null
              ? '受験日を登録しましょう'
              : left > 0
                ? `試験日まで あと${left}日`
                : left === 0
                  ? '試験当日です'
                  : '受験おつかれさまでした'}
          </h1>
          {left === null && (
            <button className="text-sm text-ai font-display font-bold mt-2" onClick={() => onGo('settings')}>
              受験日を設定する →
            </button>
          )}
        </div>
      </div>

      {/* 今日の進捗 */}
      <div className="card p-5">
        <div className="flex items-end justify-between mb-2">
          <div>
            <div className="eyebrow">TODAY</div>
            <p className="font-display font-bold">
              今日の学習 <span className="font-num">{todayRecord.answered}</span>
              <span className="text-slate1 text-sm"> / {goal}問</span>
            </p>
          </div>
          <p className="text-sm text-slate1">
            🔥 {streak}日連続 ・ {formatTime(todayRecord.seconds)}
          </p>
        </div>
        <Bar value={(todayRecord.answered / goal) * 100} color="#0E9E6E" height={10} />
        <div className="grid grid-cols-3 gap-3 mt-4 text-center">
          <div>
            <div className="eyebrow">正解率</div>
            <p className="font-num font-bold text-lg">{accuracy(state.logs)}%</p>
          </div>
          <div>
            <div className="eyebrow">累計</div>
            <p className="font-num font-bold text-lg">{state.logs.length}問</p>
          </div>
          <div>
            <div className="eyebrow">レベル</div>
            <p className="font-num font-bold text-lg">Lv.{level.lv}</p>
          </div>
        </div>
        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate1 mb-1">
            <span className="font-display font-bold">{level.title}</span>
            <span className="font-num">次のレベルまで {level.toNext} XP</span>
          </div>
          <Bar value={level.ratio * 100} color="#1F4FD8" height={6} />
        </div>
      </div>

      {/* 学習メニュー */}
      <section>
        <SectionTitle eyebrow="STUDY" title="学習メニュー" />
        <div className="grid grid-cols-2 gap-3">
          <button className="card p-5 text-left col-span-2 bg-ink text-white border-ink" onClick={() => onStart({ kind: 'daily' })}>
            <span className="font-num text-[11px] tracking-[.18em] text-white/60">DAILY 10</span>
            <p className="font-display font-black text-xl mt-1">今日の10問</p>
            <p className="text-sm text-white/70 mt-1">未出題の問題を優先して出題します</p>
          </button>
          <button className="card p-4 text-left" onClick={() => onStart({ kind: 'weak' })}>
            <p className="font-display font-bold">苦手問題</p>
            <p className="text-xs text-slate1 mt-1">正解率の低い分野から</p>
          </button>
          <button className="card p-4 text-left" onClick={onMock}>
            <p className="font-display font-bold">模擬試験</p>
            <p className="text-xs text-slate1 mt-1">本番と同じ形式で採点</p>
          </button>
          <button className="card p-4 text-left" onClick={() => onGo('terms')}>
            <p className="font-display font-bold">用語暗記</p>
            <p className="text-xs text-slate1 mt-1">辞典と暗記カード</p>
          </button>
          <button className="card p-4 text-left" onClick={() => onGo('records')}>
            <p className="font-display font-bold">学習記録</p>
            <p className="text-xs text-slate1 mt-1">推移と苦手分析</p>
          </button>
        </div>
      </section>

      {/* 分野別 */}
      <section>
        <SectionTitle eyebrow="BY CATEGORY" title="分野を選んで解く" />
        <div className="grid grid-cols-3 gap-2">
          {(['strategy', 'management', 'technology'] as Category[]).map((c) => (
            <button key={c} className="card px-3 py-4 text-center" onClick={() => onStart({ kind: 'category', category: c })}>
              <p className="font-display font-bold text-sm leading-tight">{CATEGORY_LABEL[c]}</p>
            </button>
          ))}
        </div>
      </section>

      {/* 週間スケジュール */}
      <section>
        <SectionTitle eyebrow="WEEKLY PLAN" title="今週の学習プラン" />
        <ul className="card divide-y divide-line1">
          {WEEK_PLAN.map((p, i) => (
            <li key={p.day}>
              <button
                onClick={() => runPlan(p.action)}
                className={`w-full flex items-center gap-3 px-5 py-3 text-left ${i === todayIdx ? 'bg-ai/[.05]' : ''}`}
              >
                <span className={`font-display font-bold w-6 ${i === todayIdx ? 'text-ai' : 'text-slate1'}`}>{p.day}</span>
                <span className="flex-1 text-sm">{p.label}</span>
                {i === todayIdx && <span className="eyebrow text-ai">TODAY</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-slate1 mt-2 px-1">今日は「{plan.label}」の日です。</p>
      </section>
    </div>
  )
}
