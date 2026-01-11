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

  breadcrumb.innerHTML += '<a href="/">首页</a>'

  if (!currentPath) return

  const parts = currentPath.split('/')
  let acc = ''

  for (const p of parts) {
    acc += (acc ? '/' : '') + p
    breadcrumb.innerHTML +=
      '<span> / </span>' +
      `<a href="/?path=${encodeURIComponent(acc)}">${p}</a>`
  }
}

function render() {
  grid.innerHTML = ''
  pagination.innerHTML = ''

  const dirs = currentList.filter(i => i.type === 'dir')
  const files = currentList.filter(i => i.type === 'file')

  // 目录（相册）
  dirs.forEach(d => {
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <div class="skeleton" style="height:140px;border-radius:6px"></div>
      <div class="name">📁 ${d.name}</div>
    `
    div.onclick = () => {
      location.href = `/?path=${encodeURIComponent(d.path)}`
    }
    grid.appendChild(div)
  })

  // 图片分页
  const start = (page - 1) * PAGE_SIZE
  const pageFiles = files.slice(start, start + PAGE_SIZE)

  pageFiles.forEach(f => {
    const div = document.createElement('div')
    div.className = 'card'
    div.innerHTML = `
      <img loading="lazy" src="/${encodeURI(f.path)}">
      <div class="name">${f.name}</div>
      <button class="btn">复制链接</button>
    `
    div.querySelector('button').onclick = () => {
      navigator.clipboard.writeText(location.origin + '/' + f.path)
    }
    grid.appendChild(div)
  })

  // 分页器
  const totalPages = Math.ceil(文件.length / PAGE_SIZE)
  if (totalPages > 1) {
    for (let i = 1; i <= totalPages; i++) {
      const b = document.createElement('button')
      b.textContent = i
      if (i === page) b.disabled = true
      b.onclick = () => {
        const u = new URL(location.href)
        u.searchParams.set('page', i)
        location.href = u.toString()
      }
      pagination.appendChild(b)
    }
  }
}

renderBreadcrumb()
render()
