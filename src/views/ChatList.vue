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
  router.push(`/chat/${chat.otherUserId || chat.id}`)
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
  margin-bottom: 20px;
}
.chat-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.chat-card {
  cursor: pointer;
  transition: transform 0.2s;
}
.chat-card:hover {
  transform: translateX(4px);
}
.chat-content {
  display: flex;
  align-items: center;
  gap: 14px;
}
.chat-info {
  flex: 1;
}
.chat-name {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 4px;
}
.chat-preview {
  color: #999;
  font-size: 14px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 400px;
}
.chat-meta {
  text-align: right;
}
.chat-time {
  color: #999;
  font-size: 12px;
  margin-bottom: 4px;
}
.empty {
  margin-top: 50px;
}
</style>
