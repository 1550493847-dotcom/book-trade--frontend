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

          <!-- 中间：搜索框 -->
          <div class="header-search">
            <div class="search-wrapper">
              <div class="search-box nav-search-box">
                <input
                  v-model="searchKeyword"
                  class="search-input"
                  placeholder="搜书名、作者…"
                  @keyup.enter="doSearch"
                  @focus="showHistory = true; fetchHistory()"
                  @click="showHistory = true; fetchHistory()"
                />
                <span class="nav-search-btn" @click="doSearch">
                  <el-icon><Search /></el-icon>
                  <span>搜索</span>
                </span>
              </div>
              <!-- 搜索历史下拉 -->
              <div v-if="showHistory" class="search-history-dropdown">
                <div class="history-header">
                  <span class="history-title">最近搜过</span>
                  <span class="history-clear" @click="clearAllHistory">清除历史记录</span>
                </div>
                <div class="history-body">
                  <div v-for="(kw, i) in historyList" :key="i" class="history-item">
                    <p class="history-keyword" @click="selectHistory(kw)">{{ kw }}</p>
                    <span class="history-del" @click.stop="deleteHistory(kw)">&times;</span>
                  </div>
                </div>
              </div>
            </div>
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
              <el-dropdown trigger="hover" placement="bottom" popper-class="user-popper">
                <router-link to="/my-books" class="user-trigger">
                  <el-avatar :size="28" :src="userStore.avatarUrl">{{ userStore.displayName.charAt(0) || '用' }}</el-avatar>
                  <span class="user-name-full">{{ userStore.displayName }}</span>
                </router-link>
                <template #dropdown>
                  <div class="user-dropdown-panel">
                    <!-- 头部：头像 + 用户名（可点击跳转个人主页） -->
                    <router-link to="/my-books" class="dropdown-header-link">
                      <div class="dropdown-header">
                        <el-avatar :size="44" :src="userStore.avatarUrl">{{ userStore.displayName.charAt(0) || '用' }}</el-avatar>
                        <div class="dropdown-user-info">
                          <div class="dropdown-username">{{ userStore.displayName }}</div>
                          <div class="dropdown-meta">粉丝 3&nbsp;&nbsp;|&nbsp;&nbsp;关注 2</div>
                        </div>
                      </div>
                    </router-link>
                    <!-- 统计按钮区域 -->
                    <div class="dropdown-stats-grid">
                      <router-link to="/orders" class="stat-card" @click.stop>
                        <span class="stat-label">我买到的</span>
                        <span class="stat-right">
                          <span class="stat-count">30</span>
                          <span class="stat-arrow">&gt;</span>
                        </span>
                      </router-link>
                      <router-link to="/orders" class="stat-card" @click.stop>
                        <span class="stat-label">我卖出的</span>
                        <span class="stat-right">
                          <span class="stat-count">5</span>
                          <span class="stat-arrow">&gt;</span>
                        </span>
                      </router-link>
                      <router-link to="/favorites" class="stat-card" @click.stop>
                        <span class="stat-label">我的收藏</span>
                        <span class="stat-right">
                          <span class="stat-count">2</span>
                          <span class="stat-arrow">&gt;</span>
                        </span>
                      </router-link>
                    </div>
                    <!-- 底部：退出登录 + 保存登录信息 -->
                    <div class="dropdown-footer">
                      <span class="footer-link" @click="logout">退出登录</span>
                      <span class="footer-link">保存登录信息</span>
                    </div>
                  </div>
                </template>
              </el-dropdown>
              <router-link to="/orders" class="nav-link" :class="{ active: isActive('/orders') }">
                <el-icon><List /></el-icon>
                我的订单
              </router-link>
            </template>
          </div>
        </div>
      </header>

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
        <a href="javascript:void(0)" class="float-nav-item" @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回</span>
        </a>
      </div>

    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, ChatLineRound, ShoppingCart, List, User, ArrowDown, Plus, ArrowLeft } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const searchKeyword = ref('')
const showHistory = ref(false)
const historyList = ref([])

// 点击空白处关闭下拉
const handleClickOutside = (e) => {
  const wrapper = document.querySelector('.search-wrapper')
  if (wrapper && !wrapper.contains(e.target)) {
    showHistory.value = false
  }
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 获取搜索历史
const fetchHistory = async () => {
  // 先从 localStorage 读取
  const localList = JSON.parse(localStorage.getItem('search_history') || '[]')
  if (userStore.isLogin) {
    try {
      const res = await request.get('/api/search/history')
      if (res.code === 200) {
        // 合并 Redis 和 localStorage，去重
        const redisList = res.data || []
        const merged = [...new Set([...redisList, ...localList])]
        historyList.value = merged
        return
      }
    } catch {}
  }
  historyList.value = localList
}

// 保存搜索词
const saveHistory = async (kw) => {
  if (!kw.trim()) return
  // 存到 localStorage（所有用户）
  const localHistory = JSON.parse(localStorage.getItem('search_history') || '[]')
  const filtered = localHistory.filter(h => h !== kw.trim())
  filtered.unshift(kw.trim())
  localStorage.setItem('search_history', JSON.stringify(filtered.slice(0, 20)))
  // 登录用户存到 Redis
  if (userStore.isLogin) {
    try {
      await request.post('/api/search/history', { keyword: kw.trim() })
    } catch (e) { console.error('保存搜索历史失败', e) }
  }
}

// 选择历史 → 填充搜索框并搜索
const selectHistory = (kw) => {
  searchKeyword.value = kw
  showHistory.value = false
  doSearch()
}

// 删除单条
const deleteHistory = async (kw) => {
  // 删除 localStorage
  const localHistory = JSON.parse(localStorage.getItem('search_history') || '[]')
  localStorage.setItem('search_history', JSON.stringify(localHistory.filter(h => h !== kw)))
  // 登录用户删除 Redis
  if (userStore.isLogin) {
    try {
      await request.delete('/api/search/history/' + encodeURIComponent(kw))
    } catch {}
  }
  historyList.value = historyList.value.filter(h => h !== kw)
}

// 清空全部
const clearAllHistory = async () => {
  localStorage.removeItem('search_history')
  if (userStore.isLogin) {
    try {
      await request.delete('/api/search/history')
    } catch {}
  }
  historyList.value = []
}

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

const goBack = () => {
  router.back()
}

const goHome = () => { router.push('/') }

const doSearch = async () => {
  const kw = searchKeyword.value.trim()
  if (kw) await saveHistory(kw)
  showHistory.value = false
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
  display: flex;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
  height: 58px;
  padding: 0 80px;
}

/* 左中右三栏等宽，让搜索框自然居中 */
.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.header-search {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  max-width: 500px;
  width: 40%;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.header-left {
  flex: 0 0 auto;
  min-width: 160px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.header-search {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 500px;
}

.header-right {
  flex: 0 0 auto;
  min-width: 160px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
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
  flex-shrink: 0;
}
.header-search {
  flex: 1;
  display: flex;
  justify-content: center;
  max-width: 480px;
  margin: 0 auto;
}
.nav-search-box {
  width: 100%;
  border-radius: 50px;
  padding: 2px 2px 2px 16px;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.08), 0 0 0 1px rgba(255,255,255,0.15);
  background: rgba(255,255,255,0.20);
  transition: all 0.25s;
}
.nav-search-box:focus-within {
  background: #fff;
  box-shadow: 0 2px 12px rgba(0,0,0,0.12), 0 0 0 1px rgba(255,255,255,0.3);
}
.nav-search-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 8px 18px;
  background: linear-gradient(135deg, #8b5e3c, #a0712a);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.nav-search-btn:hover {
  background: linear-gradient(135deg, #a0712a, #c4903e);
  box-shadow: 0 2px 8px rgba(160,113,42,0.3);
}
.nav-search-btn .el-icon {
  font-size: 15px;
  color: #fff;
}
.nav-search-btn:active {
  transform: scale(0.96);
}

.nav-search-box .search-input {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  color: #3d2413;
}
.nav-search-box .search-input::placeholder {
  color: #c4a882;
}
.nav-search-box:focus-within .search-input {
  color: #333;
}
.nav-search-box:focus-within .search-input::placeholder {
  color: #c4a882;
}
.nav-search-box .search-icon {
  color: #c4a882;
  font-size: 16px;
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
  text-decoration: none;
  outline: none;
}
.user-trigger:focus { outline: none; }
.user-trigger:hover { background: rgba(255,255,255,0.12); }


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
  min-height: calc(100vh - 58px);
}

@media (max-width: 768px) {
  .main-content { padding: 12px; min-height: calc(100vh - 58px); }
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
  gap: 10px;
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
.nav-ico {
  width: 20px;
  height: 20px;
  display: block;
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


/* ===== 搜索历史下拉 ===== */
.search-wrapper {
  position: relative;
  width: 100%;
}
.search-history-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15);
  z-index: 2000;
  overflow: hidden;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px 8px;
}
.history-title {
  font-size: 13px;
  font-weight: 600;
  color: #3d2413;
}
.history-clear {
  font-size: 12px;
  color: #8b5e3c;
  cursor: pointer;
  text-decoration: none;
}
.history-clear:hover {
  color: #a0712a;
  text-decoration: underline;
}
.history-body {
  max-height: 360px;
  overflow-y: auto;
  padding: 0 0 8px;
}
.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 16px;
  transition: background 0.15s;
}
.history-item:hover {
  background: #f5f0eb;
}
.history-keyword {
  flex: 1;
  margin: 0;
  padding: 6px 0;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  line-height: 1.4;
}
.history-keyword:hover {
  color: #3d2413;
}
.history-del {
  font-size: 16px;
  color: #999;
  cursor: pointer;
  padding: 4px 0 4px 12px;
  flex-shrink: 0;
  transition: color 0.15s;
}
.history-del:hover {
  color: #e74c3c;
}

/* ===== 全局响应式 ===== */
@media (max-width: 768px) {
  .header-inner { padding: 0 12px; }
  .brand-name { font-size: 16px; letter-spacing: 2px; }
  
  .nav-search-box .search-input { padding: 5px 8px; font-size: 12px; }
  

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
  .nav-ico {
  width: 20px;
  height: 20px;
  display: block;
}
.float-nav-item .el-icon { font-size: 22px; }

  /* 页面主体下边距，避免被底部导航遮挡 */
  .main-content { padding-bottom: 70px; }

  .nav-divider { margin: 0 2px; }
}


/* ===== 用户名完整显示 ===== */
.user-name-full {
  font-size: 13px;
  color: rgba(255,255,255,0.85);
  white-space: nowrap;
}

/* ===== 用户下拉菜单面板 ===== */
.user-popper {
  background: #f5f7f9 !important;
  border: none !important;
  border-radius: 14px !important;
  box-shadow: 0 8px 30px rgba(0,0,0,0.15) !important;
  padding: 0 !important;
}
.user-popper .el-popper__arrow {
  display: none !important;
}
.user-dropdown-panel a {
  text-decoration: none;
}

.user-dropdown-panel {
  width: 220px;
  padding: 14px;
}

/* 头部 */
.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 14px;
  margin-bottom: 12px;
}
.dropdown-user-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.dropdown-username {
  font-size: 15px;
  font-weight: 600;
  color: #3d2413;
}
.dropdown-home-link {
  font-size: 12px;
  color: #8b5e3c;
  text-decoration: none;
}
.dropdown-home-link:hover {
  color: #a0712a;
  text-decoration: none;
}

/* 统计卡片网格 */
.dropdown-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}
.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #fff;
  border-radius: 8px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid #eee;
}
.stat-card:hover {
  background: #fafafa;
}
.stat-label {
  font-size: 12px;
  color: #333;
}

/* 统计右侧：数量 + 箭头 */
.stat-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.stat-count {
  font-size: 12px;
  color: #555;
}
.stat-arrow {
  font-size: 12px;
  color: #999;
}

/* 粉丝 | 关注 */
.dropdown-meta {
  font-size: 11px;
  color: #8b5e3c;
  white-space: nowrap;
}
/* 头部链接 */
.dropdown-header-link {
  text-decoration: none;
  display: block;
  cursor: pointer;
  outline: none;
}
.dropdown-header-link:hover .dropdown-username {
  color: #a0712a;
}

/* 底部 */

.dropdown-footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(0,0,0,0.06);
}
.footer-link {
  font-size: 12px;
  color: #8b5e3c;
  cursor: pointer;
  transition: color 0.2s;
}
.footer-link:hover {
  color: #3d2413;
}
.footer-divider {
  color: #c4a882;
  font-size: 12px;
}

</style>






