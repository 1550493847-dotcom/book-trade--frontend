<template>
  <div class="cart-container">
    <h2>我的购物车</h2>

    <div class="cart-list" v-if="cartStore.items.length > 0">
      <el-card v-for="item in cartStore.items" :key="item.bookId" class="cart-item">
        <div class="item-content">
          <div class="item-image" @click="goToBook(item.bookId)">
            <img v-if="item.images && item.images !== '/img/null'" :src="getImageUrl(item.images.split(',')[0])" class="book-img" />
            <div v-else class="no-img">暂无图片</div>
          </div>
          <div class="item-info" @click="goToBook(item.bookId)">
            <div class="item-title">{{ item.title }}</div>
            <div class="item-author">作者：{{ item.author }}</div>
            <div class="item-price">¥{{ item.sellPrice }}</div>
          </div>
          <div class="item-actions">
            <el-button type="primary" size="small" @click="buyItem(item)">立即购买</el-button>
            <el-button type="danger" size="small" plain @click="removeItem(item.bookId)">删除</el-button>
          </div>
        </div>
      </el-card>

      <div class="cart-footer">
        <div class="cart-summary">
          共 <strong>{{ cartStore.items.length }}</strong> 件商品
          <span class="total-price">合计：¥{{ totalPrice }}</span>
        </div>
        <el-button type="danger" size="small" plain @click="clearAll">清空购物车</el-button>
      </div>
    </div>

    <div v-else class="empty">
      <el-empty description="购物车空空如也，去首页淘一淘吧~">
        <el-button type="primary" @click="$router.push('/')">逛逛首页</el-button>
      </el-empty>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { imageBaseUrl } from '@/api/request'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const cartStore = useCartStore()

const totalPrice = computed(() => {
  return cartStore.items.reduce((sum, i) => sum + (i.sellPrice || 0), 0).toFixed(2)
})

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return imageBaseUrl + path
}

const goToBook = (bookId) => {
  router.push(`/book/${bookId}`)
}

const removeItem = (bookId) => {
  cartStore.removeItem(bookId)
  ElMessage.success('已移除')
}

const clearAll = () => {
  ElMessageBox.confirm('确定清空购物车？', '提示', {
    type: 'warning',
    confirmButtonText: '确定',
    cancelButtonText: '取消'
  }).then(() => {
    cartStore.clearCart()
    ElMessage.success('购物车已清空')
  }).catch(() => {})
}

const buyItem = async (item) => {
  try {
    const res = await request.post('/api/order/create', { bookId: item.bookId })
    if (res.code === 200) {
      cartStore.removeItem(item.bookId)
      ElMessage.success('订单创建成功')
      router.push('/orders')
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch {
    ElMessage.error('请求失败')
  }
}
</script>

<style scoped>
.cart-container {
  max-width: 800px;
  margin: 0 auto;
}
h2 { margin-bottom: 20px; }
.cart-list { display: flex; flex-direction: column; gap: 12px; }
.cart-item { width: 100%; }
.item-content {
  display: flex; align-items: center; gap: 16px;
}
.item-image { width: 100px; flex-shrink: 0; cursor: pointer; }
.book-img { width: 100px; height: 100px; object-fit: cover; border-radius: 6px; }
.no-img {
  width: 100px; height: 100px; background: #f5f5f5; border-radius: 6px;
  display: flex; align-items: center; justify-content: center; color: #999;
}
.item-info { flex: 1; cursor: pointer; }
.item-title { font-size: 16px; font-weight: bold; margin-bottom: 6px; }
.item-author { color: #888; font-size: 13px; margin-bottom: 6px; }
.item-price { color: #f56c6c; font-size: 18px; font-weight: bold; }
.item-actions { display: flex; flex-direction: column; gap: 8px; flex-shrink: 0; }
.cart-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 0;
}
.cart-summary { font-size: 14px; color: #666; }
.total-price { color: #f56c6c; font-size: 18px; font-weight: bold; margin-left: 16px; }
.empty { margin-top: 60px; }
</style>
