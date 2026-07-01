/**
 * 408刷题助手 - Web 构建脚本
 * 将 Electron 项目构建为纯静态网站，用于 Cloudflare Pages 部署
 */
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SRC = path.join(ROOT, 'src');
const DATA = path.join(ROOT, 'data');
const OUT = path.join(ROOT, 'web-dist');

// 1. 清理输出目录
if (fs.existsSync(OUT)) {
  fs.rmSync(OUT, { recursive: true, force: true });
}
fs.mkdirSync(OUT, { recursive: true });

// 2. 复制 src/ 到 web-dist/
copyDir(SRC, OUT);

// 3. 生成 questions-data.js（从 data/questions.json）
const questions = JSON.parse(
  fs.readFileSync(path.join(DATA, 'questions.json'), 'utf-8')
);
const jsContent = '// 题库数据（内联，由 data/questions.json 自动生成，' + questions.length + ' 道题）\nwindow.__QUESTIONS__ = ' + JSON.stringify(questions) + ';\n';
fs.writeFileSync(path.join(OUT, 'questions-data.js'), jsContent, 'utf-8');
console.log('[build-web] Generated questions-data.js (' + questions.length + ' questions, ' + (jsContent.length / 1024).toFixed(0) + ' KB)');

// 4. 在 index.html 中注入 questions-data.js 引用
const indexPath = path.join(OUT, 'index.html');
let html = fs.readFileSync(indexPath, 'utf-8');
html = html.replace(
  '  <script src="js/state.js"></script>',
  '  <script src="questions-data.js"></script>\n  <script src="js/state.js"></script>'
);
fs.writeFileSync(indexPath, html, 'utf-8');
console.log('[build-web] Injected questions-data.js into index.html');

// 5. 统计
const files = getAllFiles(OUT);
console.log('[build-web] Done! Output: ' + OUT + ' (' + files.length + ' files)');

// --- helpers ---
function copyDir(src, dest) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function getAllFiles(dir) {
  const result = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      result.push(...getAllFiles(full));
    } else {
      result.push(full);
    }
  }
  return result;
}
