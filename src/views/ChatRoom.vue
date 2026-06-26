<template>
  <div class="chat-room-container">
    <!-- 头部 -->
    <div class="chat-header">
      <el-button size="small" @click="$router.back()" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <el-avatar :size="36" class="header-avatar">
        {{ (otherName || '用').charAt(0) }}
      </el-avatar>
      <div class="header-info">
        <div class="chat-title">{{ otherName }}</div>
        <div class="chat-status" v-if="wsConnected">在线</div>
      </div>
    </div>

    <!-- 消息列表 -->
    <div class="message-list" ref="messageListRef" v-loading="loading">
      <template v-for="(msg, index) in messages" :key="msg.id">
        <!-- 日期分割线 -->
        <div v-if="showDateDivider(index)" class="date-divider">
          <span class="date-text">{{ formatDate(msg.createTime) }}</span>
        </div>

        <div :class="['message-item', msg.senderId === myUserId ? 'mine' : 'other']">
          <!-- 自己头像（右侧） -->
          <el-avatar v-if="msg.senderId === myUserId" :size="36" class="msg-avatar" :src="userStore.avatarUrl">
            {{ (userStore.displayName || '我').charAt(0) }}
          </el-avatar>

          <div class="message-content">
            <div class="message-bubble">
              <template v-if="isImage(msg.content)">
                <img :src="msg.content" class="msg-image" @click="previewImage(msg.content)" @load="scrollToBottom" />
              </template>
              <template v-else>
                <div class="message-text">{{ msg.content }}</div>
              </template>
            </div>
            <div class="message-meta">
              <span class="message-time">{{ formatTime(msg.createTime) }}</span>
              <el-icon v-if="msg.senderId === myUserId && String(msg.id).startsWith('temp-')" class="status-icon sending">
                <Loading />
              </el-icon>
            </div>
          </div>

          <!-- 对方头像（左侧） -->
          <el-avatar v-if="msg.senderId !== myUserId" :size="36" class="msg-avatar">
            {{ (otherName || '用').charAt(0) }}
          </el-avatar>
        </div>
      </template>
    </div>

    <!-- 输入区域 -->
    <div class="input-area">
      <div class="input-toolbar">
        <el-popover placement="top-start" :width="320" trigger="click">
          <template #reference>
            <el-button size="small" class="toolbar-btn" circle>
              <el-icon><ChatDotSquare /></el-icon>
            </el-button>
          </template>
          <div class="emoji-grid">
            <span v-for="emoji in emojis" :key="emoji" class="emoji-item" @click="insertEmoji(emoji)">{{ emoji }}</span>
          </div>
        </el-popover>
        <el-button size="small" class="toolbar-btn" circle @click="triggerUpload" :disabled="uploading">
          <el-icon v-if="!uploading"><PictureFilled /></el-icon>
          <el-icon v-else class="loading-icon"><Loading /></el-icon>
        </el-button>
        <input ref="fileInputRef" type="file" accept="image/jpeg,image/png,image/jpg,image/gif,image/webp" style="display:none" @change="handleFileSelect" />
      </div>
      <el-input v-model="inputText" placeholder="输入消息..." @keyup.enter="sendMessage" class="message-input" :disabled="sending || uploading" ref="inputRef" />
      <el-button type="primary" @click="sendMessage" :disabled="!inputText.trim() || sending || uploading" class="send-btn">
        <el-icon v-if="!sending"><Promotion /></el-icon>
        <el-icon v-else class="loading-icon"><Loading /></el-icon>
      </el-button>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft, ChatLineRound, Promotion, Loading, ChatDotSquare, PictureFilled } from '@element-plus/icons-vue'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const messages = ref([])
const inputText = ref('')
const messageListRef = ref(null)
const otherName = ref('')
const myUserId = ref(null)
const loading = ref(false)
const sending = ref(false)
const wsConnected = ref(false)
const uploading = ref(false)
const fileInputRef = ref(null)
const inputRef = ref(null)

const emojis = ['😀','😃','😄','😁','😆','😊','😍','😘','😗','😙','😔','😭','😂','😮','😢','😠','😒','😎','👍','👎','👏','👌','✌','✍','💯','💤','❤','💛','💚','💙','💜','💦','☀','🌟','🌍','💎','🎉','🎁','🎂','🍰','☕','🍵','🚀','✈','📱','💻','💬','📖']

const isImage = (content) => {
  if (typeof content !== 'string') return false
  // Match http URLs ending with image extensions
  if (/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(content)) return true
  // Also match relative paths like /uploads/xxx.jpg
  if (/^\/uploads\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(content)) return true
  return false
}

const insertEmoji = (emoji) => {
  inputText.value += emoji
  inputRef.value?.focus()
}

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  event.target.value = ''
  uploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await request.post('/api/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    })
    if (res.code === 200) {
      const imgUrl = res.data.startsWith('http') ? res.data : 'http://localhost:8080' + res.data
      await sendImageMessage(imgUrl)
    } else {
      ElMessage.error(res.message || '上传失败')
    }
  } catch {
    ElMessage.error('图片上传失败')
  } finally {
    uploading.value = false
  }
}

const sendImageMessage = async (url) => {
  const optimisticMsg = { id: 'temp-' + Date.now(), senderId: myUserId.value, content: url, createTime: new Date().toISOString() }
  messages.value.push(optimisticMsg)
  scrollToBottom()
  if (wsSendMessage(url)) return
  try {
    const res = await request.post('/api/chat/send', { receiverId: Number(otherId.value), content: url })
    if (res.code !== 200) {
      const idx = messages.value.findIndex(m => m.id === optimisticMsg.id)
      if (idx >= 0) messages.value.splice(idx, 1)
    }
  } catch {
    const idx = messages.value.findIndex(m => m.id === optimisticMsg.id)
    if (idx >= 0) messages.value.splice(idx, 1)
  }
}

const previewImage = (url) => {
  window.open(url, '_blank')
}
const otherId = computed(() => String(route.params.id))

const wsUrl = computed(() => {
  const token = userStore.token
  if (!token) return ''
  return `ws://localhost:8080/ws/chat?token=${token}`
})

let ws = null
let reconnectTimer = null
let reconnectAttempts = 0
let pollingTimer = null

// ===== 时间格式化 =====

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const h = date.getHours().toString().padStart(2, '0')
  const m = date.getMinutes().toString().padStart(2, '0')
  return `${h}:${m}`
}

const formatDate = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = date.toDateString() === yesterday.toDateString()

  if (isToday) return '今天'
  if (isYesterday) return '昨天'
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-月-${d}`
}

const showDateDivider = (index) => {
  if (index === 0) return true
  const curr = messages.value[index]
  const prev = messages.value[index - 1]
  if (!curr || !prev || !curr.createTime || !prev.createTime) return false
  const currDate = new Date(curr.createTime).toDateString()
  const prevDate = new Date(prev.createTime).toDateString()
  return currDate !== prevDate
}

// ===== 滚动 =====

const scrollToBottom = async () => {
  await nextTick()
  await nextTick() // double tick for images to load
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// ===== 加载消息 =====

const loadMessages = async () => {
  loading.value = true
  try {
    const res = await request.get(`/api/chat/messages/${otherId.value}`)
    if (res.code === 200) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  } finally {
    loading.value = false
  }
}

// ===== WebSocket =====

const connectWs = () => {
  if (!wsUrl.value) { startPollingFallback(); return }
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return

  ws = new WebSocket(wsUrl.value)
  ws.onopen = () => {
    reconnectAttempts = 0
    wsConnected.value = true
    stopPollingFallback()
  }
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      const msg = data.type === 'message' ? data.data : data
      if (!msg || !msg.id) return
      const msgOtherId = String(msg.senderId === myUserId.value ? msg.receiverId : msg.senderId)
      if (msgOtherId !== otherId.value) return
      const exists = messages.value.some((m) => m.id === msg.id)
      if (exists) return
      const tempIdx = messages.value.findIndex(
        (m) => String(m.id).startsWith('temp-') && m.senderId === msg.senderId && m.content === msg.content
      )
      if (tempIdx >= 0) {
        messages.value[tempIdx] = msg
      } else {
        messages.value.push(msg)
      }
      scrollToBottom()
    } catch { /* ignore */ }
  }
  ws.onclose = (event) => {
    wsConnected.value = false
    if (!event.wasClean && reconnectAttempts < 10) {
      reconnectTimer = setTimeout(() => { reconnectAttempts++; connectWs() }, 3000)
    }
  }
  ws.onerror = () => {
    wsConnected.value = false
    startPollingFallback()
  }
}

const disconnectWs = () => {
  wsConnected.value = false
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  stopPollingFallback()
  if (ws) { ws.close(); ws = null }
}

const startPollingFallback = () => {
  if (pollingTimer) return
  pollingTimer = setInterval(() => { loadMessages() }, 5000)
}

const stopPollingFallback = () => {
  if (pollingTimer) { clearInterval(pollingTimer); pollingTimer = null }
}

const wsSendMessage = (text) => {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ receiverId: Number(otherId.value), content: text }))
    return true
  }
  return false
}

const sendMessage = async () => {
  if (!inputText.value.trim() || sending.value) return
  const text = inputText.value.trim()
  inputText.value = ''
  sending.value = true

  const optimisticMsg = {
    id: `temp-${Date.now()}-${Math.random()}`,
    senderId: myUserId.value,
    content: text,
    createTime: new Date().toISOString(),
  }
  messages.value.push(optimisticMsg)
  scrollToBottom()

  if (wsSendMessage(text)) {
    sending.value = false
    return
  }

  try {
    const res = await request.post('/api/chat/send', {
      receiverId: Number(otherId.value),
      content: text,
    })
    if (res.code !== 200) {
      // 替换临时消息为失败状态
      const failIdx = messages.value.findIndex((m) => m.id === optimisticMsg.id)
      if (failIdx >= 0) messages.value[failIdx].failed = true
    }
  } catch {
    const failIdx = messages.value.findIndex((m) => m.id === optimisticMsg.id)
    if (failIdx >= 0) messages.value[failIdx].failed = true
  } finally {
    sending.value = false
  }
}

// ===== 生命周期 =====

onMounted(async () => {
  if (!otherId.value || otherId.value === 'undefined' || otherId.value === 'null') {
    ElMessage.warning('无效的对话')
    router.push('/chat')
    return
  }
  if (userStore.userInfo?.id) {
    myUserId.value = userStore.userInfo.id
  }
  try {
    const res = await request.get(`/api/user/${otherId.value}`)
    if (res.code === 200) {
      otherName.value = res.data.nickname || res.data.username || '用户'
    }
  } catch {
    otherName.value = '用户'
  }
  await loadMessages()
  connectWs()
})

onUnmounted(() => {
  disconnectWs()
})
</script>
<style scoped>
.chat-room-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 0 20px 20px;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 80px);
  background: #f8f6f3;
  border-radius: 16px;
}

/* ===== 头部 ===== */
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid #e8e0d6;
  background: #f8f6f3;
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-avatar {
  background: linear-gradient(135deg, #8b5e3c, #a0712a);
  color: #fff;
  font-weight: bold;
  flex-shrink: 0;
}
.header-info {
  flex: 1;
}
.chat-title {
  font-size: 16px;
  font-weight: 600;
  color: #3d2413;
}
.chat-status {
  font-size: 11px;
  color: #67c23a;
  margin-top: 2px;
}

/* ===== 消息列表 ===== */
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;
}

/* 日期分割线 */
.date-divider {
  display: flex;
  justify-content: center;
  margin-bottom: 4px;
}
.date-text {
  font-size: 11px;
  color: #b8956e;
  background: #ede4d8;
  padding: 2px 14px;
  border-radius: 10px;
}

/* 消息项 */
.message-item {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  max-width: 85%;
}
.message-item.mine {
  align-self: flex-end;
  flex-direction: row;
}
.message-item.other {
  align-self: flex-start;
}

.msg-avatar {
  flex-shrink: 0;
  margin-bottom: 18px;
}
.mine .msg-avatar {
  background: linear-gradient(135deg, #8b5e3c, #a0712a);
  color: #fff;
  font-weight: bold;
}
.other .msg-avatar {
  background: #d4c5b8;
  color: #6d4526;
  font-weight: bold;
}

.message-content {
  display: flex;
  flex-direction: column;
}

/* 气泡 */
.message-bubble {
  padding: 10px 14px;
  border-radius: 16px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-word;
}
.mine .message-bubble {
  background: linear-gradient(135deg, #8b5e3c, #a0712a);
  color: #fff;
  border-bottom-right-radius: 4px;
  box-shadow: 0 2px 8px rgba(139,94,60,0.15);
}
.other .message-bubble {
  background: #fff;
  color: #3d2413;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.message-text {
  white-space: pre-wrap;
}

/* 元信息 */
.message-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
  padding: 0 4px;
}
.mine .message-meta {
  justify-content: flex-end;
}
.message-time {
  font-size: 11px;
  color: #b8956e;
}
.status-icon {
  font-size: 12px;
}
.status-icon.sending {
  color: #b8956e;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ===== 输入区域 ===== */
.input-area {
  display: flex;
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid #e8e0d6;
  background: #f8f6f3;
}
.message-input {
  flex: 1;
}
.message-input :deep(.el-input__wrapper) {
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.message-input :deep(.el-input__wrapper):focus-within {
  box-shadow: 0 0 0 1px #a0712a;
}
.input-icon {
  color: #b8956e;
  font-size: 16px;
}
.send-btn {
  border-radius: 50% !important;
  width: 42px;
  height: 42px;
  padding: 0 !important;
  background: linear-gradient(135deg, #8b5e3c, #a0712a) !important;
  border: none !important;
  flex-shrink: 0;
}
.send-btn:hover {
  background: linear-gradient(135deg, #a0712a, #c4903e) !important;
}
.send-btn .el-icon {
  font-size: 18px;
}
.loading-icon {
  animation: spin 1s linear infinite;
}

/* ===== 响应式 ===== */

/* ===== 输入工具栏 ===== */
.input-toolbar {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: flex-end;
  padding-bottom: 4px;
}
.toolbar-btn {
  border: none !important;
  background: transparent !important;
  color: #b8956e !important;
  font-size: 18px;
  width: 32px;
  height: 32px;
}
.toolbar-btn:hover {
  background: rgba(139,94,60,0.08) !important;
  color: #8b5e3c !important;
}
.emoji-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;
  padding: 6px;
  max-height: 180px;
  overflow-y: auto;
}
.emoji-item {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  padding: 3px;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s;
}
.emoji-item:hover {
  background: #f0ebe4;
}
.msg-image {
  max-width: 220px;
  max-height: 260px;
  border-radius: 8px;
  cursor: pointer;
  display: block;
  transition: transform 0.15s;
}
.msg-image:hover {
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .chat-room-container {
    padding: 0 10px 10px;
    border-radius: 0;
    height: calc(100vh - 60px);
  }
  .chat-header { padding: 10px 0; }
  .message-item { max-width: 90%; }
  .msg-image { max-width: 160px; max-height: 200px; }
  .input-area { gap: 6px; }
}
</style>