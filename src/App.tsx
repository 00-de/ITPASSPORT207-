import { useEffect, useState } from 'react'
import Home from './screens/Home'
import type { StartMode } from './screens/Home'
import Quiz from './screens/Quiz'
import Mock from './screens/Mock'
import Terms from './screens/Terms'
import Records from './screens/Records'
import Settings from './screens/Settings'
import { useApp } from './state/AppContext'
import { ACHIEVEMENTS } from './data/achievements'
import { CATEGORY_LABEL } from './types'
import type { Question } from './types'
import { pickByCategory, pickDaily, pickWeak } from './lib/select'

type Tab = 'home' | 'terms' | 'records' | 'settings'
type View = { name: 'tab'; tab: Tab } | { name: 'quiz'; title: string; questions: Question[] } | { name: 'mock' }

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'ホーム' },
  { id: 'terms', label: '用語' },
  { id: 'records', label: '記録' },
  { id: 'settings', label: '設定' },
]

export default function App() {
  const { state, newBadges, clearNewBadges, addStudySeconds } = useApp()
  const [view, setView] = useState<View>({ name: 'tab', tab: 'home' })

  // 画面を開いている時間を1分単位で学習時間に加算する
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState === 'visible') addStudySeconds(60)
    }, 60000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (newBadges.length === 0) return
    const t = setTimeout(clearNewBadges, 4000)
    return () => clearTimeout(t)
  }, [newBadges])

  const start = (m: StartMode) => {
    if (m.kind === 'daily') setView({ name: 'quiz', title: '今日の10問', questions: pickDaily(state.logs, state.profile.dailyGoal) })
    else if (m.kind === 'weak') setView({ name: 'quiz', title: '苦手問題', questions: pickWeak(state.logs, 10) })
    else setView({ name: 'quiz', title: CATEGORY_LABEL[m.category], questions: pickByCategory(m.category, 10) })
  }

  const goTab = (tab: Tab) => setView({ name: 'tab', tab })
  const currentTab = view.name === 'tab' ? view.tab : null

  const heading =
    view.name === 'quiz'
      ? view.title
      : view.name === 'mock'
        ? '模擬試験'
        : { home: 'ITパスポート合格ナビ2027', terms: '用語辞典', records: '学習記録', settings: '設定' }[view.tab]

  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-20 bg-paper/85 backdrop-blur border-b border-line1">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="eyebrow">IT PASSPORT 2027</div>
          <h1 className="font-display font-black text-[17px] leading-tight">{heading}</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-5">
        {view.name === 'tab' && view.tab === 'home' && (
          <Home onStart={start} onMock={() => setView({ name: 'mock' })} onGo={goTab} />
        )}
        {view.name === 'tab' && view.tab === 'terms' && <Terms />}
        {view.name === 'tab' && view.tab === 'records' && <Records />}
        {view.name === 'tab' && view.tab === 'settings' && <Settings />}
        {view.name === 'quiz' && <Quiz title={view.title} questions={view.questions} onExit={() => goTab('home')} />}
        {view.name === 'mock' && <Mock onExit={() => goTab('home')} />}
      </main>

      {/* 実績解放の通知 */}
      {newBadges.length > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 animate-slideup">
          <div className="bg-ink text-white rounded-2xl px-5 py-3 shadow-card">
            <p className="eyebrow text-white/60">ACHIEVEMENT</p>
            <p className="font-display font-bold text-sm">
              🏅 {ACHIEVEMENTS.find((a) => a.id === newBadges[0])?.title} を獲得しました
            </p>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-line1 pb-[env(safe-area-inset-bottom)]">
        <ul className="max-w-lg mx-auto grid grid-cols-4">
          {TABS.map((t) => (
            <li key={t.id}>
              <button
                onClick={() => goTab(t.id)}
                className={`w-full py-3 font-display font-bold text-sm transition ${
                  currentTab === t.id ? 'text-ai' : 'text-slate1'
                }`}
              >
                {t.label}
                <span
                  className={`block h-[3px] rounded-full mx-auto mt-1 transition-all ${
                    currentTab === t.id ? 'w-6 bg-ai' : 'w-0 bg-transparent'
                  }`}
                />
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
