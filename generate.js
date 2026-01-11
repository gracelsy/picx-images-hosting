const fs = require("fs");
const path = require("path");

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;
const ROOT = process.cwd();

/* ---------- 扫描图片 ---------- */
function scan(dir, base = "") {
  let list = [];
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith(".")) continue;
    const full = path.join(dir, file);
    const rel = path.join(base, file).replace(/\\/g, "/");
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      list = list.concat(scan(full, rel));
    } else if (IMAGE_EXT.test(file)) {
      list.push({
        path: rel,
        name: file,
        size: stat.size,
        mtime: stat.mtimeMs,
      });
    }
  }
  return list;
}

const images = scan(ROOT).sort((a, b) => a.path.localeCompare(b.path));
fs.writeFileSync("images.json", JSON.stringify(images, null, 2));

/* ---------- 目录树 ---------- */
function buildTree(list) {
  const tree = {};
  list.forEach(img => {
    const parts = img.path.split("/");
    let node = tree;
    parts.forEach((p, i) => {
      node[p] = node[p] || (i === parts.length - 1 ? img : {});
      node = node[p];
    });
  });
  return tree;
}

const tree = buildTree(images);

/* ---------- HTML 公共 ---------- */
const baseStyle = `
body{margin:0;font-family:system-ui;background:#0d1117;color:#c9d1d9}
a{color:inherit;text-decoration:none}
img{max-width:100%}
button{cursor:pointer}
`;

function treeHTML(node, prefix = "") {
  return Object.entries(node).map(([k, v]) => {
    if (v.path) {
      return `<div class="file">
        <a href="image/?path=${encodeURIComponent(v.path)}">${k}</a>
      </div>`;
    }
    return `<details open>
      <summary>${k}</summary>
      <div class="dir">${treeHTML(v, prefix + k + "/")}</div>
    </details>`;
  }).join("");
}

/* ---------- index.html ---------- */
const indexHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Image Hosting</title>
<style>
${baseStyle}
.layout{display:flex;height:100vh}
.sidebar{width:260px;overflow:auto;border-right:1px solid #30363d;padding:10px}
.main{flex:1;overflow:auto;padding:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px}
.card{background:#161b22;border-radius:10px;padding:10px}
.card img{border-radius:6px}
.name{font-size:12px;margin-top:6px;word-break:break-all}
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">${treeHTML(tree)}</aside>
  <main class="main">
    <div class="grid">
      ${images.map(i => `
      <div class="card">
        <a href="image/?path=${encodeURIComponent(i.path)}">
          <img src="${i.path}" loading="lazy"/>
        </a>
        <div class="name">${i.name}</div>
      </div>`).join("")}
    </div>
  </main>
</div>
</body>
</html>
`;

fs.writeFileSync("index.html", indexHTML);

/* ---------- image/index.html ---------- */
fs.mkdirSync("image", { recursive: true });

const imageHTML = `
<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Image</title>
<style>
${baseStyle}
.viewer{display:flex;flex-direction:column;align-items:center;padding:20px}
.nav{margin:10px}
.info{font-size:13px;opacity:.7}
</style>
</head>
<body>
<div class="viewer">
  <div class="nav">
    <button onclick="prev()">←</button>
    <button onclick="next()">→</button>
    <button onclick="history.back()">返回</button>
  </div>
  <img id="img"/>
  <div class="info" id="info"></div>
</div>

<script>
const images = ${JSON.stringify(images)};
const q = new URLSearchParams(location.search);
const path = q.get("path");
const idx = images.findIndex(i=>i.path===path);
const img = document.getElementById("img");
const info = document.getElementById("info");

if(idx>=0){
  img.src = path;
  img.onload=()=>info.textContent =
    images[idx].name + " | " +
    img.naturalWidth+"×"+img.naturalHeight+" | " +
    (images[idx].size/1024).toFixed(1)+"KB";
}

function prev(){ if(idx>0) location.href="image/?path="+encodeURIComponent(images[idx-1].path); }
function next(){ if(idx<images.length-1) location.href="image/?path="+encodeURIComponent(images[idx+1].path); }

document.onkeydown=e=>{
  if(e.key==="ArrowLeft")prev();
  if(e.key==="ArrowRight")next();
}
</script>
</body>
</html>
`;

fs.writeFileSync("image/index.html", imageHTML);

console.log("✔ Site generated");
