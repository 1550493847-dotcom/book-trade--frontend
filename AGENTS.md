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

## 项目结构

```
book-trade-frontend/
├── index.html                   # 入口 HTML，页面标题「淘籍籍 - 二手书交易平台」
├── vite.config.js               # Vite 配置
├── tsconfig.json                # TypeScript 配置
├── package.json                 # 依赖与脚本
├── public/
│   └── favicon.ico
├── src/
│   ├── main.js                  # 应用入口，挂载 Vue/ElementPlus/Router
│   ├── App.vue                  # 根组件（全局布局：顶部导航 + 搜索栏 + router-view）
│   ├── api/
│   │   └── request.js           # Axios 封装（baseURL: localhost:8080，token 拦截器）
│   ├── router/
│   │   └── index.js             # 路由表 + 全局守卫
│   ├── stores/
│   │   └── counter.ts           # Pinia 示例 store（待替换为实际业务 store）
│   └── views/
│       ├── HomePage.vue         # 首页：图书列表 + 分类筛选 + 排序 + 分页
│       ├── Login.vue            # 登录/注册（液态玻璃设计）
│       ├── BookDetail.vue       # 图书详情：轮播图 + 购买 + 收藏 + 联系卖家
│       ├── PublishBook.vue      # 发布图书（含图片上传）
│       ├── MyBooks.vue          # 我的图书：上架/下架/编辑/删除
│       ├── MyOrders.vue         # 我的订单：买入/卖出两栏 + 取消/发货/确认收货
│       ├── OrderDetail.vue      # 订单详情：状态步骤条 + 全流程操作
│       ├── UserInfo.vue         # 个人信息（查看/编辑头像、昵称、联系方式）
│       ├── ChangePassword.vue   # 修改密码
│       ├── MyFavorites.vue      # 我的收藏（购物车替代）
│       ├── ChatList.vue         # 会话列表
│       ├── ChatRoom.vue         # 聊天室（一对一）
│       ├── ReviewPage.vue       # 订单评价
│       ├── Notifications.vue    # 消息通知（系统/交易两栏）
│       └── __tests__/           # 测试文件
```

---

## 路由表（14 个页面）

| 路径 | 页面 | 需要登录 |
|------|------|----------|
| `/` | HomePage（首页） | 否 |
| `/login` | Login（登录/注册） | 否 |
| `/book/:id` | BookDetail（图书详情） | 否 |
| `/publish` | PublishBook（发布商品） | ✅ |
| `/my-books` | MyBooks（我的商品） | ✅ |
| `/orders` | MyOrders（我的订单） | ✅ |
| `/order/:id` | OrderDetail（订单详情） | ✅ |
| `/order/:id/review` | ReviewPage（评价） | ✅ |
| `/user-info` | UserInfo（个人信息） | ✅ |
| `/change-password` | ChangePassword（修改密码） | ✅ |
| `/favorites` | MyFavorites（收藏/购物车） | ✅ |
| `/chat` | ChatList（消息列表） | ✅ |
| `/chat/:id` | ChatRoom（聊天室） | ✅ |
| `/notifications` | Notifications（消息通知） | ✅ |

**路由守卫**：`router.beforeEach` 检查 `meta.requiresAuth`，未登录自动跳转 `/login?redirect=原路径`。

---

## 后端 API 依赖

前端依赖 `http://localhost:8080` 的后端服务，以下是所有已调用的接口：

### 用户模块
| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/user/login` | 登录 |
| POST | `/api/user/register` | 注册 |
| GET | `/api/user/info` | 获取个人信息 |
| PUT | `/api/user/info` | 更新个人信息 |
| PUT | `/api/user/password` | 修改密码 |
| GET | `/api/user/:id` | 获取用户信息 |

### 图书模块
| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/book/list` | 图书列表（支持 ?keyword, ?category, ?sortBy, ?page, ?size） |
| GET | `/api/book/:id` | 图书详情 |
| POST | `/api/book/publish` | 发布图书 |
| PUT | `/api/book/:id` | 编辑图书 |
| DELETE | `/api/book/:id` | 删除图书 |
| PUT | `/api/book/:id/offshelf` | 下架 |
| PUT | `/api/book/:id/onshelf` | 上架 |
| GET | `/api/book/my` | 我的图书列表 |

### 订单模块
| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/order/create` | 创建订单 |
| GET | `/api/order/my/buy` | 我买的订单 |
| GET | `/api/order/my/sell` | 我卖的订单 |
| GET | `/api/order/:id` | 订单详情 |
| PUT | `/api/order/:id/pay` | 付款 |
| PUT | `/api/order/:id/ship` | 发货 |
| PUT | `/api/order/:id/confirm` | 确认收货 |
| PUT | `/api/order/:id/cancel` | 取消订单 |
| POST | `/api/order/:id/review` | 评价订单 |

### 其他模块
| 方法 | 路径 | 用途 |
|------|------|------|
| POST | `/api/upload` | 图片上传 |
| POST | `/api/favorite/add` | 添加收藏 |
| DELETE | `/api/favorite/:id` | 取消收藏 |
| DELETE | `/api/favorite/book/:id` | 按图书取消收藏 |
| GET | `/api/favorite/list` | 收藏列表 |
| GET | `/api/favorite/check/:bookId` | 检查是否收藏 |
| GET | `/api/chat/list` | 会话列表 |
| GET | `/api/chat/messages/:otherId` | 聊天记录 |
| POST | `/api/chat/send` | 发送消息 |
| GET | `/api/notification/list` | 通知列表 |
| PUT | `/api/notification/:id/read` | 标记已读 |

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
- 前后端图片路径通过 `imageBaseUrl` 拼接（当前 `http://localhost:8080`）

---

## 开发计划

### ✅ 已完成（第一批）
- 首页图书列表 + 全局搜索 + 分类筛选 + 排序 + 分页
- 登录/注册 + 路由守卫
- 个人信息 + 修改密码
- 图书详情 + 购买 + 收藏/取消收藏
- 发布商品 + 我的商品（上架/下架/编辑/删除）
- 消息对话（会话列表 + 一对一聊天 + 轮询刷新）
- 订单列表 + 订单详情 + 取消/付款/发货/确认收货
- 订单评价
- 消息通知
- 全局导航栏（暖色调品牌 + 固定搜索）

### 🟡 待完善
- [ ] **Pinia Store 重构** — 当前 `counter.ts` 是脚手架模板，需创建实际的 user、book、cart store
- [ ] **WebSocket 替代轮询** — ChatRoom 当前用 5 秒轮询获取消息，应改为 WebSocket
- [ ] **真正的购物车页面** — 当前 `/favorites` 暂代购物车，需要独立购物车功能
- [ ] **图片懒加载** — 列表页图片未做懒加载，书多时性能差
- [ ] **移动端响应式** — 部分页面未做完整的移动端适配

### 🔮 远期规划
- [ ] 后台管理页面（管理员审核图书、管理用户）
- [ ] 图书推荐算法
- [ ] 物流集成
- [ ] 付款集成
- [ ] i18n 国际化
- [ ] PWA 离线支持
- [ ] 单元测试覆盖

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

---

> **注意**：前端开发依赖后端 API 服务在 `http://localhost:8080` 运行。
> 如果后端未启动，页面仍可渲染但 API 调用会失败，不会导致页面崩溃。
