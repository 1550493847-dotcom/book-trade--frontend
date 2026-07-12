<template>
  <aside class="profile-sidebar">
    <ul class="sidebar-menu">
      <!-- 我的中心 -->
      <li class="menu-item">
        <router-link to="/my-books" class="menu-link" :class="{ active: activeMenu === 'center' }">
          <img src="/my.ico" class="menu-icon-img" />
          <span>我的中心</span>
        </router-link>
      </li>

      <!-- 我的交易 -->
      <li class="menu-item" :class="{ expanded: tradeExpanded }">
        <a href="javascript:void(0)" class="menu-link" @click="toggleTrade">
          <img src="/mytrade.ico" class="menu-icon-img" />
          <span>我的交易</span>
          <span class="menu-arrow" :class="{ rotated: tradeExpanded }">›</span>
        </a>
        <ul class="sub-menu" v-show="tradeExpanded">
          <li>
            <a href="javascript:void(0)" class="sub-link" :class="{ active: activeMenu === 'sell' }" @click="navigateTo('/orders', 'sell')">
              <span>我卖出的</span>
            </a>
          </li>
          <li>
            <a href="javascript:void(0)" class="sub-link" :class="{ active: activeMenu === 'buy' }" @click="navigateTo('/orders', 'buy')">
              <span>我买到的</span>
            </a>
          </li>
        </ul>
      </li>

      <!-- 我的收藏 -->
      <li class="menu-item">
        <router-link to="/favorites" class="menu-link" :class="{ active: activeMenu === 'favorites' }">
          <img src="/mylike.ico" class="menu-icon-img" />
          <span>我的收藏</span>
        </router-link>
      </li>

      <!-- 账户设置 -->
      <li class="menu-item" :class="{ expanded: accountExpanded }">
        <a href="javascript:void(0)" class="menu-link" @click="accountExpanded = !accountExpanded">
          <img src="/setting.ico" class="menu-icon-img" />
          <span>账户设置</span>
          <span class="menu-arrow" :class="{ rotated: accountExpanded }">›</span>
        </a>
        <ul class="sub-menu" v-show="accountExpanded">
          <li>
            <router-link to="/user-info" class="sub-link" :class="{ active: activeMenu === 'profile' }">
              <span>个人资料</span>
            </router-link>
          </li>
          <li>
            <router-link to="/change-password" class="sub-link" :class="{ active: activeMenu === 'security' }">
              <span>账号与安全</span>
            </router-link>
          </li>
        </ul>
      </li>
    </ul>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  activeMenu: { type: String, default: '' }
})

const router = useRouter()
const tradeExpanded = ref(true)
const accountExpanded = ref(false)

const toggleTrade = () => {
  tradeExpanded.value = !tradeExpanded.value
}

const navigateTo = (path, query) => {
  router.push({ path, query: { type: query } })
}
</script>

<style scoped>
.profile-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 8px 0;
  height: fit-content;
  position: sticky;
  top: 80px;
  overflow: hidden;
}

.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  border-bottom: 1px solid #f0f0f0;
}
.menu-item:last-child {
  border-bottom: none;
}

.menu-link {
  display: flex;
  align-items: center;
  padding: 10px 16px;
  margin: 2px 8px;
  text-decoration: none;
  color: #333;
  font-size: 14px;
  transition: background 0.2s, color 0.2s;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
}
.menu-link:hover,
.menu-link.active {
  background: #e8ddd0;
  color: #3d2413;
  font-weight: 600;
}

.menu-icon-img {
  width: 18px;
  height: 18px;
  margin-right: 10px;
  flex-shrink: 0;
  object-fit: contain;
}

.menu-arrow {
  margin-left: auto;
  color: #999;
  font-size: 16px;
  line-height: 1;
  transition: transform 0.2s;
  opacity: 0.5;
}
.menu-arrow.rotated {
  transform: rotate(90deg);
}

.sub-menu {
  list-style: none;
  padding: 0 0 6px 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sub-link {
  display: block;
  padding: 8px 16px 8px 48px;
  margin: 0 8px;
  text-decoration: none;
  color: #666;
  font-size: 13px;
  transition: background 0.15s, color 0.15s;
  border-radius: 20px;
  cursor: pointer;
}
.sub-link:hover,
.sub-link.active {
  color: #3d2413;
  background: #e8ddd0;
  font-weight: 600;
}

@media (max-width: 768px) {
  .profile-sidebar {
    width: 100%;
    position: static;
  }
}
</style>
