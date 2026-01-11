const fs = require('fs');
const path = require('path');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
// 要排除的非图片文件（避免扫描脚本/页面文件）
const EXCLUDE_FILES = ['index.html', 'generate.js', 'image-list.json', 'package.json', 'package-lock.json'];
// 输出的清单文件
const OUTPUT_FILE = './image-list.json';

// 读取根目录并生成图片清单
function generateImageList() {
  try {
    // 读取根目录下所有文件
    const files = fs.readdirSync('./');
    const imageList = [];

    // 过滤并整理图片信息
    files.forEach(file => {
      // 排除指定文件
      if (EXCLUDE_FILES.includes(file)) return;
      
      // 过滤图片格式
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        imageList.push({
          name: file,
          url: `/${file}`,  // 根目录图片的URL
          size: formatFileSize(fs.statSync(file).size)
        });
      }
    });

    // 写入清单文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageList, null, 2), 'utf8');
    console.log(`✅ 成功生成图片清单，共${imageList.length}张图片`);
  } catch (error) {
    console.error('❌ 生成图片清单失败：', error);
    // 生成空清单避免前端报错
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}

// 格式化文件大小
function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 执行脚本
generateImageList();
