<template>
  <div class="chat-room-container">
    <div class="chat-header">
      <el-button size="small" @click="$router.back()" circle>
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <span class="chat-title">与 {{ otherName }} 的对话</span>
    </div>
    <div class="message-list" ref="messageListRef">
      <div v-for="msg in messages" :key="msg.id" :class="['message-item', msg.senderId === myUserId ? 'mine' : 'other']">
        <div class="message-bubble">
          <div class="message-text">{{ msg.content }}</div>
          <div class="message-time">{{ formatTime(msg.createTime) }}</div>
        </div>
      </div>
    </div>
    <div class="input-area">
      <el-input v-model="inputText" placeholder="输入消息..." @keyup.enter="sendMessage" class="message-input" />
      <el-button type="primary" @click="sendMessage" :disabled="!inputText.trim()">发送</el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
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
  const otherId = route.params.id
  try {
    const res = await request.get(`/api/chat/messages/${otherId}`)
    if (res.code === 200) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (error) {
    console.error('加载消息失败:', error)
  }
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  const otherId = route.params.id
  try {
    const res = await request.post('/api/chat/send', {
      receiverId: otherId,
      content: inputText.value.trim()
    })
    if (res.code === 200) {
      messages.value.push(res.data || {
        id: Date.now(),
        senderId: myUserId.value,
        content: inputText.value.trim(),
        createTime: new Date().toISOString()
      })
      inputText.value = ''
      scrollToBottom()
    } else {
      ElMessage.error(res.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error('发送失败')
  }
}

const startPolling = () => {
  pollingTimer = setInterval(() => {
    loadMessages()
  }, 5000)
}

onMounted(async () => {
  if (userStore.userInfo?.id) {
    myUserId.value = userStore.userInfo.id
  }
  const otherId = route.params.id
  try {
    const res = await request.get(`/api/user/${otherId}`)
    if (res.code === 200) {
      otherName.value = res.data.nickname || res.data.username || '用户'
    }
  } catch (error) {
    otherName.value = '用户'
  }
  await loadMessages()
  startPolling()
})

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
  }
})
</script>

<style scoped>
.chat-room-container { max-width: 700px; margin: 0 auto; padding: 0 20px 20px; display: flex; flex-direction: column; height: calc(100vh - 80px); }
.chat-header { display: flex; align-items: center; gap: 12px; padding: 16px 0; border-bottom: 1px solid #eee; }
.chat-title { font-size: 16px; font-weight: bold; }
.message-list { flex: 1; overflow-y: auto; padding: 20px 0; display: flex; flex-direction: column; gap: 16px; }
.message-item { display: flex; }
.message-item.mine { justify-content: flex-end; }
.message-item.other { justify-content: flex-start; }
.message-bubble { max-width: 60%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
.mine .message-bubble { background: #409eff; color: white; border-bottom-right-radius: 4px; }
.other .message-bubble { background: #f4f4f5; color: #333; border-bottom-left-radius: 4px; }
.message-time { font-size: 11px; margin-top: 4px; opacity: 0.7; }
.input-area { display: flex; gap: 10px; padding-top: 12px; border-top: 1px solid #eee; }
.message-input { flex: 1; }
</style>