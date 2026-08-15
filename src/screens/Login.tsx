import { useState } from 'react'
import { authMessage, useAuth } from '../state/AuthContext'

type Mode = 'signin' | 'signup' | 'reset'

export default function Login({ onSkip }: { onSkip: () => void }) {
  const { signIn, signUp, signInGoogle, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async () => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (mode === 'signin') await signIn(email.trim(), password)
      else if (mode === 'signup') await signUp(email.trim(), password, name.trim())
      else {
        await resetPassword(email.trim())
        setNotice('再設定用のメールを送りました。受信箱を確認してください。')
      }
    } catch (e) {
      setError(authMessage(e))
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setBusy(true)
    setError('')
    try {
      await signInGoogle()
    } catch (e) {
      setError(authMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-5">
        <div className="text-center">
          <div className="eyebrow">IT PASSPORT 2027</div>
          <h1 className="font-display font-black text-2xl mt-1">ITパスポート合格ナビ</h1>
          <p className="text-sm text-slate1 mt-2 leading-relaxed">
            ログインすると、学習記録が端末をまたいで引き継がれます。
          </p>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex gap-2">
            {(
              [
                ['signin', 'ログイン'],
                ['signup', '新規登録'],
              ] as [Mode, string][]
            ).map(([m, label]) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError('')
                  setNotice('')
                }}
                className={`flex-1 rounded-xl py-2.5 font-display font-bold text-sm transition ${
                  mode === m ? 'bg-ink text-white' : 'bg-paper text-slate1'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === 'signup' && (
            <label className="block">
              <span className="eyebrow">ユーザー名</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例：トシ"
                className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai"
              />
            </label>
          )}

          <label className="block">
            <span className="eyebrow">メールアドレス</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai"
            />
          </label>

          {mode !== 'reset' && (
            <label className="block">
              <span className="eyebrow">パスワード</span>
              <input
                type="password"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6文字以上"
                className="mt-1 w-full rounded-xl border border-line1 px-4 py-3 focus:border-ai"
              />
            </label>
          )}

          {error && <p className="text-sm text-seal leading-relaxed">{error}</p>}
          {notice && <p className="text-sm text-leaf leading-relaxed">{notice}</p>}

          <button className="btn-primary w-full" onClick={submit} disabled={busy || !email}>
            {busy ? '処理中…' : mode === 'signin' ? 'ログイン' : mode === 'signup' ? '登録して始める' : '再設定メールを送る'}
          </button>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-line1" />
            <span className="eyebrow">または</span>
            <span className="h-px flex-1 bg-line1" />
          </div>

          <button className="btn-ghost w-full" onClick={google} disabled={busy}>
            Googleでログイン
          </button>

          {mode === 'signin' && (
            <button
              className="w-full text-sm text-slate1 underline"
              onClick={() => {
                setMode('reset')
                setError('')
              }}
            >
              パスワードを忘れた場合
            </button>
          )}
          {mode === 'reset' && (
            <button className="w-full text-sm text-slate1 underline" onClick={() => setMode('signin')}>
              ログイン画面に戻る
            </button>
          )}
        </div>

        <button className="w-full text-sm text-slate1" onClick={onSkip}>
          ログインせずにこの端末だけで使う →
        </button>
      </div>
    </div>
  )
}
