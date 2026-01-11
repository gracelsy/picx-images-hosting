const fs = require("fs");
const path = require("path");

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg)$/i;
const ROOT = process.cwd();

function walk(dir, base = "") {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    if (f.startsWith(".") || f === "node_modules") continue;

    const full = path.join(dir, f);
    const rel = path.join(base, f).replace(/\\/g, "/");
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      out = out.concat(walk(full, rel));
    } else if (IMG_EXT.test(f)) {
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
fs.writeFileSync("data.json", JSON.stringify(images, null, 2));
console.log("✔ data.json generated");
