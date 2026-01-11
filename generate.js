const fs = require('fs');
const path = require('path');

// 支持的图片格式
const SUPPORTED_FORMATS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];
// 图片目录
const IMAGE_DIR = './images';
// 输出的清单文件
const OUTPUT_FILE = './image-list.json';

// 读取图片目录并生成清单
function generateImageList() {
  try {
    // 确保images目录存在
    if (!fs.existsSync(IMAGE_DIR)) {
      fs.mkdirSync(IMAGE_DIR, { recursive: true });
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify([], null, 2), 'utf8');
      console.log('已创建空的图片清单文件');
      return;
    }

    // 读取目录下所有文件
    const files = fs.readdirSync(IMAGE_DIR);
    const imageList = [];

    // 过滤并整理图片信息
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase();
      if (SUPPORTED_FORMATS.includes(ext)) {
        imageList.push({
          name: file,
          url: `/images/${file}`,
          size: formatFileSize(fs.statSync(path.join(IMAGE_DIR, file)).size)
        });
      }
    });

    // 写入清单文件
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(imageList, null, 2), 'utf8');
    console.log(`成功生成图片清单，共${imageList.length}张图片`);
  } catch (error) {
    console.error('生成图片清单失败：', error);
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
