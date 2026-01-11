const fs = require("fs");
const path = require("path");

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const ROOT = process.cwd();

function walk(dir, base=""){
  let out = [];
  for(const f of fs.readdirSync(dir)){
    if(f.startsWith(".")) continue;
    const full = path.join(dir,f);
    const rel  = path.join(base,f).replace(/\\/g,"/");
    const stat = fs.statSync(full);
    if(stat.isDirectory()){
      out = out.concat(walk(full,rel));
    }else if(IMG_EXT.test(f)){
      out.push({
        path: rel,
        name: f,
        size: stat.size
      });
    }
  }
  return out;
}

const images = walk(ROOT);
fs.writeFileSync("data.json", JSON.stringify(images,null,2));

/* ---------- index.html ---------- */

const indexHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Images</title>
<style>
body{margin:0;display:flex;font-family:system-ui;background:#0d1117;color:#c9d1d9}
aside{width:260px;background:#161b22;padding:10px;overflow:auto}
main{flex:1;padding:16px}
.tree div{cursor:pointer;padding:4px 6px;border-radius:6px}
.tree div:hover{background:#21262d}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.card{background:#161b22;border-radius:10px;padding:8px}
.card img{width:100%;height:140px;object-fit:contain;background:#000;border-radius:6px}
.card span{display:block;font-size:13px;margin-top:6px;word-break:break-all}
.ctx-menu{position:fixed;display:none;z-index:999;background:#161b22;border:1px solid #30363d;border-radius:10px;padding:6px}
.ctx-menu div{padding:6px 10px;border-radius:6px;cursor:pointer}
.ctx-menu div:hover{background:#21262d}
</style>
</head>
<body>

<aside>
  <div class="tree" id="tree"></div>
</aside>

<main>
  <div class="grid" id="grid"></div>
</main>

<div id="ctx" class="ctx-menu">
  <div onclick="copyUrl()">复制图片链接</div>
  <div onclick="copyMd()">复制 Markdown</div>
  <div onclick="openNew()">新标签打开</div>
  <div onclick="preview()">预览</div>
</div>

<script>
const BASE = location.origin + "/";
let ctxPath = "";

fetch("/data.json").then(r=>r.json()).then(list=>{
  renderTree(list);
  renderGrid(list);
});

function renderTree(list){
  const dirs = {};
  list.forEach(i=>{
    const d = i.path.split("/").slice(0,-1).join("/") || "/";
    dirs[d]=1;
  });
  const t = document.getElementById("tree");
  Object.keys(dirs).sort().forEach(d=>{
    const div=document.createElement("div");
    div.textContent=d;
    div.onclick=()=>renderGrid(list.filter(i=>i.path.startsWith(d=="/"?"":d)));
    t.appendChild(div);
  });
}

function renderGrid(list){
  const g=document.getElementById("grid");
  g.innerHTML="";
  list.forEach(i=>{
    const d=document.createElement("div");
    d.className="card";
    d.innerHTML=\`
      <img src="/\${i.path}" data-path="\${i.path}">
      <span>\${i.name}</span>\`;
    d.querySelector("img").onclick=()=>location.href="/image/?path="+encodeURIComponent(i.path);
    g.appendChild(d);
  });
}

/* 右键 */
document.addEventListener("contextmenu",e=>{
  const img=e.target.closest("img[data-path]");
  if(!img) return;
  e.preventDefault();
  ctxPath=img.dataset.path;
  const m=document.getElementById("ctx");
  m.style.display="block";
  m.style.left=e.clientX+"px";
  m.style.top=e.clientY+"px";
});
document.addEventListener("click",()=>ctx.style.display="none");

function copyUrl(){navigator.clipboard.writeText(BASE+ctxPath)}
function copyMd(){navigator.clipboard.writeText("![]("+BASE+ctxPath+")")}
function openNew(){window.open(BASE+ctxPath,"_blank")}
function preview(){location.href="/image/?path="+encodeURIComponent(ctxPath)}
</script>
</body>
</html>`;

fs.writeFileSync("index.html", indexHtml);

/* ---------- image/index.html ---------- */

fs.mkdirSync("image",{recursive:true});

const imageHtml = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Image</title>
<style>
body{margin:0;background:#0d1117;color:#c9d1d9;display:flex;flex-direction:column;align-items:center}
img{max-width:90vw;max-height:80vh;margin-top:20px}
nav{margin-top:10px}
button{margin:0 6px}
</style>
</head>
<body>

<img id="img">

<nav>
<button onclick="prev()">上一张</button>
<button onclick="next()">下一张</button>
</nav>

<script>
const p=new URLSearchParams(location.search).get("path");
fetch("/data.json").then(r=>r.json()).then(list=>{
  const idx=list.findIndex(i=>i.path===p);
  const img=document.getElementById("img");
  img.src="/"+p;
  window.prev=()=>idx>0 && (location.href="/image/?path="+encodeURIComponent(list[idx-1].path));
  window.next=()=>idx<list.length-1 && (location.href="/image/?path="+encodeURIComponent(list[idx+1].path));
});
</script>
</body>
</html>`;

fs.writeFileSync("image/index.html", imageHtml);

console.log("generated");
