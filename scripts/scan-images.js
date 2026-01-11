import fs from "fs";
import path from "path";

const IMAGE_EXT = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
const ROOT = process.cwd();
const OUT = path.join(ROOT, "public/index.json");

function walk(dir, base = "") {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    if (e.name === "node_modules") continue;
    if (e.name === "dist") continue;
    if (e.name === "scripts") continue;
    if (e.name === "src") continue;

    const full = path.join(dir, e.name);
    const rel = path.join(base, e.name);

    if (e.isDirectory()) {
      files.push({
        type: "dir",
        name: e.name,
        path: "/" + rel.替换(/\\/g, "/"),
        children: walk(full, rel)
      });
    } else if (IMAGE_EXT.includes(path.extname(e.name).toLowerCase())) {
      files.push({
        type: "file",
        name: e.name,
        url: "/" + rel.替换(/\\/g, "/")
      });
    }
  }
  return files;
}

const tree = walk(ROOT);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(tree, null, 2));

console.log("✅ index.json generated");
