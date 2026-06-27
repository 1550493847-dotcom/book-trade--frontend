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
          <h2>{{ book.title }}</h2>
          <p><strong>作者：</strong>{{ book.author || '未知' }}</p>
          <p><strong>分类：</strong>{{ book.category || '未分类' }}</p>
          <p class="price"><strong>售价：</strong>¥{{ book.sellPrice }}</p>
          <p class="original-price"><strong>原价：</strong>¥{{ book.originalPrice }}</p>
          <p><strong>描述：</strong>{{ book.description || '暂无描述' }}</p>
          <p><strong>浏览量：</strong>{{ book.viewCount || 0 }}</p>
          
          <div class="actions">
            <el-button type="primary" @click="buyNow">立即购买</el-button>
            <el-button @click="addToCart" type="warning" :disabled="cartInStore">
              {{ cartInStore ? '已在购物车' : '加入购物车' }}
            </el-button>
            <el-button type="success" @click="goChat">联系卖家</el-button>
            <el-button @click="goBack">返回</el-button>
          </div>
        </div>
      </div>
    </el-card>
    
    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const cartStore = useCartStore()
const book = ref(null)
const seller = ref(null)
const imageList = ref([])
const cartInStore = ref(false)

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return 'http://localhost:8080' + path
}

// 卖家头像
const sellerAvatar = computed(() => {
  if (!seller.value) return ''
  const avatar = seller.value.avatar
  if (!avatar) return ''
  if (avatar.startsWith('http')) return avatar
  return 'http://localhost:8080' + avatar
})

// 卖家昵称
const sellerNickname = computed(() => {
  return seller.value?.nickname || seller.value?.username || '未知'
})

// 在线状态
const onlineStatus = computed(() => {
  if (!seller.value?.lastLoginTime) return '暂无在线记录'
  const lastTime = new Date(seller.value.lastLoginTime)
  const now = new Date()
  const diffMs = now - lastTime
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 5) return '刚刚在线'
  if (diffMin < 60) return `${diffMin} 分钟前在线`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前在线`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} 天前在线`
})

// 卖家 IP
const sellerIp = computed(() => {
  return seller.value?.lastLoginIp || '未知'
})

// 来淘籍籍多少年
const yearsOnPlatform = computed(() => {
  if (!seller.value?.createTime) return '未知'
  const createTime = new Date(seller.value.createTime)
  const now = new Date()
  const diffYears = (now - createTime) / (365.25 * 24 * 60 * 60 * 1000)
  if (diffYears < 1) {
    const diffMonths = Math.floor(diffYears * 12)
    return diffMonths < 1 ? '不到 1' : diffMonths
  }
  return Math.floor(diffYears)
})

// 已售数量
const sellerSoldCount = computed(() => {
  return seller.value?.soldCount ?? 0
})

const loadBook = async () => {
  const id = route.params.id
  try {
    const res = await request.get(`/api/book/${id}`)
    if (res.code === 200) {
      const data = res.data
      book.value = data
      seller.value = data.seller || null
      if (data.images) {
        imageList.value = data.images.split(',')
      }
    } else {
      ElMessage.error('商品不存在')
      router.push('/')
    }
  } catch (error) {
    console.error('加载失败:', error)
    ElMessage.error('加载失败')
  }
}

const checkLogin = () => {
  if (!userStore.isLogin) {
    ElMessage.warning('请先登录')
    router.push('/login?redirect=' + route.fullPath)
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
    ElMessage.success('已加入购物车')
  } else {
    ElMessage.info('该商品已在购物车中')
  }
}

const goChat = () => {
  if (!checkLogin()) return
  const sid = seller.value?.id || book.value?.userId
  if (sid) {
    router.push(`/chat/${sid}`)
  } else {
    ElMessage.warning('无法获取卖家信息')
  }
}

const buyNow = async () => {
  if (!checkLogin()) return
  
  try {
    const res = await request.post('/api/order/create', {
      bookId: book.value.id
    })
    if (res.code === 200) {
      ElMessage.success('订单创建成功')
      router.push('/orders')
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error) {
    console.error('购买失败:', error)
    ElMessage.error('请求失败')
  }
}

const goSellerHome = () => {
  if (seller.value?.id) {
    router.push(`/user/${seller.value.id}`)
  }
}

const goBack = () => {
  router.back()
}

onMounted(() => {
  loadBook()
  cartInStore.value = cartStore.hasItem(Number(route.params.id))
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
.price {
  color: #f56c6c;
  font-size: 24px;
  font-weight: bold;
}
.original-price {
  text-decoration: line-through;
  color: #999;
}
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
.actions {
  margin-top: 30px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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
}
</style>
