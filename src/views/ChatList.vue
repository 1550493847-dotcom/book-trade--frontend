<template>
  <div class="chat-list-container">
    <h2>我的消息</h2>

    <div class="chat-list" v-loading="loading">
      <el-card
        v-for="chat in chatList"
        :key="chat.id"
        class="chat-card"
        shadow="hover"
        @click="goToChat(chat)"
      >
        <div class="chat-content">
          <el-avatar :size="48">
            {{ (chat.otherName || '用').charAt(0) }}
          </el-avatar>
          <div class="chat-info">
            <div class="chat-name">{{ chat.otherName || '用户' }}</div>
            <div class="chat-preview">{{ chat.lastMessage || '暂无消息' }}</div>
          </div>
          <div class="chat-meta">
            <div class="chat-time">{{ formatTime(chat.lastTime) }}</div>
            <el-badge v-if="chat.unreadCount > 0" :value="chat.unreadCount" class="unread-badge" />
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="!loading && chatList.length === 0" class="empty">
      <el-empty description="暂无消息，去看看感兴趣的书吧~" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const chatList = ref([])
const loading = ref(false)

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const loadChats = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/chat/list')
    if (res.code === 200) {
      chatList.value = res.data || []
    } else {
      ElMessage.error('加载失败')
    }
  } catch (error) {
    console.error('加载错误:', error)
  } finally {
    loading.value = false
  }
}

const goToChat = (chat) => {
  router.push(`/chat/${chat.otherUserId || chat.otherId || chat.id}`)
}

onMounted(() => {
  loadChats()
})
</script>

<style scoped>
.chat-list-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  font-size: 20px;
  font-weight: 700;
  color: #3d2413;
  margin-bottom: 20px;
  padding-left: 4px;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.chat-card {
  cursor: pointer;
  transition: all 0.25s ease;
  border: 1px solid transparent;
  border-radius: 14px;
}
.chat-card:hover {
  transform: translateX(4px);
  border-color: #e8dccc;
  box-shadow: 0 4px 16px rgba(139,94,60,0.10);
}
.chat-card :deep(.el-card__body) {
  padding: 14px 18px;
}
.chat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.chat-content :deep(.el-avatar) {
  background: linear-gradient(135deg, #8b5e3c, #a0712a);
  color: #fff;
  font-weight: bold;
  flex-shrink: 0;
}
.chat-info {
  flex: 1;
  min-width: 0;
}
.chat-name {
  font-size: 15px;
  font-weight: 600;
  color: #3d2413;
  margin-bottom: 4px;
}
.chat-preview {
  color: #b8956e;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 380px;
}
.chat-meta {
  text-align: right;
  flex-shrink: 0;
}
.chat-time {
  color: #b8956e;
  font-size: 11px;
  margin-bottom: 6px;
}
.empty {
  margin-top: 50px;
}

@media (max-width: 768px) {
  .chat-list-container { padding: 12px; }
  .chat-card:hover { transform: none; }
  .chat-preview { max-width: 160px; }
}
</style>
