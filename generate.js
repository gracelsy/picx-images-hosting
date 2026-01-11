const fs = require("fs");
const path = require("path");

/* ================= 基础配置 ================= */

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;
const ROOT = process.cwd();

const IGNORE_DIRS = [".git", ".github", "image"];
const IGNORE_FILES = ["index.html", "images.json", "generate.js"];

/* ================= 扫描图片 ================= */

function scan(dir, base = "") {
  let list = [];
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith(".")) continue;
    if (IGNORE_FILES.includes(file) && base === "") continue;

    const full = path.join(dir, file);
    const rel = path.join(base, file).replace(/\\/g, "/");
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      if (IGNORE_DIRS.includes(file) && base === "") continue;
      list = list.concat(scan(full, rel));
    } else if (IMAGE_EXT.test(file)) {
      list.push({
        path: rel,
        name: file,
        size: stat.size,
      });
    }
  }
  return list;
}

const images = scan(ROOT).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync("images.json", JSON.stringify(images, null, 2));

/* ================= 构建目录树 ================= */

function buildTree(list) {
  const tree = {};
  list.forEach(img => {
    const parts = img.path.split("/");
    let node = tree;
    parts.forEach((p, i) => {
      if (!node[p]) node[p] = i === parts.length - 1 ? img : {};
      node = node[p];
    });
  });
  return tree;
}

const tree = buildTree(images);

/* ================= 样式 ================= */

const baseStyle = `
:root{
  --bg:#0d1117;
  --panel:#161b22;
  --border:#30363d;
  --text:#c9d1d9;
  --muted:#8b949e;
  --hover:#21262d;
}
*{box-sizing:border-box}
body{margin:0;font-family:system-ui;background:var(--bg);color:var(--text)}
a{text-decoration:none;color:inherit}
img{display:block;max-width:100%}
::-webkit-scrollbar{width:8px}
::-webkit-scrollbar-thumb{background:#30363d;border-radius:8px}
`;

/* ================= 目录树 HTML ================= */

function treeHTML(node) {
  return Object.entries(node).map(([k, v]) => {
    if (v.path) {
      return `
      <div class="tree-file" data-path="${v.path}">
        🖼 <span>${k}</span>
      </div>`;
    }
    return `
    <div class="tree-dir">
      <div class="tree-dir-title">📁 ${k}</div>
      <div class="tree-children">
        ${treeHTML(v)}
      </div>
    </div>`;
  }).join("");
}

/* ================= index.html ================= */

const indexHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Images</title>
<style>
${baseStyle}
.layout{display:flex;height:100vh}
.sidebar{
  width:260px;
  background:var(--panel);
  border-right:1px solid var(--border);
  padding:10px;
  overflow:auto;
}
.main{flex:1;padding:20px;overflow:auto}
.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:18px;
}
.card{
  background:var(--panel);
  border-radius:12px;
  padding:10px;
  transition:.2s;
}
.card:hover{transform:translateY(-4px)}
.card img{border-radius:8px}
.name{
  margin-top:6px;
  font-size:13px;
  color:var(--muted);
  word-break:break-all;
}

/* 目录树 */
.tree-dir-title,.tree-file{
  padding:6px 8px;
  border-radius:6px;
  cursor:pointer;
}
.tree-dir-title:hover,.tree-file:hover{
  background:var(--hover);
}
.tree-children{
  margin-left:14px;
  border-left:1px dashed var(--border);
  padding-left:8px;
}
.tree-dir.collapsed .tree-children{
  display:none;
}
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    ${treeHTML(tree)}
  </aside>
  <main class="main">
    <div class="grid">
      ${images.map(i=>`
      <div class="card">
        <a href="/image/?path=${encodeURIComponent(i.path)}">
          <img src="${i.path}" loading="lazy">
        </a>
        <div class="name">${i.name}</div>
      </div>`).join("")}
    </div>
  </main>
</div>

<script>
document.querySelectorAll(".tree-dir-title").forEach(t=>{
  t.onclick=()=>t.parentElement.classList.toggle("collapsed");
});
document.querySelectorAll(".tree-file").forEach(f=>{
  f.onclick=()=>location.href="/image/?path="+encodeURIComponent(f.dataset.path);
});
</script>
</body>
</html>
`;

fs.writeFileSync("index.html", indexHTML);

/* ================= 单图页 ================= */

fs.mkdirSync("image", { recursive: true });

const imageHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Image</title>
<style>
${baseStyle}
.viewer{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  gap:12px;
}
.controls button{
  background:var(--panel);
  border:1px solid var(--border);
  color:var(--text);
  padding:6px 10px;
  border-radius:6px;
  cursor:pointer;
}
.info{font-size:13px;color:var(--muted)}
</style>
</head>
<body>
<div class="viewer">
  <div class="controls">
    <button onclick="prev()">←</button>
    <button onclick="next()">→</button>
    <button onclick="history.back()">返回</button>
  </div>
  <img id="img">
  <div class="info" id="info"></div>
</div>

<script>
const images=${JSON.stringify(images)};
const q=new URLSearchParams(location.search);
const p=decodeURIComponent(q.get("path")||"");
const i=images.findIndex(x=>x.path===p);
const img=document.getElementById("img");
const info=document.getElementById("info");

if(i>=0){
  img.src=p;
  img.onload=()=>info.textContent=
    images[i].name+" | "+
    img.naturalWidth+"×"+img.naturalHeight+" | "+
    (images[i].size/1024).toFixed(1)+" KB";
}else{
  info.textContent="图片不存在";
}

function prev(){
  if(i>0)
    location.href="/image/?path="+encodeURIComponent(images[i-1].path);
}
function next(){
  if(i<images.length-1)
    location.href="/image/?path="+encodeURIComponent(images[i+1].path);
}
document.onkeydown=e=>{
  if(e.key==="ArrowLeft")prev();
  if(e.key==="ArrowRight")next();
};
</script>
</body>
</html>
`;

fs.writeFileSync("image/index.html", imageHTML);

console.log("✔ Site generated (stable)");
