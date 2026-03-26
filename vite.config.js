import { defineConfig } from 'vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Load .env manually for the server plugin
function loadDotEnv() {
  try {
    const envPath = resolve(process.cwd(), '.env')
    const content = readFileSync(envPath, 'utf8')
    const vars = {}
    content.split('\n').forEach(line => {
      const [key, ...vals] = line.split('=')
      if (key && key.trim() && !key.startsWith('#')) {
        vars[key.trim()] = vals.join('=').trim()
      }
    })
    return vars
  } catch {
    return {}
  }
}

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  plugins: [
    {
      name: 'anthropic-proxy',
      configureServer(server) {
        server.middlewares.use('/api/chat', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            return res.end(JSON.stringify({ error: 'Method Not Allowed' }))
          }

          const env = loadDotEnv()
          const apiKey = env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY

          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }))
          }

          // Collect request body
          const chunks = []
          for await (const chunk of req) chunks.push(chunk)
          const body = JSON.parse(Buffer.concat(chunks).toString())

          const { messages, system, stream = false } = body

          const payload = {
            model: 'claude-sonnet-4-5',
            max_tokens: 2048,
            messages: messages || [],
            ...(system ? { system } : {}),
            ...(stream ? { stream: true } : {}),
          }

          try {
            const upstream = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
              },
              body: JSON.stringify(payload),
            })

            if (stream) {
              res.setHeader('Content-Type', 'text/event-stream')
              res.setHeader('Cache-Control', 'no-cache')
              res.setHeader('Connection', 'keep-alive')

              const reader = upstream.body.getReader()
              const decoder = new TextDecoder()

              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                const chunk = decoder.decode(value, { stream: true })
                res.write(chunk)
              }
              res.end()
            } else {
              const data = await upstream.json()
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = upstream.status
              res.end(JSON.stringify(data))
            }
          } catch (err) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: err.message }))
          }
        })
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
})
