<template>
  <div class="detail-container">
    <el-card v-if="book" class="book-card">
      <!-- ===== 卖家信息区域 ===== -->
      <div class="seller-section" v-if="seller">
        <div class="seller-avatar-area">
          <el-avatar :size="48" :src="sellerAvatar">{{ sellerNickname.charAt(0) }}</el-avatar>
        </div>
        <div class="seller-info">
          <div class="seller-nickname">{{ sellerNickname }}</div>
          <div class="seller-meta">
            <span class="meta-item">{{ onlineStatus }}</span>
            <span class="meta-sep">|</span>
            <span class="meta-item">IP：{{ sellerIp }}</span>
            <span class="meta-sep">|</span>
            <span class="meta-item">来淘籍籍 {{ yearsOnPlatform }} 年</span>
            <span class="meta-sep">|</span>
            <span class="meta-item">已售 {{ sellerSoldCount }} 件</span>
          </div>
        </div>
        <el-button class="seller-home-btn" plain @click="goSellerHome">卖家主页</el-button>
      </div>

      <el-divider />
      
      <!-- ===== 图书详情区域 ===== -->
      <div class="book-detail">
        <div class="images">
          <el-carousel height="400px" v-if="imageList.length > 0">
            <el-carousel-item v-for="(img, index) in imageList" :key="index">
              <img v-lazy="getImageUrl(img)" class="detail-img" />
            </el-carousel-item>
          </el-carousel>
          <div v-else class="no-img">暂无图片</div>
        </div>
        
        <div class="info">
          <!-- 价格 + 包邮 -->
          <div class="price-row">
            <span class="price">&yen;{{ book.sellPrice }}</span>
            <span class="shipping-tag">包邮</span>
          </div>
          
          <!-- 原价 -->
          <div class="original-price-row" v-if="book.originalPrice">
            原价 &yen;{{ book.originalPrice }}
          </div>
          
          <!-- 浏览 + 退货 -->
          <div class="meta-row">
            <span class="view-count">{{ book.viewCount || 0 }}浏览</span>
            <span class="return-policy">描述不符包邮退</span>
          </div>
          
          <!-- 详细描述 -->
          <div class="desc-section">
            <div class="desc-text">{{ book.description || "暂无描述" }}</div>
          </div>
          
          <!-- 图书参数 (2列网格) -->
          <div class="params-grid">
            <div class="param-item">
              <span class="param-label">ISBN编号：</span>
              <span class="param-value">{{ book.isbn || "暂无" }}</span>
            </div>
            <div class="param-item">
              <span class="param-label">书名：</span>
              <span class="param-value">{{ book.title }}</span>
            </div>
            <div class="param-item">
              <span class="param-label">作者：</span>
              <span class="param-value">{{ book.author || "暂无" }}</span>
            </div>
            <div class="param-item">
              <span class="param-label">出版社：</span>
              <span class="param-value">{{ book.publisher || "暂无" }}</span>
            </div>
            <div class="param-item">
              <span class="param-label">成色：</span>
              <span class="param-value">{{ book.bookCondition || "暂无" }}</span>
            </div>
          </div>
          
          <!-- 操作按钮 -->
          <div class="actions">
            <div class="buy-group">
              <button class="buy-btn" @click="buyNow">立即购买</button>
              <span class="btn-divider"></span>
              <button class="chat-btn" @click="goChat">联系卖家</button>
            </div>
            <el-button type="warning" @click="addToCart" :disabled="cartInStore" class="cart-btn">
              {{ cartInStore ? "已在购物车" : "加入购物车" }}
            </el-button>
            <el-button class="fav-btn" :class="{ favorited: isFavorited }" @click="toggleFavorite">
              {{ isFavorited ? "&#9829; 已收藏" : "&#9825; 收藏" }}
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage } from "element-plus"
import request from "@/api/request"
import { useUserStore } from "@/stores/user"
import { useCartStore } from "@/stores/cart"

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const book = ref(null)
const seller = ref(null)
const imageList = ref([])
const cartInStore = ref(false)
const isFavorited = ref(false)

const getImageUrl = (path) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return "http://localhost:8080" + path
}

// 卖家头像
const sellerAvatar = computed(() => {
  if (!seller.value) return ""
  const avatar = seller.value.avatar
  if (!avatar) return ""
  if (avatar.startsWith("http")) return avatar
  return "http://localhost:8080" + avatar
})

// 卖家昵称
const sellerNickname = computed(() => {
  return seller.value?.nickname || seller.value?.username || "未知"
})

// 在线状态
const onlineStatus = computed(() => {
  if (!seller.value?.lastLoginTime) return "暂无在线记录"
  const lastTime = new Date(seller.value.lastLoginTime)
  const now = new Date()
  const diffMs = now - lastTime
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 5) return "刚刚在线"
  if (diffMin < 60) return diffMin + " 分钟前在线"
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return diffHour + " 小时前在线"
  const diffDay = Math.floor(diffHour / 24)
  return diffDay + " 天前在线"
})

// 卖家 IP
const sellerIp = computed(() => {
  return seller.value?.lastLoginIp || "未知"
})

// 来淘籍籍多少年
const yearsOnPlatform = computed(() => {
  if (!seller.value?.createTime) return "未知"
  const createTime = new Date(seller.value.createTime)
  const now = new Date()
  const diffYears = (now - createTime) / (365.25 * 24 * 60 * 60 * 1000)
  if (diffYears < 1) {
    const diffMonths = Math.floor(diffYears * 12)
    return diffMonths < 1 ? "不到 1" : diffMonths
  }
  return Math.floor(diffYears)
})

// 已售数量
const sellerSoldCount = computed(() => {
  return seller.value?.soldCount ?? 0
})

const checkFavorite = async () => {
  try {
    const res = await request.get("/api/favorite/check/" + route.params.id)
    if (res.code === 200) {
      isFavorited.value = res.data
    }
  } catch (e) {
    // 未登录或错误时默认 false
  }
}

const toggleFavorite = async () => {
  if (!userStore.isLogin) {
    ElMessage.warning("请先登录")
    router.push("/login?redirect=" + route.fullPath)
    return
  }
  try {
    if (isFavorited.value) {
      const res = await request.delete("/api/favorite/book/" + route.params.id)
      if (res.code === 200) {
        isFavorited.value = false
        ElMessage.success("已取消收藏")
      }
    } else {
      const res = await request.post("/api/favorite/add", { bookId: book.value.id })
      if (res.code === 200) {
        isFavorited.value = true
        ElMessage.success("已收藏")
      }
    }
  } catch (e) {
    ElMessage.error("操作失败")
  }
}

const loadBook = async () => {
  const id = route.params.id
  try {
    const res = await request.get("/api/book/" + id)
    if (res.code === 200) {
      const data = res.data
      book.value = data
      seller.value = data.seller || null
      if (data.images) {
        imageList.value = data.images.split(",")
      }
    } else {
      ElMessage.error("商品不存在")
      router.push("/")
    }
  } catch (error) {
    console.error("加载失败:", error)
    ElMessage.error("加载失败")
  }
}

const checkLogin = () => {
  if (!userStore.isLogin) {
    ElMessage.warning("请先登录")
    router.push("/login?redirect=" + route.fullPath)
    return false
  }
  return true
}

const addToCart = () => {
  if (!checkLogin()) return
  if (!book.value) return

  const ok = cartStore.addItem(book.value)
  if (ok) {
    cartInStore.value = true
    ElMessage.success("已加入购物车")
  } else {
    ElMessage.info("该商品已在购物车中")
  }
}

const goChat = () => {
  if (!checkLogin()) return
  const sid = seller.value?.id || book.value?.userId
  if (sid) {
    router.push("/chat/" + sid)
  } else {
    ElMessage.warning("无法获取卖家信息")
  }
}

const buyNow = async () => {
  if (!checkLogin()) return
  
  try {
    const res = await request.post("/api/order/create", {
      bookId: book.value.id
    })
    if (res.code === 200) {
      ElMessage.success("订单创建成功")
      router.push("/orders")
    } else {
      ElMessage.error(res.message || "创建失败")
    }
  } catch (error) {
    console.error("购买失败:", error)
    ElMessage.error("请求失败")
  }
}

const goSellerHome = () => {
  if (seller.value?.id) {
    router.push("/user/" + seller.value.id)
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadBook()
  cartInStore.value = cartStore.hasItem(Number(route.params.id))
  checkFavorite()
})
</script>

<style scoped>
.detail-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.book-card {
  border-radius: 12px;
  overflow: hidden;
}

/* ===== 卖家信息区域 ===== */
.seller-section {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 20px;
  background: linear-gradient(135deg, #faf6f0 0%, #f5f0eb 100%);
  border-radius: 10px;
  border: 1px solid #e8ddd0;
}

.seller-home-btn {
  margin-left: auto;
  flex-shrink: 0;
  background: #fff !important;
  border-color: #d0c0b0 !important;
  color: #6b5a4a !important;
  font-size: 13px;
  border-radius: 6px;
}

.seller-home-btn:hover {
  background: #faf6f0 !important;
  border-color: #a0712a !important;
  color: #a0712a !important;
}

.seller-avatar-area {
  flex-shrink: 0;
  line-height: 0;
}

.seller-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.seller-nickname {
  font-size: 15px;
  font-weight: 600;
  color: #3d2413;
  line-height: 1.3;
}

.seller-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.meta-item {
  font-size: 12px;
  color: #8a7a6a;
  white-space: nowrap;
}

.meta-sep {
  font-size: 12px;
  color: #c0b0a0;
  margin: 0 1px;
}

/* ===== 图书详情 ===== */
.book-detail {
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
}
.images {
  flex: 1;
  min-width: 300px;
}
.info {
  flex: 1;
  min-width: 300px;
}

/* 价格 */
.price-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}
.price {
  color: #f56c6c;
  font-size: 28px;
  font-weight: bold;
}
.shipping-tag {
  display: inline-block;
  background: #f56c6c;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}
.original-price-row {
  font-size: 14px;
  color: #999;
  text-decoration: line-through;
  margin-bottom: 10px;
}

/* 浏览 + 退货 */
.meta-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}
.view-count {
  font-size: 13px;
  color: #666;
}
.return-policy {
  font-size: 12px;
  color: #f56c6c;
  border: 1px solid #f56c6c;
  padding: 1px 6px;
  border-radius: 3px;
}

/* 详细描述 */
.desc-section {
  margin-bottom: 18px;
}
.desc-text {
  font-size: 14px;
  color: #444;
  line-height: 1.7;
  white-space: pre-wrap;
}

/* 图书参数 2列网格 */
.params-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px 20px;
  margin-bottom: 20px;
  padding: 12px;
  background: #faf8f5;
  border-radius: 8px;
}
.param-item {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px dashed #eee;
}
.param-item:nth-last-child(-n+2) {
  border-bottom: none;
}
.param-label {
  color: #888;
  font-size: 13px;
  white-space: nowrap;
  flex-shrink: 0;
}
.param-value {
  color: #333;
  font-size: 13px;
}

/* 图片 */
.detail-img {
  width: 100%;
  height: 400px;
  object-fit: contain;
}
.no-img {
  width: 100%;
  height: 400px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

/* ===== 操作按钮 ===== */
.actions {
  margin-top: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

/* 立即购买 + 联系卖家 组合按钮 */
.buy-group {
  display: inline-flex;
  align-items: stretch;
  border-radius: 50px;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
}

.buy-group button {
  border: none;
  outline: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 10px 22px;
  transition: opacity 0.2s;
  color: #fff;
  letter-spacing: 0.5px;
}

.buy-group button:hover {
  opacity: 0.85;
}

.buy-btn {
  background: linear-gradient(135deg, #c07a2a, #d4943e);
}

.chat-btn {
  background: linear-gradient(135deg, #56a83a, #67c23a);
}

.btn-divider {
  width: 1px;
  background: rgba(255,255,255,0.35);
  flex-shrink: 0;
}

/* 加入购物车 */
.cart-btn {
  border-radius: 50px !important;
  padding: 10px 22px !important;
  font-size: 14px !important;
}

/* 收藏按钮 */
.fav-btn {
  border-radius: 50px !important;
  padding: 10px 20px !important;
  font-size: 14px !important;
  background: #fff !important;
  border-color: #d0c0b0 !important;
  color: #8a7a6a !important;
  margin-left: auto;
}

.fav-btn:hover {
  border-color: #f56c6c !important;
  color: #f56c6c !important;
  background: #fff5f5 !important;
}

.fav-btn.favorited {
  border-color: #f56c6c !important;
  color: #f56c6c !important;
  background: #fff5f5 !important;
}

.loading {
  text-align: center;
  padding: 50px;
}

@media (max-width: 768px) {
  .detail-container { padding: 12px; }
  .seller-section { align-items: flex-start; }
  .book-detail { flex-direction: column; }
  .images { width: 100%; }
  .info { width: 100%; }
  .detail-img { height: 250px; }
  .params-grid { grid-template-columns: 1fr; }
  .actions { gap: 8px; }
  .fav-btn { margin-left: 0; }
}
</style>
