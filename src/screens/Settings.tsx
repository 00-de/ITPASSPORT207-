import { useState } from 'react'
import { useApp } from '../state/AppContext'
import { SectionTitle } from '../components/ui'
import { QUESTIONS } from '../data/questions'
import { TERMS } from '../data/terms'

export default function Settings() {
  const { state, updateProfile, resetAll } = useApp()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="space-y-6">
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
        <SectionTitle eyebrow="CONTENT" title="収録データ" />
        <div className="card p-5 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="eyebrow">問題数</div>
            <p className="font-num font-bold text-lg">{QUESTIONS.length}問</p>
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
            学習データはこの端末のブラウザに保存されています。消去すると解答履歴・実績・お気に入りがすべて失われ、元に戻せません。
          </p>
          {confirming ? (
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-ghost" onClick={() => setConfirming(false)}>
                やめる
              </button>
              <button className="btn bg-seal text-white" onClick={resetAll}>
                すべて消去する
              </button>
            </div>
          ) : (
            <button className="btn-ghost w-full text-seal border-seal/40" onClick={() => setConfirming(true)}>
              学習データを消去する
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
