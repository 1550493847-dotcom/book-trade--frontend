<template>
  <div id="app">
    <!-- 登录页全屏显示，不套外壳 -->
    <template v-if="route.path === '/login'">
      <router-view />
    </template>

    <!-- 其他页面使用标准布局 -->
    <template v-else>
      <!-- ===== 顶部导航栏 ===== -->
      <header class="top-header">
        <div class="header-inner">
          <!-- 左侧：Logo + 品牌名 -->
          <div class="header-left" @click="goHome">
            <div class="logo-placeholder">
              <span class="logo-text">📖</span>
            </div>
            <span class="brand-name">淘籍籍</span>
          </div>

          <!-- 右侧：导航链接 -->
          <div class="header-right">
<!-- 未登录 -->
            <template v-if="!userStore.isLogin">
              <router-link to="/login" class="nav-link" :class="{ active: isActive('/login') }">登录</router-link>
              <span class="nav-divider">/</span>
              <router-link to="/login" class="nav-link" :class="{ active: isActive('/login') }">注册</router-link>
            </template>

            <!-- 已登录 -->
            <template v-else>
              <router-link to="/orders" class="nav-link" :class="{ active: isActive('/orders') }">
                <el-icon><List /></el-icon>
                我的订单
              </router-link>
              <el-dropdown trigger="hover" @command="handleCommand">
                <router-link to="/user-info" class="user-trigger">
                  <el-avatar :size="28" :src="userStore.avatarUrl">{{ userStore.displayName.charAt(0) || '用' }}</el-avatar>
                  <span class="user-name">{{ userStore.displayName }}</span>
                  <el-icon><ArrowDown /></el-icon>
                </router-link>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="myBooks">卖家中心</el-dropdown-item>
                    <el-dropdown-item command="changePassword">修改密码</el-dropdown-item>
                    <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </template>
          </div>
        </div>
      </header>

      <!-- ===== 固定搜索栏 ===== -->
      <div class="search-section">
        <div class="search-inner">
          <div class="search-box">
            <el-icon class="search-icon"><Search /></el-icon>
            <input
              v-model="searchKeyword"
              class="search-input"
              placeholder="搜索书名、作者、分类…"
              @keyup.enter="doSearch"
            />
            <el-button type="primary" class="search-btn" @click="doSearch">搜索</el-button>
          </div>
        </div>
      </div>

      <!-- ===== 页面内容 ===== -->
      <main class="main-content">
        <router-view />
      </main>
      <!-- ===== 右侧悬浮导航（已登录时显示） ===== -->
      <div class="floating-nav" v-if="userStore.isLogin">
        <router-link to="/publish" class="float-nav-item" :class="{ active: isActive('/publish') }">
          <el-icon><Plus /></el-icon>
          <span>发布</span>
        </router-link>
        <router-link to="/chat" class="float-nav-item" :class="{ active: isActive('/chat') }">
          <el-icon><ChatLineRound /></el-icon>
          <span>消息</span>
        </router-link>
        <router-link to="/favorites" class="float-nav-item" :class="{ active: isActive('/favorites') }">
          <el-icon><ShoppingCart /></el-icon>
          <span>购物车</span>
        </router-link>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ChatLineRound, ShoppingCart, List, User, ArrowDown, Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref('')

/** 路由匹配规则：当前路径对应哪个导航按钮高亮 */
const activeMatchers = {
  '/publish':    (p) => p === '/publish',
  '/chat':       (p) => p === '/chat' || p.startsWith('/chat/'),
  '/favorites':  (p) => p === '/favorites' || p === '/cart',
  '/orders':     (p) => p === '/orders' || p.startsWith('/order/'),
  '/user-info':  (p) => p === '/user-info' || p === '/change-password',
  '/login':      (p) => p === '/login',
}
const isActive = (navKey) => {
  const matcher = activeMatchers[navKey]
  return matcher ? matcher(route.path) : route.path === navKey
}

const goHome = () => { router.push('/') }

const doSearch = () => {
  const kw = searchKeyword.value.trim()
  router.push({ path: '/', query: { keyword: kw } })
}

const logout = () => {
  userStore.logout()
  ElMessage.success('已退出登录')
  router.push('/login')
}

const handleCommand = (command) => {
  if (command === 'logout') logout()
  else if (command === 'myBooks') router.push('/my-books')
  else if (command === 'changePassword') router.push('/change-password')
}

watch(() => route.query.keyword, (val) => {
  if (val) searchKeyword.value = val
})

onMounted(() => { userStore.refreshFromStorage() })
</script>

// 心跳：每2分钟报告在线状态
import { onUnmounted } from "vue"
import request from "@/api/request"

let heartbeatTimer = null

onMounted(() => {
  const token = localStorage.getItem("token")
  if (token) {
    request.post("/api/user/heartbeat").catch(() => {})
    heartbeatTimer = setInterval(() => {
      const tk = localStorage.getItem("token")
      if (tk) {
        request.post("/api/user/heartbeat").catch(() => {})
      }
    }, 120000)
  }
})

onUnmounted(() => {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
})

<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #f5f0eb; }

.top-header {
  z-index: 1001;
  background: linear-gradient(135deg, #3d2413 0%, #6d4526 50%, #8b5e3c 100%);
  box-shadow: 0 2px 12px rgba(0,0,0,0.12);
}
.header-inner {
  --s: 83px;
  --o: 0.5;
  --c1: rgba(244, 235, 208, var(--o));
  --c2: rgba(194, 178, 163, var(--o));
  background-image: linear-gradient(var(--c1) 50%, var(--c2) 50%),
    linear-gradient(45deg, var(--c1) 50%, var(--c2) 50%),
    linear-gradient(90deg, var(--c1) 50%, var(--c2) 50%),
    linear-gradient(135deg, var(--c1) 50%, var(--c2) 50%);
  background-size: var(--s) var(--s);
  max-width: 1200px;
  margin: 0 auto;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}
.logo-placeholder {
  width: 36px; height: 36px;
  border-radius: 10px;
  background: rgba(255,255,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
}
.brand-name {
  font-size: 20px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4px;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 2px;
}
.nav-link {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 7px 12px;
  color: rgba(255,255,255,0.80);
  text-decoration: none;
  font-size: 13px;
  border-radius: 8px;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-link:hover {
  background: rgba(255,255,255,0.12);
  color: #fff;
}
.nav-link .el-icon { font-size: 15px; }
.nav-divider { color: rgba(255,255,255,0.3); font-size: 13px; }

.user-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  color: rgba(255,255,255,0.85);
}
.user-trigger:hover { background: rgba(255,255,255,0.12); }
.user-name { font-size: 13px; max-width: 50px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.search-section {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: #f5f0eb;
  padding: 14px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.search-inner { max-width: 680px; margin: 0 auto; }
.search-box {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 50px;
  padding: 3px 3px 3px 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04);
  transition: box-shadow 0.3s;
}
.search-box:focus-within {
  box-shadow: 0 4px 20px rgba(109,69,38,0.12), 0 0 0 1px rgba(109,69,38,0.15);
}
.search-icon { color: #b8956e; font-size: 18px; flex-shrink: 0; }
.search-input {
  flex: 1;
  border: none; outline: none;
  padding: 10px 14px;
  font-size: 14px;
  background: transparent;
  color: #333;
}
.search-input::placeholder { color: #b8956e; }
.search-btn {
  border-radius: 50px !important;
  padding: 10px 28px !important;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #8b5e3c, #a0712a) !important;
  border: none !important;
  flex-shrink: 0;
}
.search-btn:hover {
  background: linear-gradient(135deg, #a0712a, #c4903e) !important;
  box-shadow: 0 4px 16px rgba(160,113,42,0.3);
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px 80px;
  min-height: calc(100vh - 58px - 74px);
}

@media (max-width: 768px) {
  .main-content { padding: 12px; min-height: calc(100vh - 58px - 74px); }
}
/* ===== 导航按钮高亮（白色底色） ===== */
.nav-link.active {
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-weight: 600;
}
.nav-link.active .el-icon {
  color: #fff;
}

/* ===== 右侧悬浮导航 ===== */
.floating-nav {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 999;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 14px;
  padding: 8px 6px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04);
}
.float-nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 10px;
  color: #6d4526;
  text-decoration: none;
  font-size: 11px;
  border-radius: 10px;
  transition: all 0.2s;
  cursor: pointer;
}
.float-nav-item:hover {
  background: rgba(109,69,38,0.08);
  color: #3d2413;
}
.float-nav-item .el-icon {
  font-size: 20px;
}
.float-nav-item.active {
  background: rgba(109,69,38,0.12);
  color: #3d2413;
  font-weight: 600;
}
.float-nav-item.active .el-icon {
  color: #8b5e3c;
}


/* ===== 全局响应式 ===== */
@media (max-width: 768px) {
  .header-inner { padding: 0 12px; }
  .brand-name { font-size: 16px; letter-spacing: 2px; }
  .search-section { padding: 10px 12px; }
  .search-input { padding: 8px 10px; font-size: 13px; }
  .search-btn { padding: 8px 18px !important; font-size: 13px; }

  /* 导航链接：小屏只显示图标 */
  .nav-link span { display: none; }
  .nav-link { padding: 7px 8px; }

  /* 浮动导航 → 底部标签栏 */
  .floating-nav {
    position: fixed;
    right: auto;
    bottom: 0;
    left: 0;
    top: auto;
    transform: none;
    width: 100%;
    flex-direction: row;
    justify-content: space-around;
    border-radius: 14px 14px 0 0;
    padding: 6px 0;
    padding-bottom: env(safe-area-inset-bottom, 6px);
    z-index: 1002;
    box-shadow: 0 -2px 12px rgba(0,0,0,0.10);
  }
  .float-nav-item {
    padding: 6px 8px;
    font-size: 10px;
  }
  .float-nav-item .el-icon { font-size: 22px; }

  /* 页面主体下边距，避免被底部导航遮挡 */
  .main-content { padding-bottom: 70px; }

  .nav-divider { margin: 0 2px; }
}

</style>