# 淘籍籍（二手书交易平台）— AGENTS.md

## 项目概述

**淘籍籍**是一个 C2C 二手图书在线交易平台，核心理念是"旧书不旧，淘出惊喜"。
用户可以在平台上发布闲置书籍、浏览淘选心仪图书、在线下单购买，以及通过站内聊天实现买卖沟通。

- 品牌名：淘籍籍
- tagline：旧书不旧，淘出惊喜
- 项目类型：Vue 3 SPA 前端
- 目标用户：学生、书友、二手书爱好者

---

## 技术与依赖

| 类别 | 技术栈 |
|------|--------|
| 框架 | Vue 3.5（Composition API + `<script setup>`） |
| 构建 | Vite 8 |
| UI 库 | Element Plus 2.13 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 5（Hash 模式已关闭，使用 History 模式） |
| HTTP | Axios 1.16 |
| 语言 | TypeScript 6（部分）、JavaScript（视图组件以 JS 为主） |
| 代码检查 | ESLint + oxlint + Prettier |
| 测试 | Vitest（单元）、Playwright（e2e） |

---

## 部署架构

```
GitHub Pages（前端静态文件）
    ↓ API 请求
阿里云服务器 121.199.31.208
  ├── Nginx (端口 80, --network host)
  │   ├── /             → 前端静态文件 (/root/frontend-static/)
  │   ├── /api/*        → proxy_pass 127.0.0.1:8080
  │   ├── /img/*        → proxy_pass 127.0.0.1:8080
  │   └── /ws/*         → proxy_pass 127.0.0.1:8080 (WebSocket)
  ├── Spring Boot (端口 8080, --network host)
  │   ├── MySQL (宿主机 127.0.0.1:3306)
  │   └── Redis (Docker 127.0.0.1:6379)
  └── Docker 容器
      ├── book-trade-backend (Java 17, --network host)
      ├── book-trade-redis (redis:7-alpine)
      └── book-trade-nginx (nginx:alpine, --network host)
```

**关键配置：**
- 前端 API 地址：环境变量 `VITE_API_BASE_URL=http://121.199.31.208`
- WebSocket 地址：环境变量 `VITE_WS_URL=ws://121.199.31.208/ws/chat`
- 图片 URL 拼接：`(import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") + path`
- Nginx: `--network host` 模式，配置文件 `/etc/nginx/conf.d/default.conf`

---

## 项目结构

```
book-trade-frontend/
├── index.html                   # 入口 HTML
├── vite.config.js               # Vite 配置
├── src/
│   ├── api/
│   │   └── request.js           # Axios 封装 (baseURL 来自 VITE_API_BASE_URL)
│   ├── router/
│   │   └── index.js             # 路由表 + 全局守卫
│   ├── stores/
│   └── views/
│       ├── BookDetail.vue       # 图书详情（图片用 getImageUrl 拼接）
│       ├── ChatRoom.vue         # 聊天室（图片上传走 API baseURL）
│       ├── SellerPage.vue       # 卖家页面（图片用环境变量）
│       └── ...
```

---

## 新增功能开发流程

```bash
# 1. 本地开发
npm run dev          # http://localhost:5173，代理到 localhost:8080

# 2. 本地构建测试
npm run build

# 3. 推送到 GitHub（自动部署到 GitHub Pages）
git add -A
git commit -m "feat: 新功能描述"
git push

# 4. 部署到服务器（如果涉及前端文件变更）
#    本地 dist/ 构建好后，通过 deploy.sh 脚本传到服务器
```

---

## 生产构建与部署

```bash
npm run build
# dist/ 目录包含：
#   index.html
#   assets/index-xxx.js
#   assets/index-xxx.css
```

**部署到服务器：**
1. 本地构建后，用 base64 脚本传文件到服务器 `/root/frontend-static/`
2. 或推 GitHub 后从 GitHub Pages 下载

---

## 设计规范

### 视觉风格
- **主色调**：暖木棕渐变（`#3d2413 → #8b5e3c → #a0712a`），体现书籍木质感和温暖氛围
- **按钮色**：金色渐变（`#d4943e → #f0b45e`），与暖色背景协调且有对比度
- **登录页**：液态玻璃风格卡片，全屏浮动书籍 emoji 动画，品牌左区 + 表单右区
- **首页**：fixed 搜索栏（圆角 50px），sticky 导航栏，卡片网格布局
- **整体背景**：`#f5f0eb` 暖灰底色

### 代码约定
- 使用 `@/` 别名引用 `src/` 目录
- 全局样式放在 `App.vue` 的非 scoped `<style>` 块中
- 页面级样式使用 `<style scoped>`
- Pinia store 使用 Setup Store 风格（`defineStore` + `setup()`）
- 所有中文 UI 文本直接硬编码在模板中（未使用 i18n）
- **图片地址：必须用环境变量拼接，不要硬编码 `localhost:8080`**
  - ✅ `(import.meta.env.VITE_API_BASE_URL || "http://localhost:8080") + path`
  - ❌ `"http://localhost:8080" + path`

---

## 开发命令

```bash
npm run dev          # 启动开发服务器（默认 http://localhost:5173）
npm run build        # 生产构建
npm run preview      # 预览生产构建
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run test:unit    # 运行单元测试
npm run test:e2e     # 运行 e2e 测试
```
