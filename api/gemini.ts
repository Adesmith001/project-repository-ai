import { GoogleGenAI } from '@google/genai'

const DEFAULT_GENERATION_MODELS = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] as const

type RequestLike = {
  method?: string
  body?: unknown
}

type ResponseLike = {
  setHeader: (name: string, value: string) => void
  status: (code: number) => ResponseLike
  json: (payload: unknown) => void
}

type GeminiRequestPayload = {
  action?: string
  prompt?: string
  text?: string
  models?: string[]
}

let cachedClient: GoogleGenAI | null | undefined

function getGeminiClient() {
  if (cachedClient !== undefined) {
    return cachedClient
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey || !apiKey.trim()) {
    cachedClient = null
    return cachedClient
  }

  cachedClient = new GoogleGenAI({ apiKey })
  return cachedClient
}

function parseBody(body: unknown): GeminiRequestPayload {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as GeminiRequestPayload
    } catch {
      return {}
    }
  }

  if (!body || typeof body !== 'object') {
    return {}
  }

  return body as GeminiRequestPayload
}

function normalizeModels(models: unknown) {
  if (!Array.isArray(models)) {
    return [...DEFAULT_GENERATION_MODELS]
  }

  const sanitized = models
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)

  if (sanitized.length === 0) {
    return [...DEFAULT_GENERATION_MODELS]
  }

  return sanitized
}

export default async function handler(req: RequestLike, res: ResponseLike) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const client = getGeminiClient()

  if (!client) {
    res.status(503).json({ error: 'Gemini service is not configured on the server.' })
    return
  }

  const payload = parseBody(req.body)

  try {
    if (payload.action === 'generateText') {
      const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : ''

      if (!prompt) {
        res.status(400).json({ error: 'Prompt is required.' })
        return
      }

      const models = normalizeModels(payload.models)

      for (const model of models) {
        try {
          const response = await client.models.generateContent({
            model,
            contents: prompt,
          })

          const text = response.text?.trim() || ''

          if (text) {
            res.status(200).json({ text })
            return
          }
        } catch {
          // Continue to the next model.
        }
      }

      res.status(502).json({ error: 'Gemini generation failed.' })
      return
    }

    if (payload.action === 'embed') {
      const text = typeof payload.text === 'string' ? payload.text.trim() : ''

      if (!text) {
        res.status(400).json({ error: 'Text is required.' })
        return
      }

      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: text,
      })

      const values = response.embeddings?.[0]?.values ?? []
      res.status(200).json({ values })
      return
    }

    res.status(400).json({ error: 'Unsupported Gemini action.' })
  } catch {
    res.status(500).json({ error: 'Unable to process Gemini request.' })
  }
}
