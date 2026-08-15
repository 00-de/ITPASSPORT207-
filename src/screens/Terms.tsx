import { useMemo, useState } from 'react'
import { TERMS } from '../data/terms'
import { useApp } from '../state/AppContext'
import { CategoryTag, Empty, SectionTitle } from '../components/ui'
import { shuffle } from '../lib/util'

export default function Terms() {
  const { state, toggleFavorite } = useApp()
  const [tab, setTab] = useState<'dict' | 'card'>('dict')
  const [q, setQ] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)

  const list = useMemo(() => {
    const key = q.trim().toLowerCase()
    return TERMS.filter((t) => {
      if (onlyFav && !state.favorites.includes(t.id)) return false
      if (!key) return true
      return (
        t.term.toLowerCase().includes(key) ||
        (t.reading ?? '').includes(key) ||
        t.meaning.toLowerCase().includes(key) ||
        t.field.includes(key)
      )
    })
  }, [q, onlyFav, state.favorites])

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['dict', 'card'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-xl py-2.5 font-display font-bold text-sm transition ${
              tab === t ? 'bg-ink text-white' : 'bg-white border border-line1 text-slate1'
            }`}
          >
            {t === 'dict' ? '用語辞典' : '暗記カード'}
          </button>
        ))}
      </div>

      {tab === 'dict' ? (
        <>
          <div className="card p-4 space-y-3">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="用語・よみ・意味で検索（例：クラウド、RAG、VPN）"
              className="w-full rounded-xl border border-line1 px-4 py-3 text-[15px] focus:border-ai"
            />
            <label className="flex items-center gap-2 text-sm text-slate1">
              <input type="checkbox" checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)} />
              お気に入りだけ表示（{state.favorites.length}語）
            </label>
          </div>

          <p className="eyebrow px-1">{list.length} 語 / 収録 {TERMS.length} 語</p>

          {list.length === 0 ? (
            <Empty title="一致する用語がありません" hint="別のことばで検索してみてください。" />
          ) : (
            <ul className="space-y-2">
              {list.map((t) => (
                <li key={t.id} className="card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-bold text-[16px]">{t.term}</p>
                      {t.reading && <p className="text-xs text-slate1">{t.reading}</p>}
                    </div>
                    <button
                      onClick={() => toggleFavorite(t.id)}
                      aria-label="お気に入り"
                      className={`text-lg leading-none ${state.favorites.includes(t.id) ? 'text-amber1' : 'text-line1'}`}
                    >
                      ★
                    </button>
                  </div>
                  <p className="text-[15px] leading-relaxed mt-2">{t.meaning}</p>
                  <div className="mt-3 flex items-center gap-2">
                    <CategoryTag category={t.category} />
                    <span className="eyebrow">{t.field}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <Flashcards ids={onlyFav ? state.favorites : undefined} />
      )}
    </div>
  )
}

function Flashcards({ ids }: { ids?: string[] }) {
  const pool = useMemo(() => shuffle(ids ? TERMS.filter((t) => ids.includes(t.id)) : TERMS), [ids])
  const [i, setI] = useState(0)
  const [open, setOpen] = useState(false)

  if (pool.length === 0) return <Empty title="カードがありません" hint="用語辞典で★を付けると、ここに集まります。" />

  const t = pool[i % pool.length]
  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="FLASHCARD" title={`${(i % pool.length) + 1} / ${pool.length}`} />
      <button
        onClick={() => setOpen((o) => !o)}
        className="card w-full min-h-[220px] p-6 flex flex-col items-center justify-center text-center"
      >
        {open ? (
          <>
            <span className="eyebrow">意味</span>
            <p className="text-[17px] leading-relaxed mt-2 animate-pop">{t.meaning}</p>
          </>
        ) : (
          <>
            <span className="eyebrow">用語</span>
            <p className="font-display font-black text-3xl mt-2 animate-pop">{t.term}</p>
            <p className="text-xs text-slate1 mt-4">タップして意味を見る</p>
          </>
        )}
      </button>
      <div className="grid grid-cols-2 gap-3">
        <button
          className="btn-ghost"
          onClick={() => {
            setOpen(false)
            setI((v) => (v - 1 + pool.length) % pool.length)
          }}
        >
          前のカード
        </button>
        <button
          className="btn-primary"
          onClick={() => {
            setOpen(false)
            setI((v) => (v + 1) % pool.length)
          }}
        >
          次のカード
        </button>
      </div>
    </div>
  )
}
