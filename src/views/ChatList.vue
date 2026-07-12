<template>
  <div class="chat-page">
    <!-- 左侧：用户会话列表 -->
    <div class="chat-sidebar">
      <div class="sidebar-header">
        <h2>消息</h2>
      </div>
      <div class="user-list" v-loading="loading">
        <div
          v-for="chat in chatList"
          :key="chat.id"
          class="user-item"
          :class="{ active: selectedUserId === (chat.otherUserId || chat.otherId || chat.id) }"
          @click="selectUser(chat)"
        >
          <div class="user-item-inner">
            <div class="user-avatar-area">
              <div class="avatar-wrapper">
                <img class="avatar-img" :src="getAvatarUrl(chat)" @error="onAvatarError($event, chat)" />
              </div>
            </div>
            <div class="user-info-area">
              <div class="user-row-top">
                <div class="user-name">{{ chat.otherName || '用户' }}</div>
              </div>
              <div class="user-preview">{{ chat.lastMessage || '暂无消息' }}</div>
              <div class="user-time">{{ formatTime(chat.lastTime) }}</div>
            </div>
            <div class="user-preview-img" v-if="chat.lastImage">
              <img :src="chat.lastImage" class="preview-img" />
            </div>
          </div>
        </div>
        <div v-if="!loading && chatList.length === 0" class="empty-list">
          <el-empty description="暂无消息" :image-size="60" />
        </div>
      </div>
    </div>

    <!-- 右侧：聊天区域 -->
    <div class="chat-main">
      <template v-if="selectedChat">
        <chat-room-view :other-user-id="selectedUserId" :other-name="selectedChat.otherName || ''" />
      </template>
      <div v-else class="no-selection">
        <el-empty description="选择一个聊天会话" :image-size="80" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import ChatRoomView from '@/views/ChatRoomView.vue'

const router = useRouter()
const chatList = ref([])
const loading = ref(false)
const selectedChat = ref(null)
const selectedUserId = ref(null)

const defaultAvatar = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" rx="22" fill="#e8dccc"/><text x="50%" y="55%" text-anchor="middle" fill="#8b5e3c" font-size="18" font-weight="bold">?</text></svg>')

const getAvatarUrl = (chat) => {
  if (chat.otherAvatar) return chat.otherAvatar
  return ''
}

const onAvatarError = (e, chat) => {
  e.target.src = defaultAvatar
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) {
    return date.getHours().toString().padStart(2, '0') + ':' + date.getMinutes().toString().padStart(2, '0')
  }
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  return (date.getMonth() + 1) + '/' + date.getDate()
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

const selectUser = (chat) => {
  const uid = chat.otherUserId || chat.otherId || chat.id
  selectedUserId.value = uid
  selectedChat.value = chat
  // 标记已读
  if (chat.unreadCount > 0) {
    try {
      request.put('/api/chat/read/' + uid)
    } catch {}
    chat.unreadCount = 0
  }
}

onMounted(() => {
  loadChats()
})
</script>
<style scoped>
.chat-page {
  display: flex;
  height: calc(100vh - 100px);
  min-height: 500px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
}

/* ===== 左侧用户列表 ===== */
.chat-sidebar {
  width: 340px;
  min-width: 340px;
  border-right: 1px solid #eee;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}
.sidebar-header {
  padding: 16px 16px 12px;
  border-bottom: 1px solid #eee;
}
.sidebar-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #3d2413;
}
.user-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.user-item {
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
}
.user-item:hover {
  background: #f0ebe4;
}
.user-item.active {
  background: #e8e0d6;
}
.user-item-inner {
  display: flex;
  flex-direction: row;
  width: 100%;
  align-items: center;
  gap: 10px;
}
.avatar-wrapper {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
}
.avatar-img {
  object-fit: cover;
  width: 44px;
  height: 44px;
  border-radius: 22px;
  display: block;
  background: #e8dccc;
}
.user-info-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.user-name {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}
.user-preview {
  font-size: 12px;
  color: #a3a3a3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 165px;
  line-height: 1.3;
}
.user-time {
  font-size: 10px;
  color: #a3a3a3;
  line-height: 1.2;
}
.user-preview-img {
  flex-shrink: 0;
}
.preview-img {
  object-fit: cover;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  display: block;
  background: #e8dccc;
}
.empty-list {
  padding: 40px 0;
}

/* ===== 右侧聊天区域 ===== */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.no-selection {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>