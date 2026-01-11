/**
 * generate.js
 * 扫描仓库中所有图片文件，生成 data.json
 * 支持任意目录 / 任意层级
 * 自动忽略站点自身文件，避免污染
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

/** 支持的图片格式 */
const IMG_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;

/** 必须忽略的目录 */
const IGNORE_DIRS = new Set([
  ".git",
  ".github",
  "node_modules",
  "image"          // 页面目录，不能扫描
]);

/** 必须忽略的文件 */
const IGNORE_FILES = new Set([
  "index.html",
  "data.json",
  "generate.js",
  "README.md",
  "package.json",
  "package-lock.json"
]);

function walk(dir, base = "") {
  let result = [];

  for (const name of fs.readdirSync(dir)) {
    if (name.startsWith(".")) continue;

    if (base === "" && IGNORE_DIRS.has(name)) continue;
    if (base === "" && IGNORE_FILES.has(name)) continue;

    const fullPath = path.join(dir, name);
    const relPath  = path.join(base, name).replace(/\\/g, "/");
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      result = result.concat(walk(fullPath, relPath));
    } else if (IMG_EXT.test(name)) {
      result.push({
        path: relPath,
        name: name,
        size: stat.size
      });
    }
  }

  return result;
}

const images = walk(ROOT);

/** 按路径排序，保证 prev / next 稳定 */
images.sort((a, b) => a.path.localeCompare(b.path, "zh-CN"));

fs.writeFileSync(
  path.join(ROOT, "data.json"),
  JSON.stringify(images, null, 2)
);

console.log(`✔ 已生成 data.json（${images.length} 张图片）`);
