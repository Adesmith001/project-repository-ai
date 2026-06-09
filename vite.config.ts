/// <reference types="vitest/config" />

import { defineConfig, type PluginOption, type ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

type GeminiHandler = typeof import('./api/gemini')['default']

function geminiDevApiPlugin(): PluginOption {
  let handlerPromise: Promise<GeminiHandler> | null = null

  return {
    name: 'gemini-dev-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/api/gemini', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          next()
          return
        }

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
            const geminiHandler = await (handlerPromise ??= import('./api/gemini.ts').then((module) => module.default))
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
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: command === 'serve' ? [react(), tailwindcss(), geminiDevApiPlugin()] : [react(), tailwindcss()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
}))
