/**
 * AI先生のエンドポイント（Vercel Serverless Function）
 *
 * APIキーはサーバ側の環境変数だけで扱い、ブラウザには渡さない。
 * 既定はGroq。失敗したらOpenAIへ自動で切り替える。
 */

type Provider = 'groq' | 'openai'

interface ProviderConfig {
  name: Provider
  url: string
  key: string | undefined
  model: string
}

const providers = (): ProviderConfig[] => [
  {
    name: 'groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    key: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  },
  {
    name: 'openai',
    url: 'https://api.openai.com/v1/chat/completions',
    key: process.env.OPENAI_API_KEY,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  },
]

const SYSTEM = `あなたは「ITパスポート試験」の学習を支える先生です。次の方針で答えてください。

- 日本語で、やさしく丁寧に説明する
- ITパスポート試験（シラバスVer.6.5）の範囲を超えた細かい内容には踏み込まない
- 専門用語を使うときは、必ず短い言い換えを添える
- 身近なたとえを1つ入れて、イメージできるようにする
- 前置きやあいさつは書かず、本題から始める
- 400文字以内にまとめる`

const SIMILAR_SYSTEM = `あなたはITパスポート試験の作問者です。指定された問題と同じ分野・同じ難易度の4択問題を1問だけ作ります。
次のJSONだけを出力し、前後に説明文やコードブロック記号を付けないでください。

{"question":"問題文","choices":["選択肢A","選択肢B","選択肢C","選択肢D"],"answer":0,"explanation":"なぜその答えになるかの解説（150文字以内）"}

answerは正解の選択肢の番号（0から始まる）です。元の問題と同じ答えにならないよう、題材を変えてください。`

/** Firebaseのトークンを検証する。FIREBASE_API_KEY未設定なら検証しない */
const verifyUser = async (idToken: string | undefined): Promise<boolean> => {
  const key = process.env.FIREBASE_API_KEY
  if (!key) return true
  if (!idToken) return false
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    })
    return r.ok
  } catch {
    return false
  }
}

const callProvider = async (p: ProviderConfig, system: string, user: string, json: boolean) => {
  const res = await fetch(p.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${p.key}`,
    },
    body: JSON.stringify({
      model: p.model,
      max_tokens: 900,
      temperature: json ? 0.8 : 0.5,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    }),
  })
  if (!res.ok) {
    const detail = await res.text()
    throw new Error(`${p.name}:${res.status}:${detail.slice(0, 200)}`)
  }
  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] }
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error(`${p.name}: 応答が空でした`)
  return text
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'POSTで送信してください' })
    return
  }

  const { mode, prompt, prefer, idToken } = (req.body ?? {}) as {
    mode?: string
    prompt?: string
    prefer?: Provider | 'auto'
    idToken?: string
  }

  if (typeof prompt !== 'string' || prompt.length === 0) {
    res.status(400).json({ error: '質問の内容が空です' })
    return
  }
  if (prompt.length > 4000) {
    res.status(400).json({ error: '質問が長すぎます。短くまとめてください' })
    return
  }

  if (!(await verifyUser(idToken))) {
    res.status(401).json({ error: 'ログインしてからお試しください' })
    return
  }

  const wantJson = mode === 'similar'
  const system = wantJson ? SIMILAR_SYSTEM : SYSTEM

  // 使える提供元だけを、希望順に並べる
  const all = providers().filter((p) => p.key)
  if (all.length === 0) {
    res.status(503).json({ error: 'AI先生はまだ設定されていません（APIキー未登録）' })
    return
  }
  const order =
    prefer === 'groq' || prefer === 'openai'
      ? [...all.filter((p) => p.name === prefer), ...all.filter((p) => p.name !== prefer)]
      : all

  const errors: string[] = []
  for (const p of order) {
    try {
      const text = await callProvider(p, system, prompt, wantJson)
      res.status(200).json({ text, provider: p.name, model: p.model })
      return
    } catch (e) {
      errors.push(String((e as Error).message))
    }
  }

  res.status(502).json({ error: 'AI先生に接続できませんでした。少し待ってからお試しください', detail: errors })
}
