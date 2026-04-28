import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import geminiHandler from './api/gemini'

function geminiDevApiPlugin() {
  return {
    name: 'gemini-dev-api',
    configureServer(server: { middlewares: { use: (path: string, handler: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use('/api/gemini', (req, res, next) => {
        let rawBody = ''

        req.on('data', (chunk: Buffer | string) => {
          rawBody += chunk.toString()
        })

        req.on('end', async () => {
          const responseLike = {
            setHeader(name: string, value: string) {
              res.setHeader(name, value)
            },
            status(code: number) {
              res.statusCode = code
              return responseLike
            },
            json(payload: unknown) {
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(payload))
            },
          }

          try {
            await geminiHandler(
              {
                method: req.method,
                body: rawBody,
              },
              responseLike,
            )
          } catch {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Dev API middleware failed.' }))
          }
        })

        req.on('error', () => {
          res.statusCode = 400
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Invalid request body.' }))
        })

        if (req.method === 'OPTIONS') {
          next()
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), geminiDevApiPlugin()],
})
