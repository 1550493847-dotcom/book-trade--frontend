<template>
  <div class="notifications-container">
    <h2>消息通知</h2>

    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="系统通知" name="system">
        <div class="notification-list" v-loading="loading">
          <el-card
            v-for="item in notifications"
            :key="item.id"
            class="notification-card"
            :class="{ unread: !item.isRead }"
            @click="markRead(item)"
          >
            <div class="notification-content">
              <div class="notification-icon">
                <el-icon v-if="item.type === 'order'" color="#409eff"><Document /></el-icon>
                <el-icon v-else-if="item.type === 'chat'" color="#67c23a"><ChatDotRound /></el-icon>
                <el-icon v-else color="#e6a23c"><Bell /></el-icon>
              </div>
              <div class="notification-info">
                <div class="notification-title">{{ item.title }}</div>
                <div class="notification-text">{{ item.content }}</div>
                <div class="notification-time">{{ formatTime(item.createTime) }}</div>
              </div>
              <el-badge v-if="!item.isRead" is-dot class="read-dot" />
            </div>
          </el-card>
        </div>

        <div v-if="!loading && notifications.length === 0" class="empty">
          <el-empty description="暂无通知" />
        </div>
      </el-tab-pane>

      <el-tab-pane label="交易通知" name="trade">
        <div class="notification-list" v-loading="loading">
          <el-card
            v-for="item in tradeNotifications"
            :key="item.id"
            class="notification-card"
            :class="{ unread: !item.isRead }"
            @click="handleTradeClick(item)"
          >
            <div class="notification-content">
              <div class="notification-info">
                <div class="notification-title">{{ item.title }}</div>
                <div class="notification-text">{{ item.content }}</div>
                <div class="notification-time">{{ formatTime(item.createTime) }}</div>
              </div>
              <el-badge v-if="!item.isRead" is-dot class="read-dot" />
            </div>
          </el-card>
        </div>

        <div v-if="!loading && tradeNotifications.length === 0" class="empty">
          <el-empty description="暂无交易通知" />
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Document, ChatDotRound, Bell } from '@element-plus/icons-vue'
import request from '@/api/request'

const router = useRouter()
const activeTab = ref('system')
const notifications = ref([])
const tradeNotifications = ref([])
const loading = ref(false)

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadNotifications = async () => {
  loading.value = true
  try {
    const res = await request.get(`/api/notification/list?type=${activeTab.value}`)
    if (res.code === 200) {
      if (activeTab.value === 'system') {
        notifications.value = res.data || []
      } else {
        tradeNotifications.value = res.data || []
      }
    }
  } catch (error) {
    console.error('加载通知失败:', error)
  } finally {
    loading.value = false
  }
}

const markRead = async (item) => {
  if (!item.isRead) {
    try {
      await request.put(`/api/notification/${item.id}/read`)
      item.isRead = true
    } catch (error) {
      console.error('标记已读失败:', error)
    }
  }
}

const handleTradeClick = async (item) => {
  await markRead(item)
  if (item.orderId) {
    router.push(`/order/${item.orderId}`)
  }
}

const handleTabClick = () => {
  loadNotifications()
}

onMounted(() => {
  loadNotifications()
})
</script>

<style scoped>
.notifications-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.notification-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.notification-card:hover {
  transform: translateX(4px);
}
.notification-card.unread {
  border-left: 3px solid #409eff;
}
.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}
.notification-icon {
  font-size: 24px;
  flex-shrink: 0;
}
.notification-info {
  flex: 1;
}
.notification-title {
  font-size: 15px;
  font-weight: bold;
  margin-bottom: 4px;
}
.notification-text {
  color: #666;
  font-size: 14px;
  margin-bottom: 4px;
}
.notification-time {
  color: #999;
  font-size: 12px;
}
.read-dot {
  flex-shrink: 0;
}
.empty {
  margin-top: 50px;
}
</style>
