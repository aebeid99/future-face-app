/**
 * FutureFace Production Build
 * Uses esbuild directly — bypasses Rollup (which needs a native binary not available in this environment).
 * Run: node build.mjs
 */

import * as esbuild from './node_modules/esbuild/lib/main.js'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'fs'
import { resolve, join } from 'path'

const ROOT  = process.cwd()
const DIST  = join(ROOT, 'dist')
const SRC   = join(ROOT, 'src')

// ── 1. Clean dist ────────────────────────────────────────────
try { execSync(`rm -rf ${DIST}`) } catch {}
mkdirSync(DIST, { recursive: true })
mkdirSync(join(DIST, 'assets'), { recursive: true })

// ── 2. Read .env for define map ──────────────────────────────
function loadEnv() {
  const defines = {}
  try {
    const content = readFileSync(join(ROOT, '.env'), 'utf8')
    content.split('\n').forEach(line => {
      const [k, ...vs] = line.split('=')
      if (k && k.trim() && !k.startsWith('#') && k.trim().startsWith('VITE_')) {
        defines[`import.meta.env.${k.trim()}`] = JSON.stringify(vs.join('=').trim())
      }
    })
  } catch {}
  defines['import.meta.env.MODE'] = '"production"'
  defines['import.meta.env.DEV']  = 'false'
  defines['import.meta.env.PROD'] = 'true'
  defines['process.env.NODE_ENV'] = '"production"'
  return defines
}

// ── 3. Compile Tailwind CSS ───────────────────────────────────
console.log('🎨 Compiling Tailwind CSS...')
try {
  execSync(
    `./node_modules/.bin/tailwindcss -i ${SRC}/index.css -o ${DIST}/assets/style.css --minify`,
    { stdio: 'inherit' }
  )
} catch {
  // fallback: copy the CSS as-is (no Tailwind processing)
  console.warn('⚠  Tailwind CLI not available — using raw CSS')
  const css = readFileSync(join(SRC, 'index.css'), 'utf8')
  // Strip @tailwind directives (can't process without tailwindcss CLI)
  const stripped = css.replace(/@tailwind\s+\w+;/g, '').replace(/@import url\([^)]+\)/g, '').trim()
  writeFileSync(join(DIST, 'assets', 'style.css'), stripped)
}

// ── 4. Bundle JS with esbuild ────────────────────────────────
console.log('📦 Bundling JS...')
const result = await esbuild.build({
  entryPoints: [join(SRC, 'main.jsx')],
  bundle:      true,
  minify:      true,
  splitting:   false,
  format:      'esm',
  target:      ['es2020'],
  outfile:     join(DIST, 'assets', 'main.js'),
  sourcemap:   false,
  define:      loadEnv(),
  loader: {
    '.jsx': 'jsx',
    '.js':  'js',
    '.svg': 'dataurl',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.gif': 'dataurl',
  },
  jsx:            'automatic',
  jsxImportSource: 'react',
  alias: {
    '@': SRC,
  },
  logLevel: 'info',
})

if (result.errors.length) {
  console.error('❌ Build failed:', result.errors)
  process.exit(1)
}

// ── 5. Write index.html ──────────────────────────────────────
console.log('📝 Writing index.html...')
const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FutureFace — Strategy to Execution</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%23D4920E'/><text x='8' y='24' font-size='20' font-weight='900' font-family='sans-serif' fill='white'>F</text></svg>" />
    <link rel="stylesheet" href="/assets/style.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/main.js"></script>
  </body>
</html>`

writeFileSync(join(DIST, 'index.html'), html)

console.log('✅ Build complete → dist/')
console.log(`   dist/index.html`)
console.log(`   dist/assets/main.js`)
console.log(`   dist/assets/style.css`)
