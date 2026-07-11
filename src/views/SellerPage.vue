<template>
  <div class="seller-page">
    <el-card v-if="seller" class="seller-card">
      <div class="seller-header">
        <el-avatar :size="64" :src="sellerAvatar">{{ sellerNickname.charAt(0) }}</el-avatar>
        <div class="seller-header-info">
          <h2>{{ sellerNickname }}</h2>
          <div class="seller-meta">
            <span>{{ onlineStatus }}</span>
            <span class="sep">|</span>
            <span>IP：{{ sellerIp }}</span>
            <span class="sep">|</span>
            <span>来淘籍籍 {{ yearsOnPlatform }} 年</span>
            <span class="sep">|</span>
            <span>已售 {{ sellerSoldCount }} 件</span>
          </div>
        </div>
      </div>
    </el-card>

    <div class="books-section">
      <h3>发布的商品</h3>
      <div v-if="books.length > 0" class="book-grid">
        <el-card v-for="book in books" :key="book.id" class="book-card" shadow="hover" @click="$router.push('/book/' + book.id)">
          <img :src="getImageUrl(book.images?.split(',')[0])" class="book-cover" />
          <div class="book-info">
            <div class="book-title">{{ book.title }}</div>
            <div class="book-price">¥{{ book.sellPrice }}</div>
          </div>
        </el-card>
      </div>
      <el-empty v-else description="暂无商品" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const seller = ref(null)
const books = ref([])

const sellerAvatar = computed(() => {
  if (!seller.value) return ''
  const a = seller.value.avatar
  if (!a) return ''
  return a.startsWith('http') ? a : (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + a
})

const sellerNickname = computed(() => seller.value?.nickname || seller.value?.username || '未知')

const onlineStatus = computed(() => {
  if (!seller.value?.lastLoginTime) return '暂无在线记录'
  const diffMs = Date.now() - new Date(seller.value.lastLoginTime).getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 5) return '刚刚在线'
  if (diffMin < 60) return `${diffMin} 分钟前在线`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} 小时前在线`
  return `${Math.floor(diffHour / 24)} 天前在线`
})

const sellerIp = computed(() => seller.value?.lastLoginIp || '未知')

const yearsOnPlatform = computed(() => {
  if (!seller.value?.createTime) return '未知'
  const diffYears = (Date.now() - new Date(seller.value.createTime).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  if (diffYears < 1) {
    const m = Math.floor(diffYears * 12)
    return m < 1 ? '不到 1' : m
  }
  return Math.floor(diffYears)
})

const sellerSoldCount = computed(() => seller.value?.soldCount ?? 0)

const getImageUrl = (path) => {
  if (!path) return ''
  return path.startsWith('http') ? path : 'http://localhost:8080' + path
}

onMounted(async () => {
  const id = route.params.id
  try {
    const res = await request.get(`/api/user/${id}`)
    if (res.code === 200) {
      seller.value = res.data
    }
    // Load their books
    const bookRes = await request.get('/api/book/list')
    if (bookRes.code === 200) {
      books.value = (bookRes.data || []).filter(b => b.userId == id && b.status === 0)
    }
  } catch (e) {
    console.error(e)
  }
})
</script>

<style scoped>
.seller-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}
.seller-card {
  margin-bottom: 30px;
  border-radius: 12px;
}
.seller-header {
  display: flex;
  align-items: center;
  gap: 20px;
}
.seller-header-info h2 {
  margin: 0 0 6px 0;
  color: #3d2413;
  font-size: 20px;
}
.seller-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-size: 13px;
  color: #8a7a6a;
}
.sep {
  color: #c0b0a0;
  margin: 0 4px;
}
.books-section h3 {
  font-size: 18px;
  color: #3d2413;
  margin-bottom: 20px;
}
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 16px;
}
.book-card {
  cursor: pointer;
  border-radius: 10px;
  overflow: hidden;
}
.book-cover {
  width: 100%;
  height: 180px;
  object-fit: cover;
}
.book-info {
  padding: 10px;
}
.book-title {
  font-size: 14px;
  color: #3d2413;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-price {
  font-size: 16px;
  color: #f56c6c;
  font-weight: bold;
  margin-top: 4px;
}
</style>