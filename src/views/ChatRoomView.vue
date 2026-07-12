<template>
  <div class="chat-room-view">
    <div class="chat-header">
      <div class="header-info">
        <div class="chat-title">{{ otherName || "用户" }}</div>
      </div>
    </div>
    <div class="message-list" ref="msgListRef" v-loading="loading">
      <div v-for="(msg, index) in messages" :key="msg.id || index" :class="['msg-item', (msg.senderId ?? msg.fromUserId) == myUserId ? 'mine' : 'other']">
        <div v-if="!isImage(msg.content)" class="msg-bubble">
          <span class="msg-text">{{ msg.content }}</span>
        </div>
        <img v-else :src="msg.content" class="msg-image" @load="scrollToBottom" />
        <div class="msg-time">{{ formatMsgTime(msg.createTime) }}</div>
      </div>
      <div v-if="!loading && messages.length === 0" class="empty-msg">
        <el-empty description="--没有消息--" :image-size="50" />
      </div>
    </div>
    <div class="sendbox">
      <div class="sendbox-topbar" style="position:relative">
        <img class="toolbar-icon" src="/emoji.ico" alt="表情" title="表情" @click="toggleEmoji" />
        <img class="toolbar-icon" src="/picture.ico" alt="相册" title="相册" @click="pickImage" />
        <img class="toolbar-icon" src="/orders.ico" alt="订单" title="订单" @click="toggleOrders" />
        <!-- emoji picker -->
        <div v-if="showEmoji" class="emoji-picker" @click.stop>
          <span v-for="e in emojiList" :key="e" class="emoji-item" @click="insertEmoji(e)">{{ e }}</span>
        </div>
        <!-- hidden file input -->
        <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="uploadImage" />
        <!-- order picker -->
        <div v-if="showOrders" class="order-picker" @click.stop>
          <div v-if="myBooks.length === 0" class="order-empty">没有可发送的商品</div>
          <div v-for="book in myBooks" :key="book.id" class="order-item" @click="sendOrder(book)">
            <span class="order-name">{{ book.title }}</span>
            <span class="order-price">¥{{ book.sellPrice }}</span>
          </div>
        </div>
      </div>
      <div class="sendbox-textarea-wrap">
        <textarea
          v-model="inputText"
          class="sendbox-textarea"
          placeholder="请输入消息，按Enter键发送或点击发送按钮发送"
          @keyup.enter="sendMessage"
          :disabled="!otherUserId"
        ></textarea>
      </div>
      <div class="sendbox-bottom">
        <button type="button" class="sendbox-btn" @click="sendMessage" :disabled="!inputText.trim() || !otherUserId">发 送</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue"
import { ElMessage } from "element-plus"
import request from "@/api/request"
import { useUserStore } from "@/stores/user"

const props = defineProps({
  otherUserId: { type: [Number, String], default: null },
  otherName: { type: String, default: "" }
})

const userStore = useUserStore()
const myUserId = ref(parseInt(userStore.userInfo?.id || "-1"))
const messages = ref([])
const loading = ref(false)
const inputText = ref("")
const msgListRef = ref(null)
let pollTimer = null

const isImage = (content) => {
  return typeof content === "string" && (content.endsWith(".png") || content.endsWith(".jpg") || content.endsWith(".jpeg") || content.endsWith(".gif") || content.endsWith(".webp") || content.startsWith("data:image"))
}

const formatMsgTime = (t) => {
  if (!t) return ""
  const d = new Date(t)
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0")
}

const scrollToBottom = () => {
  nextTick(() => {
    const el = msgListRef.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

const loadMessages = async () => {
  if (!props.otherUserId) return
  loading.value = true
  try {
    const res = await request.get("/api/chat/messages/" + props.otherUserId)
    if (res.code === 200) {
      messages.value = res.data || []
      scrollToBottom()
    }
  } catch (e) {
    console.error("load error", e)
  } finally {
    loading.value = false
  }
}

const sendMessage = async () => {
  const text = inputText.value.trim()
  if (!text || !props.otherUserId) return
  inputText.value = ""
  try {
    const res = await request.post("/api/chat/send", {
      receiverId: parseInt(props.otherUserId),
      content: text
    })
    if (res.code === 200) loadMessages()
    else ElMessage.error("send failed")
  } catch {
    ElMessage.error("send failed")
  }
}

watch(() => props.otherUserId, (val) => {
  if (val) {
    loadMessages()
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(loadMessages, 5000)
  } else {
    messages.value = []
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
  }
})

const showEmoji = ref(false)
const showOrders = ref(false)
const fileInput = ref(null)
const myBooks = ref([])

const emojiList = ["😀","😃","😄","😁","😆","😅","🤣","😂","🙂","🙃","😉","😊","😇","🥰","😍","🤩","😘","😗","😚","😙","😋","😛","😜","🤪","😝","🤑","🤗","🤭","🤫","🤔","🤐","🤨","😐","😑","😶","😏","😒","🙄","😬","🤥","😌","😔","😪","🤤","😴","😷","🤒","🤕","🤢","🤮","🤧","🥵","🥶","🥴","😵","🤯","🤠","🥳","🥸","😎","🤓","🧐","😕","😟","🙁","😮","😯","😲","😳","🥺","😦","😧","😨","😰","😥","😢","😭","😱","😖","😣","😞","😓","😩","😫","🥱","😤","😡","😠","🤬","😈","👿","💀","💩","🎰"]

const toggleEmoji = () => {
  showEmoji.value = !showEmoji.value
  showOrders.value = false
}
const orderTab = ref("other")
const orderList = ref([])
const getImageUrl = (path) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  return base + path
}
const toggleOrders = () => {
  showOrders.value = !showOrders.value
  showEmoji.value = false
  if (showOrders.value) { orderTab.value = "other"; loadOtherBooks() }
}
const loadOtherBooks = async () => {
  if (!props.otherUserId) return
  try {
    const res = await request.get("/api/book/user/" + props.otherUserId)
    if (res.code === 200) orderList.value = res.data || []
    else orderList.value = []
  } catch { orderList.value = [] }
}
const loadMyBooksForOrder = async () => {
  try {
    const res = await request.get("/api/book/my")
    if (res.code === 200) orderList.value = res.data || []
  } catch {}
}
const insertEmoji = (e) => {
  inputText.value += e
  showEmoji.value = false
}
const pickImage = () => {
  fileInput.value?.click()
}
const uploadImage = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  const form = new FormData()
  form.append("file", file)
  try {
    const res = await request.post("/api/upload", form)
    if (res.code === 200) {
      const url = res.data?.url || res.data
      await request.post("/api/chat/send", { receiverId: parseInt(props.otherUserId), content: url })
      loadMessages()
    } else {
      ElMessage.error("上传失败")
    }
  } catch { ElMessage.error("上传失败") }
  e.target.value = ""
}
const loadMyBooks = async () => {
  try {
    const res = await request.get("/api/book/my")
    if (res.code === 200) myBooks.value = res.data || []
  } catch {}
}
const sendOrder = async (book) => {
  const text = "我想参考这本书：" + book.title + " (¥" + book.sellPrice + ")"
  await request.post("/api/chat/send", { receiverId: parseInt(props.otherUserId), content: text })
  showOrders.value = false
  loadMessages()
}

// close popups on click outside
const closePopups = (e) => {
  const el = document.querySelector(".sendbox-topbar")
  if (el && !el.contains(e.target)) {
    showEmoji.value = false
    showOrders.value = false
  }
}
onMounted(() => document.addEventListener("click", closePopups))
onUnmounted(() => {
  document.removeEventListener("click", closePopups)
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<style scoped>
.chat-room-view { display: flex; flex-direction: column; height: 100%; }
.chat-header { padding: 14px 20px; border-bottom: 1px solid #eee; }
.chat-title { font-size: 16px; font-weight: 600; color: #3d2413; }
.message-list { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 12px; }
.msg-item { display: flex; flex-direction: column; max-width: 70%; }
.msg-item.mine { align-self: flex-end; align-items: flex-end; }
.msg-item.other { align-self: flex-start; align-items: flex-start; }
.msg-bubble { padding: 10px 14px; border-radius: 16px; font-size: 14px; line-height: 1.5; word-break: break-word; }
.mine .msg-bubble { background: linear-gradient(135deg, #8b5e3c, #a0712a); color: #fff; border-bottom-right-radius: 4px; }
.other .msg-bubble { background: #f5f0eb; color: #3d2413; border-bottom-left-radius: 4px; }
.msg-text { white-space: pre-wrap; }
.msg-time { font-size: 10px; color: #a3a3a3; margin-top: 2px; padding: 0 4px; }
.msg-image { max-width: 200px; max-height: 240px; border-radius: 8px; cursor: pointer; display: block; }
.empty-msg { align-self: center; margin-top: 60px; }
.sendbox { border-top: 1px solid #eee; background: #fafafa; padding: 8px 16px 12px; }
.sendbox-topbar { display: flex; gap: 12px; padding: 4px 0 8px; }
.toolbar-icon { cursor: pointer; width: 28px; height: 28px; object-fit: contain; border-radius: 6px; transition: background 0.15s; padding: 3px; }
.toolbar-icon:hover { background: #e8e0d6; }
.sendbox-textarea-wrap { margin-bottom: 6px; }
.sendbox-textarea { width: 100%; height: 62px; border: none; outline: none; background: #fcfcfc; resize: none; font-size: 13px; line-height: 1.5; padding: 6px 10px; border-radius: 8px; box-sizing: border-box; font-family: inherit; }
.sendbox-textarea:disabled { background: #f5f5f5; }
.sendbox-textarea::placeholder { color: #bbb; }
.sendbox-bottom { display: flex; justify-content: flex-end; }
.sendbox-btn { width: 80px; height: 32px; background: rgba(255, 230, 15, 0.3); color: rgba(51, 51, 51, 0.4); border: none; border-radius: 20px; font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.2s; letter-spacing: -1px; }
.sendbox-btn:not(:disabled) { background: linear-gradient(135deg, #8b5e3c, #a0712a); color: #fff; }
.sendbox-btn:not(:disabled):hover { background: linear-gradient(135deg, #a0712a, #c4903e); }
.sendbox-btn:disabled { cursor: not-allowed; }
.emoji-picker {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 280px;
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  display: flex;
  flex-wrap: wrap;
  gap: 2px;
  padding: 8px;
  z-index: 100;
}
.emoji-item {
  font-size: 22px;
  cursor: pointer;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background 0.15s;
}
.emoji-item:hover { background: #f0ebe4; }
.order-picker {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 320px;
  max-height: 300px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}
.order-tabs {
  display: flex;
  border-bottom: 1px solid #eee;
  flex-shrink: 0;
}
.order-tab {
  flex: 1;
  text-align: center;
  padding: 10px 0;
  font-size: 13px;
  color: #666;
  cursor: pointer;
  transition: all 0.15s;
}
.order-tab.active {
  color: #3d2413;
  font-weight: 600;
  border-bottom: 2px solid #8b5e3c;
}
.order-tab:hover { background: #f5f0eb; }
.order-empty { padding: 30px; text-align: center; font-size: 13px; color: #999; }
.order-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  transition: background 0.15s;
  border-bottom: 1px solid #f5f5f5;
}
.order-item:hover { background: #f5f0eb; }
.order-img { width: 44px; height: 44px; object-fit: cover; border-radius: 8px; flex-shrink: 0; background: #eee; }
.order-img-placeholder { width: 44px; height: 44px; border-radius: 8px; flex-shrink: 0; background: #f0ebe4; }
.order-info { flex: 1; min-width: 0; }
.order-name { font-size: 13px; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.order-price { font-size: 13px; color: #d4943e; font-weight: 600; margin-top: 2px; }
.order-send-btn { flex-shrink: 0; padding: 4px 14px; font-size: 12px; background: linear-gradient(135deg, #8b5e3c, #a0712a); color: #fff; border: none; border-radius: 20px; cursor: pointer; transition: all 0.15s; }
.order-send-btn:hover { background: linear-gradient(135deg, #a0712a, #c4903e); }
</style>

