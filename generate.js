const fs = require("fs");

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const ROOT = "./";

const images = fs
  .readdirSync(ROOT)
  .filter(f => IMAGE_EXT.test(f))
  .sort((a, b) => a.localeCompare(b));

fs.writeFileSync(
  "images.json",
  JSON.stringify(images, null, 2)
);

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>图片列表</title>
<style>
body { font-family: system-ui; padding: 20px; background: #f5f5f5; }
input { padding: 8px; width: 300px; max-width: 100%; }
.grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card { background: #fff; padding: 10px; border-radius: 8px; }
img { width: 100%; border-radius: 4px; }
button { width: 100%; margin-top: 6px; cursor: pointer; }
.pagination { margin-top: 20px; }
.pagination button { margin-right: 6px; }
</style>
</head>
<body>

<h1>图片列表</h1>

<input id="search" placeholder="搜索文件名…" />

<div class="grid" id="grid"></div>
<div class="pagination" id="pagination"></div>

<script>
const PAGE_SIZE = 24;
let images = [];
let filtered = [];
let page = 1;

fetch('images.json')
  .then(r => r.json())
  .then(data => {
    images = data;
    filtered = images;
    render();
  });

document.getElementById('search').addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  filtered = images.filter(f => f.toLowerCase().includes(q));
  page = 1;
  render();
});

function render() {
  const grid = document.getElementById('grid');
  grid.innerHTML = '';

  const start = (page - 1) * PAGE_SIZE;
  const items = filtered.slice(start, start + PAGE_SIZE);

  for (const f of items) {
    grid.innerHTML += \`
      <div class="card">
        <img src="\${f}" loading="lazy">
        <button onclick="navigator.clipboard.writeText(location.origin + '/' + '\${f}')">
          复制链接
        </button>
      </div>\`;
  }

  renderPagination();
}

function renderPagination() {
  const total = Math.ceil(filtered.length / PAGE_SIZE);
  const p = document.getElementById('pagination');
  p.innerHTML = '';

  for (let i = 1; i <= total; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    if (i === page) btn.disabled = true;
    btn.onclick = () => {
      page = i;
      render();
    };
    p.appendChild(btn);
  }
}
</script>

</body>
</html>`;

fs.writeFileSync("index.html", html);
