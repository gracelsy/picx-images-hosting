// scripts/gen-tree.js 关键片段示例

function walk(dir, base = '') {
  const items = fs.readdirSync(dir, { withFileTypes: true });

  return items.map(item => {
    const fullPath = path.join(dir, item.name);
    const relPath = path.posix.join(base, item.name);

    if (item.isDirectory()) {
      return {
        type: 'dir',
        name: item.name,
        path: relPath,
        children: walk(fullPath, relPath)
      };
    } else if (isImage(item.name)) {
      return {
        type: 'file',
        name: item.name,
        path: relPath,
        url: '/' + relPath   // ⭐⭐⭐ 关键
      };
    }
  }).filter(Boolean);
}
