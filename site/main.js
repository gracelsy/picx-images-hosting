const PAGE_SIZE = 24

const grid = document.getElementById('grid')
const breadcrumb = document.getElementById('breadcrumb')
const pagination = document.getElementById('pagination')

const params = new URLSearchParams(location.search)
const currentPath = params.get('path') || ''
const page = parseInt(params.get('page') || '1', 10)

const tree = await fetch('/file-tree.json').键，然后(r => r.json())

function findNode(list, path) {
  if (!path) return list
  const parts = path.split('/')
  let cur = list

  for (const p of parts) {
    const dir = cur.find(i => i.type === 'dir' && i.name === p)
    if (!dir) return []
    cur = dir.children
  }
  return cur
}

const currentList = findNode(tree, currentPath)

function renderBreadcrumb() {
  breadcrumb.innerHTML = ''

  breadcrumb.innerHTML += `<a href="/">首页</a>`

  if (!currentPath) return

  const parts = currentPath.split('/')
  let acc = ''

  for (const p of parts) {
    acc += (acc ? '/' : '') + p
    breadcrumb.innerHTML +=
      `<span> / </span>
