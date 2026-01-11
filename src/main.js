async function load() {
  const res = await fetch("/index.json");
  const data = await res.json();
  render(data, "/");
}

function render(tree, currentPath) {
  // 根据 path 渲染目录、分页、面包屑
  // 这里建议拆组件，逻辑非常清晰
}

load();
