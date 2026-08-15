import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import { auth, firebaseReady } from '../lib/firebase'

interface AuthCtx {
  ready: boolean
  enabled: boolean
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, name: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInGoogle: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx | null>(null)

/** Firebaseのエラーコードを、利用者が次の行動を選べる日本語に置き換える */
export const authMessage = (e: unknown): string => {
  const err = e as { code?: string; message?: string }
  const code = err?.code ?? ''
  const map: Record<string, string> = {
    'auth/invalid-email': 'メールアドレスの形式が正しくありません。',
    'auth/missing-password': 'パスワードを入力してください。',
    'auth/weak-password': 'パスワードは6文字以上で設定してください。',
    'auth/email-already-in-use': 'このメールアドレスは登録済みです。ログインに切り替えてください。',
    'auth/invalid-credential': 'メールアドレスまたはパスワードが違います。',
    'auth/user-not-found': 'このメールアドレスは登録されていません。',
    'auth/wrong-password': 'パスワードが違います。',
    'auth/user-disabled': 'このアカウントは停止されています。',
    'auth/too-many-requests': '試行回数が上限に達しました。しばらく待ってからお試しください。',
    'auth/network-request-failed': '通信に失敗しました。接続を確認してください。',
    'auth/popup-blocked': 'ポップアップがブロックされました。別の方法で開き直します。',
    'auth/operation-not-allowed':
      'メール/パスワードでの登録が有効になっていません。Firebaseコンソールの Authentication → Sign-in method で有効にしてください。',
    'auth/admin-restricted-operation':
      '新規登録が制限されています。Firebaseコンソールの Authentication → Settings で、ユーザーアカウントの作成を許可してください。',
    'auth/unauthorized-domain':
      'このドメインは未承認です。Firebaseコンソールの Authentication → Settings → 承認済みドメインに追加してください。',
    'auth/invalid-api-key': 'Firebaseの設定値が正しくありません。Vercelの環境変数を確認してください。',
    'auth/api-key-not-valid': 'Firebaseの設定値が正しくありません。Vercelの環境変数を確認してください。',
    'auth/configuration-not-found':
      'Firebase側の設定が見つかりません。Authentication を「始める」から有効化したか確認してください。',
    'auth/operation-not-supported-in-this-environment': 'この環境では実行できない操作です。',
  }
  if (map[code]) return map[code]
  // 未知のエラーは、原因を突き止められるようコードをそのまま添える
  const detail = code || err?.message || String(e)
  return `処理できませんでした（${detail}）`
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(!firebaseReady)

  useEffect(() => {
    if (!auth) return
    // 端末によっては使えない保存方式があるため、順に切り替える
    setPersistence(auth, indexedDBLocalPersistence)
      .catch(() => setPersistence(auth!, browserLocalPersistence))
      .catch(() => setPersistence(auth!, browserSessionPersistence))
      .catch(() => undefined)
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setReady(true)
    })
  }, [])

  const value: AuthCtx = {
    ready,
    enabled: firebaseReady,
    user,
    loading: !ready,
    signUp: async (email, password, name) => {
      const cred = await createUserWithEmailAndPassword(auth!, email, password)
      if (name) await updateProfile(cred.user, { displayName: name })
    },
    signIn: async (email, password) => {
      await signInWithEmailAndPassword(auth!, email, password)
    },
    signInGoogle: async () => {
      const provider = new GoogleAuthProvider()
      try {
        await signInWithPopup(auth!, provider)
      } catch (e) {
        const code = (e as { code?: string })?.code ?? ''
        if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user' || code === 'auth/operation-not-supported-in-this-environment') {
          await signInWithRedirect(auth!, provider)
          return
        }
        throw e
      }
    },
    resetPassword: async (email) => {
      await sendPasswordResetEmail(auth!, email)
    },
    logout: async () => {
      await signOut(auth!)
    },
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useAuth = () => {
  const c = useContext(Ctx)
  if (!c) throw new Error('AuthProvider の内側で useAuth を呼び出してください')
  return c
}
