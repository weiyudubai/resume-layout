# 简历排版助手

用 Markdown 写简历，左边编辑、右边实时排成 A4 纸面，一键导出 PDF 或图片。纯前端，不需要后端，简历数据只存在你自己的浏览器里。

**在线使用**：https://jianli.weiyudubai.com

## 功能

- **左写右看**：左边填基本信息、写 Markdown 正文，右边实时预览 A4 纸面；纸面可缩放，左栏可拖宽
- **四种主题**：极简风格 / 商务正式 / 互联网风 / 学术经典，一键切换
- **页尺**：纸面左侧标出内容排到一页的哪里，超出一页的部分用红色标出；顶栏实时显示预计页数
- **排版微调**：字号、行距、照片大小、页边距、字体五项都能调；照片可放大到 200%，页边距可收到 70%，方便把简历压进一页
- **三种导出**：PNG 图片、复制图片到剪贴板、PDF（走浏览器打印，文字可被 ATS 解析）；文件名自动用「日期-姓名-岗位」
- **版本存档**：给不同岗位各存一版，随时恢复；支持导出 / 导入 JSON 备份
- **数据本地**：内容存在浏览器 localStorage，不上传服务器；换浏览器或换域名时，用「版本 → 导出备份 / 导入备份」迁移

## 直接使用（不需要安装任何东西）

下载仓库根目录的 **`简历排版助手.html`**，双击用浏览器打开即可。所有功能都在这个文件里，离线也能用。

## 本地开发

需要 Node.js 20 以上（推荐 22）。

```bash
git clone https://github.com/weiyudubai/resume-layout.git
cd resume-layout/app
npm install
npm run dev      # 打开 http://localhost:5173
npm test         # 运行校验脚本
```

## 构建

```bash
cd app
npm run build             # 类型检查 + 打包到 app/dist/
python3 inline_build.py   # 可选：内联成单文件 HTML
```

- `app/dist/`：普通静态站点，可直接部署到任意静态托管
- `简历排版助手.html`：单文件版，双击即用

## 自己部署

把 `app/dist/` 里的文件上传到任意静态服务器（Nginx、Caddy、Cloudflare Pages、Vercel 等）即可，不需要后端。

本仓库的线上示例由维护者自行部署，不包含服务器配置；你部署时换成自己的域名。

## 技术栈

React 19 + TypeScript + Vite 7 + Tailwind CSS 3.4；图标用 lucide-react，图片导出用 html-to-image；单文件版由 Python 脚本把 JS/CSS 内联生成。

## 目录

```text
app/                  源码（Vite 项目）
  src/                组件与逻辑
  scripts/            校验脚本（npm test）
  inline_build.py     生成单文件 HTML
简历排版助手.html      构建好的单文件版
```

## 说明

- 默认数据是示例「张三」，第一次打开可以直接改
- 导出 PDF 时建议选 A4、边距「默认」或「无」，并关掉浏览器自带的页眉页脚
- 仓库不包含任何个人简历数据
