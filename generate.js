import fs from "fs";

const ROOT = "./";
const OUTPUT = "./index.html";

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

// 读取根目录文件
const files = fs.readdirSync(ROOT)
  .filter(f => IMAGE_EXT.test(f));

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>图片列表</title>
<style>
body {
  font-family: system-ui, -apple-system;
  background: #f5f5f5;
  padding: 20px;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.card {
  background: #fff;
  padding: 10px;
  border-radius: 8px;
}
img {
  width: 100%;
  border-radius: 4px;
}
input {
  width: 100%;
  margin-top: 6px;
  font-size: 12px;
}
button {
  width: 100%;
  margin-top: 6px;
  cursor: pointer;
}
</style>
</head>
<body>

<h1>图片列表</h1>

<div class="grid">
${files.map(f => `
<div class="card">
  <img src="${f}" loading="lazy">
  <input value="\${location.origin}/${f}" readonly>
  <button onclick="navigator.clipboard.writeText(this.previousElementSibling.value)">
    复制链接
  </button>
</div>
`).join("")}
</div>

</body>
</html>`;

fs.writeFileSync(OUTPUT, html);
