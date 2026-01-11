const PAGE_SIZE = 24;

/* ========== 工具函数 ========== */

function getCurrentPath() {
  const params = new URLSearchParams(location.search);
  const path = params.get('path');
  return path ? decodeURIComponent(path) : '';
}

function setPath(path, page = 1) {
  const params = new URLSearchParams();
  if (path) params.set('path', path);
  if (page > 1) params.set('page', page);
  location.search = params.toString();
}

function findNode(list, path) {
  for (const item of list) {
    if (item.path === path) return item;
    if (item.children) {
      const found = findNode(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

/* ========== UI 渲染 ========== */

function renderBreadcrumb(path) {
  const breadcrumb = document.getElementById('breadcrumb');
  breadcrumb.innerHTML = '';

  const parts = path ? path.split('/') : [];
  let current = '';

  const root = document.createElement('a');
  root.textContent = '首页';
  root.href = '/';
  breadcrumb.appendChild(root);

  parts.forEach(part => {
    current += (current ? '/' : '') + part;
    const sep = document.createTextNode(' / ');
    const link = document.createElement('a');
    link.textContent = part;
    link.href = `/?path=${encodeURIComponent(current)}`;
    breadcrumb.appendChild(sep);
    breadcrumb.appendChild(link);
  });
}

function renderTree(list, container) {
  list.forEach(item => {
    const el = document.createElement('div');
    el.className = 'tree-item';

    if (item.type === 'dir') {
      el.textContent = '📁 ' + item.name;
      el.onclick = () => setPath(item.path);
      container.appendChild(el);

      if (item.children) {
        const sub = document.createElement('div');
        sub.className = 'tree-children';
        renderTree(item.children, sub);
        container.appendChild(sub);
      }
    }
  });
}

function renderGallery(files, page) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageItems = files.slice(start, end);

  pageItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'img-card';

    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = item.url;
    img.alt = item.name;

    const input = document.createElement('input');
    input.value = location.origin + item.url;
    input.readOnly = true;
    input.onclick = () => input.select();

    card.appendChild(img);
    card.appendChild(input);
    gallery.appendChild(card);
  });

  renderPagination(files.length, page);
}

function renderPagination(total, page) {
  const pager = document.getElementById('pager');
  pager.innerHTML = '';

  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return;

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.onclick = () => {
      const path = getCurrentPath();
      setPath(path, i);
    };
    pager.appendChild(btn);
  }
}

/* ========== 主入口（关键修复点） ========== */

async function init() {
  const params = new URLSearchParams(location.search);
  const page = parseInt(params.get('page') || '1', 10);
  const currentPath = getCurrentPath();

  const tree = await fetch('/file-tree.json').then(r => r.json());

  // 目录树
  const treeContainer = document.getElementById('tree');
  renderTree(tree, treeContainer);

  // 面包屑
  renderBreadcrumb(currentPath);

  // 当前目录
  const node = currentPath ? findNode(tree, currentPath) : { children: tree };

  if (!node || !node.children) return;

  const images = node.children.filter(i => i.type === 'file');
  renderGallery(images, page);
}

/* ========== 启动 ========== */

init();
