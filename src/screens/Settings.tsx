import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { useAuth } from '../state/AuthContext'
import { SectionTitle } from '../components/ui'
import { getPreferredProvider, setPreferredProvider } from '../lib/ai'
import type { Provider } from '../lib/ai'
import { QUESTIONS, countByCategory } from '../data/questions'
import { TERMS } from '../data/terms'

const SYNC_TEXT = {
  off: 'この端末だけに保存しています',
  syncing: 'クラウドと同期しています…',
  synced: 'クラウドと同期済みです',
  error: '同期に失敗しました。通信を確認してください',
} as const

export default function Settings({ onRequireLogin }: { onRequireLogin: () => void }) {
  const { state, updateProfile, resetAll, syncStatus, lastSyncedAt } = useApp()
  const { enabled, user, logout } = useAuth()
  const [confirming, setConfirming] = useState(false)
  const [provider, setProvider] = useState<Provider>(() => getPreferredProvider())

  const chooseProvider = (p: Provider) => {
    setPreferredProvider(p)
    setProvider(p)
  }

  return (
    <div className="space-y-6">
      <section>
        <SectionTitle eyebrow="ACCOUNT" title="アカウント" />
        <div className="card p-5 space-y-3">
          {!enabled ? (
            <p className="text-sm text-slate1 leading-relaxed">
              Firebaseの設定値が登録されていないため、ログイン機能は使えません。学習記録はこの端末にだけ保存されます。
            </p>
          ) : user ? (
            <>
              <div>
                <div className="eyebrow">ログイン中</div>
                <p className="font-display font-bold">{user.displayName || user.email}</p>
                {user.displayName && <p className="text-xs text-slate1">{user.email}</p>}
              </div>
              <p className="text-sm text-slate1">
                {SYNC_TEXT[syncStatus]}
                {lastSyncedAt && syncStatus === 'synced' && (
                  <span className="font-num text-xs">（{new Date(lastSyncedAt).toLocaleTimeString('ja-JP')}）</span>
                )}
              </p>
              <button className="btn-ghost w-full" onClick={() => logout()}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              <p className="text-sm text-slate1 leading-relaxed">
                ログインすると、学習記録がクラウドに保存され、スマートフォンとパソコンで同じ記録を使えます。この端末の記録はログイン時に引き継がれます。
              </p>
              <button className="btn-primary w-full" onClick={onRequireLogin}>
                ログイン・新規登録
              </button>
            </>
          )}
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="PROFILE" title="学習者情報" />
        <div className="card p-5 space-y-4">
          <label className="block">
            <span className="eyebrow">ユーザー名</span>
            <input
              value={state.profile.name}
              onChange={(e) => updateProfile({ name: e.target.value })}
              placeholder="例：トシ"
              className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai"
            />
          </label>
          <label className="block">
            <span className="eyebrow">受験予定日</span>
            <input
              type="date"
              value={state.profile.examDate}
              onChange={(e) => updateProfile({ examDate: e.target.value })}
              className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai font-num"
            />
          </label>
          <label className="block">
            <span className="eyebrow">1日の目標問題数</span>
            <input
              type="number"
              min={1}
              max={100}
              value={state.profile.dailyGoal}
              onChange={(e) => updateProfile({ dailyGoal: Math.max(1, Number(e.target.value) || 1) })}
              className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai font-num"
            />
          </label>
          <p className="text-xs text-slate1">学習開始日：{state.profile.startDate}</p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="AI TEACHER" title="AI先生の設定" />
        <div className="card p-5 space-y-3">
          <p className="eyebrow">使用するAI</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ['auto', '自動'],
                ['groq', 'Groq'],
                ['gemini', 'Gemini'],
                ['openai', 'ChatGPT'],
              ] as [Provider, string][]
            ).map(([id, label]) => (
              <button
                key={id}
                onClick={() => chooseProvider(id)}
                className={`rounded-xl py-2.5 font-display font-bold text-sm transition ${
                  provider === id ? 'bg-ink text-white' : 'bg-paper text-slate1'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate1 leading-relaxed">
            「自動」はGroq→Gemini→ChatGPTの順に試し、応答できないものは飛ばします。登録したAPIキーの分だけが候補になります。
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="CONTENT" title="収録データ" />
        <div className="card p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="eyebrow">問題数</div>
            <p className="font-num font-bold text-lg">{QUESTIONS.length}問</p>
            <p className="text-[11px] text-slate1 mt-0.5 font-num">
              ス{countByCategory().strategy}・マ{countByCategory().management}・テ{countByCategory().technology}
            </p>
          </div>
          <div>
            <div className="eyebrow">用語数</div>
            <p className="font-num font-bold text-lg">{TERMS.length}語</p>
          </div>
          <p className="col-span-2 text-xs text-slate1 leading-relaxed">
            シラバスVer.6.5に準拠。生成AI・AIガバナンス・プロンプトエンジニアリング・RAG・ハルシネーション・中小受託取引適正化法などの新出題範囲を含みます。
          </p>
        </div>
      </section>

      <section>
        <SectionTitle eyebrow="DATA" title="データ管理" />
        <div className="card p-5 space-y-3">
          <p className="text-sm text-slate1 leading-relaxed">
            この操作はこの端末の記録だけを消します。ログイン中の場合、クラウドの記録は残っており、次回ログイン時に戻ります。
          </p>
          {confirming ? (
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost" onClick={() => setConfirming(false)}>
                やめる
              </button>
              <button className="btn bg-seal text-white" onClick={resetAll}>
                この端末から消去
              </button>
            </div>
          ) : (
            <button className="btn-ghost w-full text-seal border-seal/40" onClick={() => setConfirming(true)}>
              この端末の学習データを消去する
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
