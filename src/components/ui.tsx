import type { ReactNode } from 'react'
import { CATEGORY_COLOR, CATEGORY_LABEL } from '../types'
import type { Category } from '../types'

/** 画面の見出し。左に細い縦罫を置き、受験票の記入欄のような佇まいにする */
export const SectionTitle = ({ eyebrow, title, right }: { eyebrow?: string; title: string; right?: ReactNode }) => (
  <div className="flex items-end justify-between mb-3">
    <div>
      {eyebrow && <div className="eyebrow">{eyebrow}</div>}
      <h2 className="font-display font-bold text-lg leading-tight">{title}</h2>
    </div>
    {right}
  </div>
)

/** シグネチャ要素：合格発表の朱印を模した残日数表示 */
export const CountdownSeal = ({ days }: { days: number | null }) => {
  const label = days === null ? '未設定' : days > 0 ? `${days}` : days === 0 ? '本日' : '受験済'
  return (
    <div className="relative shrink-0">
      <div className="w-[104px] h-[104px] rounded-full border-[3px] border-seal shadow-seal flex flex-col items-center justify-center -rotate-[8deg] animate-stamp bg-seal/[.04]">
        <span className="font-display text-[10px] tracking-[.2em] text-seal">GOAL</span>
        <span className="font-num font-bold text-seal leading-none" style={{ fontSize: days && days > 99 ? 30 : 38 }}>
          {label}
        </span>
        <span className="font-display text-[10px] tracking-[.2em] text-seal">
          {days === null ? 'SET DATE' : days > 0 ? 'DAYS LEFT' : ''}
        </span>
      </div>
    </div>
  )
}

export const Bar = ({ value, color = '#101A2E', height = 8 }: { value: number; color?: string; height?: number }) => (
  <div className="w-full rounded-full bg-line1/70 overflow-hidden" style={{ height }}>
    <div
      className="h-full rounded-full transition-[width] duration-500"
      style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
    />
  </div>
)

export const CategoryTag = ({ category }: { category: Category }) => (
  <span
    className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-display font-bold"
    style={{ color: CATEGORY_COLOR[category], background: `${CATEGORY_COLOR[category]}14` }}
  >
    {CATEGORY_LABEL[category]}
  </span>
)

export const Stat = ({ label, value, unit }: { label: string; value: string | number; unit?: string }) => (
  <div>
    <div className="eyebrow">{label}</div>
    <div className="font-num font-bold text-xl leading-tight">
      {value}
      {unit && <span className="text-xs font-body font-normal text-slate1 ml-0.5">{unit}</span>}
    </div>
  </div>
)

export const Empty = ({ title, hint }: { title: string; hint: string }) => (
  <div className="card p-8 text-center">
    <p className="font-display font-bold">{title}</p>
    <p className="text-sm text-slate1 mt-1">{hint}</p>
  </div>
)
