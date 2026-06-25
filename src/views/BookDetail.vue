<template>
  <div class="detail-container">
    <el-card v-if="book">
      <div class="book-detail">
        <div class="images">
          <el-carousel height="400px" v-if="imageList.length > 0">
            <el-carousel-item v-for="(img, index) in imageList" :key="index">
              <img :src="getImageUrl(img)" class="detail-img" />
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
          <p><strong>卖家：</strong>{{ book.sellerName || '未知' }}</p>
          
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
import { ref, onMounted } from 'vue'
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
const imageList = ref([])
const cartInStore = ref(false)

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return 'http://localhost:8080' + path
}

const loadBook = async () => {
  const id = route.params.id
  try {
    const res = await request.get(`/api/book/${id}`)
    if (res.code === 200) {
      book.value = res.data
      if (book.value.images) {
        imageList.value = book.value.images.split(',')
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
  if (book.value.sellerId) {
    router.push(`/chat/${book.value.sellerId}`)
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
</style>