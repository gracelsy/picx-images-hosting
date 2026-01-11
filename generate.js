const fs = require("fs");
const path = require("path");

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const PAGE_SIZE = 24;

/* ================= 扫描图片 ================= */

function walk(dir, base = "") {
  let res = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith(".")) continue;

    const full = path.join(dir, e.name);
    const rel = path.join(base, e.name).replace(/\\/g, "/");

    if (e.isDirectory()) {
      res = res.concat(walk(full, rel));
    } else if (IMAGE_EXT.test(e.name)) {
      const stat = fs.statSync(full);
      res.push({
        path: rel,
        dir: base || "/",
        name: e.name,
        size: stat.size
      });
    }
  }
  return res;
}

const images = walk(".")
  .filter(i => !["index.html", "image.html", "images.json"].includes(i.path))
  .sort((a, b) => a.path.localeCompare(b.path));

fs.writeFileSync("images.json", JSON.stringify(images, null, 2));

/* ================= 目录树 ================= */

function buildTree(list) {
  const tree = {};
  for (const i of list) {
    const parts = i.path.split("/");
    let cur = tree;
    for (const p of parts.slice(0, -1)) {
      cur[p] = cur[p] || {};
      cur = cur[p];
    }
  }
  return tree;
}

const tree = buildTree(images);

/* ================= index.html ================= */

const indexHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>图片库</title>

<style>
:root {
  --bg:#f6f7f8;
  --panel:#fff;
  --border:#e5e7eb;
  --text:#111827;
  --muted:#6b7280;
  --primary:#1677ff;
  --radius:14px;
}

*{box-sizing:border-box}
body{
  margin:0;
  font-family:system-ui;
  background:var(--bg);
  color:var(--text);
}

.container{display:flex;height:100vh}

/* ===== 目录树 ===== */

.sidebar{
  width:260px;
  background:var(--panel);
  border-right:1px solid var(--border);
  padding:14px 12px;
  overflow:auto;
}

.tree ul{list-style:none;padding-left:14px;margin:6px 0}
.tree li{font-size:14px}

.node{
  display:flex;
  align-items:center;
  gap:4px;
  padding:4px 6px;
  border-radius:6px;
}
.node:hover{background:#f3f4f6}

.arrow{
  width:14px;
  cursor:pointer;
  transition:transform .2s ease;
  color:var(--muted);
}
.arrow.open{transform:rotate(90deg)}

.label{cursor:pointer}
.label.active{color:var(--primary);font-weight:600}

.children{
  max-height:0;
  overflow:hidden;
  transition:max-height .25s ease;
}
.children.open{max-height:600px}

/* ===== 主区域 ===== */

.main{flex:1;padding:24px 28px;overflow:auto}

.breadcrumb{
  font-size:14px;
  color:var(--muted);
  margin-bottom:16px;
}

.toolbar{
  display:flex;
  justify-content:space-between;
  margin-bottom:18px;
}
.toolbar input{
  width:260px;
  padding:8px 10px;
  border-radius:8px;
  border:1px solid var(--border);
}

/* ===== 图片 ===== */

.grid{
  display:grid;
  grid-template-columns:repeat(auto-fill,minmax(220px,1fr));
  gap:18px;
}

.card{
  background:var(--panel);
  border-radius:var(--radius);
  overflow:hidden;
  box-shadow:0 6px 20px rgba(0,0,0,.06);
  transition:.18s;
}
.card:hover{
  transform:translateY(-4px);
  box-shadow:0 12px 28px rgba(0,0,0,.12);
}

.card img{
  width:100%;
  aspect-ratio:1/1;
  object-fit:cover;
  display:block;
}

.meta{padding:10px 12px;font-size:13px}
.meta .name{
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.meta .size{color:var(--muted)}

/* ===== 分页 ===== */

.pagination{
  margin:28px 0 10px;
  text-align:center;
}
.pagination button{
  min-width:34px;
  margin:0 4px;
  padding:6px 10px;
  border-radius:8px;
  border:1px solid var(--border);
  background:var(--panel);
}
.pagination button:disabled{
  background:var(--primary);
  color:#fff;
  border-color:var(--primary);
}
</style>
</head>

<body>
<div class="container">
  <div class="sidebar">
    <div class="tree" id="tree"></div>
  </div>

  <div class="main">
    <div class="breadcrumb" id="breadcrumb"></div>

    <div class="toolbar">
      <input id="search" placeholder="搜索文件名">
    </div>

    <div class="grid" id="grid"></div>
    <div class="pagination" id="pager"></div>
  </div>
</div>

<script>
const images=${JSON.stringify(images)};
const tree=${JSON.stringify(tree)};
const PAGE=${PAGE_SIZE};

/* ===== URL 状态 ===== */

function getQuery(){
  const p=new URLSearchParams(location.search);
  return{
    dir:p.get("dir")||"/",
    page:+p.get("page")||1,
    q:p.get("q")||""
  }
}
function setQuery(s,r=false){
  const p=new URLSearchParams();
  if(s.dir!=="/")p.set("dir",s.dir);
  if(s.page>1)p.set("page",s.page);
  if(s.q)p.set("q",s.q);
  history[r?"replaceState":"pushState"](s,"","?"+p.toString());
}

/* ===== 初始化 ===== */

const init=getQuery();
let dir=init.dir;
let page=init.page;
let keyword=init.q;

/* ===== 目录树 ===== */

function renderTree(node,base=""){
  let html="<ul>";
  for(const k in node){
    const p=base?base+"/"+k:k;
    const has=Object.keys(node[k]).length;
    html+=\`
      <li>
        <div class="node">
          <span class="arrow \${has?"":"hidden"}" onclick="toggle(this)">▶</span>
          <span class="label" onclick="setDir('\${p}',this)">\${k}</span>
        </div>
        <div class="children">\${has?renderTree(node[k],p):""}</div>
      </li>\`;
  }
  return html+"</ul>";
}

document.getElementById("tree").innerHTML=renderTree(tree);

/* ===== 行为 ===== */

function toggle(el){
  el.classList.toggle("open");
  el.parentElement.nextElementSibling.classList.toggle("open");
}

function setDir(d,el){
  dir=d;page=1;
  document.querySelectorAll(".label").forEach(e=>e.classList.remove("active"));
  el.classList.add("active");
  setQuery({dir,page,q:keyword});
  render();
}

document.getElementById("search").value=keyword;
document.getElementById("search").oninput=e=>{
  keyword=e.target.value.toLowerCase();
  page=1;
  setQuery({dir,page,q:keyword});
  render();
};

window.onpopstate=e=>{
  const s=e.state||getQuery();
  dir=s.dir;page=s.page;keyword=s.q;
  document.getElementById("search").value=keyword;
  render();
};

/* ===== 渲染 ===== */

function render(){
  const list=images.filter(i=>
    (dir==="/" ? i.dir==="/" : i.dir===dir) &&
    i.name.toLowerCase().includes(keyword)
  );
  const total=Math.ceil(list.length/PAGE);
  const data=list.slice((page-1)*PAGE,page*PAGE);

  document.getElementById("breadcrumb").innerText="首页 / "+dir;
  document.getElementById("grid").innerHTML=data.map(i=>\`
    <div class="card">
      <a href="image.html?path=\${encodeURIComponent(i.path)}">
        <img src="\${i.path}" loading="lazy">
      </a>
      <div class="meta">
        <div class="name">\${i.name}</div>
        <div class="size">\${(i.size/1024).toFixed(1)} KB</div>
      </div>
    </div>\`).join("");

  document.getElementById("pager").innerHTML=
    Array.from({length:total},(_,i)=>\`
      <button onclick="page=\${i+1};setQuery({dir,page,q:keyword});render()"
      \${page===i+1?"disabled":""}>\${i+1}</button>\`).join("");
}

setQuery({dir,page,q:keyword},true);
render();
</script>
</body>
</html>`;

fs.writeFileSync("index.html", indexHtml);

/* ================= image.html ================= */

const imageHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>图片详情</title>
<style>
body{
  margin:0;
  padding:32px;
  background:#f6f7f8;
  font-family:system-ui;
}
.wrapper{max-width:1100px;margin:auto}
.breadcrumb{color:#6b7280;margin-bottom:16px}
.viewer{
  background:#fff;
  padding:24px;
  border-radius:18px;
  box-shadow:0 12px 30px rgba(0,0,0,.08);
}
.viewer img{
  max-width:100%;
  max-height:70vh;
  display:block;
  margin:auto;
  border-radius:12px;
}
.info{margin-top:16px;font-size:14px;color:#374151}
.actions{margin-top:18px}
.actions button{
  padding:8px 14px;
  border-radius:10px;
  border:1px solid #e5e7eb;
  background:#fff;
}
</style>
</head>

<body>
<div class="wrapper">
  <div class="breadcrumb" id="bc"></div>
  <div class="viewer">
    <img id="img">
    <div class="info" id="info"></div>
    <div class="actions">
      <button id="prev">上一张</button>
      <button id="next">下一张</button>
      <button onclick="history.back()">返回</button>
    </div>
  </div>
</div>

<script>
const images=${JSON.stringify(images)};
const p=new URLSearchParams(location.search).get("path");
const idx=images.findIndex(i=>i.path===p);
const img=document.getElementById("img");

img.src=p;
img.onload=()=>{
  const i=images[idx];
  document.getElementById("info").innerHTML=
    "文件名："+i.name+
    "<br>路径："+p+
    "<br>分辨率："+img.naturalWidth+" × "+img.naturalHeight+
    "<br>大小："+(i.size/1024).toFixed(1)+" KB"+
    "<br><button onclick=\\"navigator.clipboard.writeText(location.origin+'/"+p+"')\\">复制直链</button>";
};

document.getElementById("prev").onclick=()=>{
  if(idx>0)location.href="image.html?path="+encodeURIComponent(images[idx-1].path);
};
document.getElementById("next").onclick=()=>{
  if(idx<images.length-1)location.href="image.html?path="+encodeURIComponent(images[idx+1].path);
};
document.getElementById("bc").innerText="首页 / "+p;
</script>
</body>
</html>`;

fs.writeFileSync("image.html", imageHtml);
