<template>
  <div class="chat-room-container">
    <div class="chat-header">
      <el-button size="small" @click="$router.back()" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="chat-title">与 {{ otherName }} 的对话</span>
    </div>
    <div class="message-list" ref="messageListRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        :class="['message-item', msg.senderId === myUserId ? 'mine' : 'other']"
      >
        <div class="message-bubble">
          <div class="message-text">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.createTime) }}</div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <el-input
        v-model="inputText"
        placeholder="输入消息..."
        @keyup.enter="sendMessage"
        class="message-input"
      />
      <el-button type="primary" @click="sendMessage" :disabled="!inputText.trim()">发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
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

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = async () => {
  await nextTick()
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

const loadMessages = async () => {
  try {
    const res = await request.get(`/api/chat/messages/${otherId.value}`)
    if (res.code === 200) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

const connectWs = () => {
  if (!wsUrl.value) { startPollingFallback(); return }
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return
  }
  ws = new WebSocket(wsUrl.value)
  ws.onopen = () => { reconnectAttempts = 0; stopPollingFallback() }
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      const msg = data.type === 'message' ? data.data : data
      if (!msg || !msg.id) return
      const msgOtherId = String(msg.senderId === myUserId.value ? msg.receiverId : msg.senderId)
      if (msgOtherId !== otherId.value) return
      const exists = messages.value.some((m) => m.id === msg.id)
      if (!exists) { messages.value.push(msg); scrollToBottom() }
    } catch { /* ignore */ }
  }
  ws.onclose = (event) => {
    if (!event.wasClean && reconnectAttempts < 10) {
      reconnectTimer = setTimeout(() => { reconnectAttempts++; connectWs() }, 3000)
    }
  }
  ws.onerror = () => {
    console.warn('WebSocket 连接失败：后端未提供 ws://localhost:8080/ws/chat 端点，将降级为 REST 轮询模式')
    startPollingFallback()
  }
}

const disconnectWs = () => {
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  stopPollingFallback()
  if (ws) { ws.close(); ws = null }
}

// WebSocket 不可用时的降级轮询（5 秒间隔）
const startPollingFallback = () => {
  if (pollingTimer) return
  pollingTimer = setInterval(() => {
    loadMessages()
  }, 5000)
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
  if (!inputText.value.trim()) return
  const text = inputText.value.trim()
  inputText.value = ''

  const optimisticMsg = {
    id: `temp-${Date.now()}-${Math.random()}`,
    senderId: myUserId.value,
    content: text,
    createTime: new Date().toISOString(),
  }
  messages.value.push(optimisticMsg)
  scrollToBottom()

  if (wsSendMessage(text)) return

  try {
    const res = await request.post('/api/chat/send', {
      receiverId: Number(otherId.value),
      content: text,
    })
    if (res.code !== 200) {
      ElMessage.error(res.message || '发送失败')
    }
  } catch {
    ElMessage.error('发送失败（后端接口异常），请确认后端服务已启动')
  }
}

onMounted(async () => {
  // 检查 otherId 是否有效
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
}
.chat-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid #eee;
}
.chat-title {
  font-size: 16px;
  font-weight: bold;
}
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.message-item {
  display: flex;
}
.message-item.mine {
  justify-content: flex-end;
}
.message-item.other {
  justify-content: flex-start;
}
.message-bubble {
  max-width: 60%;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.5;
}
.mine .message-bubble {
  background: #409eff;
  color: white;
  border-bottom-right-radius: 4px;
}
.other .message-bubble {
  background: #f4f4f5;
  color: #333;
  border-bottom-left-radius: 4px;
}
.message-time {
  font-size: 11px;
  margin-top: 4px;
  opacity: 0.7;
}
.input-area {
  display: flex;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}
.message-input {
  flex: 1;
}

@media (max-width: 768px) {
  .chat-room-container { padding: 0 10px 10px; }
  .chat-header { padding: 10px 0; }
  .message-bubble { max-width: 80%; }
  .input-area { gap: 6px; }
}

</style>