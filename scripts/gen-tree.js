import fs from 'fs'
import path from 'path'

const root = process.cwd()
const output = path.join(root, 'site/public/file-tree.json')

const ignore = new Set([
  '.git',
  'node_modules',
  'site',
  'dist',
  'scripts',
  'package.json',
  'vite.config.js'
])

function scan(dir, base = '') {
  const list = []

  for (const name of fs.readdirSync(dir)) {
    if (ignore.has(name)) continue

    const full = path.join(dir, name)
    const stat = fs.statSync(full)
    const rel = path.posix.join(base, name)

    if (stat.isDirectory()) {
      list.push({
        type: 'dir',
        name,
        path: rel,
        children: scan(full, rel)
      })
    } else if (/\.(png|jpe?g|gif|webp)$/i.test(name)) {
      list.push({
        type: 'file',
        name,
        path: rel
      })
    }
  }

  return list
}

fs.mkdirSync(path.dirname(output), { recursive: true })
fs.writeFileSync(output, JSON.stringify(scan(root), null, 2))
