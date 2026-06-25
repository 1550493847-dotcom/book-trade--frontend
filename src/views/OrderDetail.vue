<template>
  <div class="order-detail-container">
    <el-card v-if="order" class="detail-card">
      <template #header>
        <div class="card-header">
          <span>订单详情</span>
          <el-button size="small" @click="$router.back()">返回</el-button>
        </div>
      </template>

      <!-- 订单状态 -->
      <div class="order-status">
        <el-steps :active="getStepActive(order.status)" finish-status="success">
          <el-step title="已创建" />
          <el-step title="已付款" />
          <el-step title="已发货" />
          <el-step title="已完成" />
        </el-steps>
      </div>

      <!-- 商品信息 -->
      <div class="book-section">
        <h3>商品信息</h3>
        <div class="book-content" @click="goToBook(order.bookId)">
          <img v-if="order.bookImage" v-lazy="getImageUrl(order.bookImage)" class="book-img" />
          <div v-else class="no-img">暂无图片</div>
          <div class="book-info">
            <div class="book-title">{{ order.bookTitle || '二手图书' }}</div>
            <div>卖家：{{ order.sellerName || '未知' }}</div>
            <div class="price">¥{{ order.totalPrice }}</div>
          </div>
        </div>
      </div>

      <!-- 订单信息 -->
      <div class="info-section">
        <h3>订单信息</h3>
        <div class="info-row">
          <span class="label">订单号：</span>
          <span>{{ order.orderNo }}</span>
        </div>
        <div class="info-row">
          <span class="label">订单状态：</span>
          <el-tag :type="getStatusType(order.status)">{{ getStatusText(order.status) }}</el-tag>
        </div>
        <div class="info-row">
          <span class="label">创建时间：</span>
          <span>{{ formatDate(order.createTime) }}</span>
        </div>
        <div class="info-row" v-if="order.payTime">
          <span class="label">付款时间：</span>
          <span>{{ formatDate(order.payTime) }}</span>
        </div>
        <div class="info-row" v-if="order.shipTime">
          <span class="label">发货时间：</span>
          <span>{{ formatDate(order.shipTime) }}</span>
        </div>
        <div class="info-row" v-if="order.finishTime">
          <span class="label">完成时间：</span>
          <span>{{ formatDate(order.finishTime) }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="actions">
        <!-- 买家：待付款时显示付款和取消 -->
        <template v-if="order.role === 'buyer'">
          <el-button v-if="order.status === 0" type="primary" @click="payOrder">立即付款</el-button>
          <el-button v-if="order.status === 0" type="danger" @click="cancelOrder">取消订单</el-button>
          <el-button v-if="order.status === 2" type="success" @click="confirmReceive">确认收货</el-button>
          <el-button v-if="order.status === 3" type="warning" @click="goToReview">评价</el-button>
        </template>
        <!-- 卖家：待发货时显示发货 -->
        <template v-if="order.role === 'seller'">
          <el-button v-if="order.status === 1" type="primary" @click="shipOrder">标记发货</el-button>
        </template>
      </div>

      <!-- 评价区域 -->
      <div class="review-section" v-if="order.review">
        <h3>我的评价</h3>
        <div class="review-content">
          <el-rate v-model="order.review.rating" disabled />
          <p>{{ order.review.content }}</p>
          <span class="review-time">{{ formatDate(order.review.createTime) }}</span>
        </div>
      </div>
    </el-card>

    <div v-else class="loading">加载中...</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { imageBaseUrl } from '@/api/request'

const route = useRoute()
const router = useRouter()
const order = ref(null)

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return imageBaseUrl + path
}

const getStatusText = (status) => {
  const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
  return map[status] || '未知'
}

const getStatusType = (status) => {
  const map = { 0: 'warning', 1: 'primary', 2: 'info', 3: 'success', 4: 'danger' }
  return map[status] || 'info'
}

const getStepActive = (status) => {
  if (status === 4) return 0  // 已取消
  return status  // 0=创建, 1=付款, 2=发货, 3=完成
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadOrder = async () => {
  const id = route.params.id
  try {
    const res = await request.get(`/api/order/${id}`)
    if (res.code === 200) {
      order.value = res.data
    } else {
      ElMessage.error('订单不存在')
      router.push('/orders')
    }
  } catch (error) {
    ElMessage.error('加载失败')
  }
}

const payOrder = async () => {
  ElMessageBox.confirm('确认付款吗？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${order.value.id}/pay`)
      if (res.code === 200) {
        ElMessage.success('付款成功')
        loadOrder()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const cancelOrder = async () => {
  ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${order.value.id}/cancel`)
      if (res.code === 200) {
        ElMessage.success('订单已取消')
        loadOrder()
      } else {
        ElMessage.error(res.message || '取消失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const confirmReceive = async () => {
  ElMessageBox.confirm('确认已收到商品？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${order.value.id}/confirm`)
      if (res.code === 200) {
        ElMessage.success('已确认收货')
        loadOrder()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const shipOrder = async () => {
  ElMessageBox.confirm('确认已发货？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${order.value.id}/ship`)
      if (res.code === 200) {
        ElMessage.success('已标记发货')
        loadOrder()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const goToReview = () => {
  router.push(`/order/${order.value.id}/review`)
}

const goToBook = (bookId) => {
  if (bookId) router.push(`/book/${bookId}`)
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}
.order-status {
  margin-bottom: 30px;
}
.book-section, .info-section, .review-section {
  margin-bottom: 24px;
}
.book-section h3, .info-section h3, .review-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}
.book-content {
  display: flex;
  gap: 16px;
  cursor: pointer;
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}
.book-img {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}
.no-img {
  width: 100px;
  height: 100px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 4px;
}
.book-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 8px;
}
.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin-top: 8px;
}
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
.info-row .label {
  color: #666;
  width: 100px;
  flex-shrink: 0;
}
.actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
.review-content {
  padding: 12px;
  background: #fafafa;
  border-radius: 8px;
}
.review-content p {
  margin: 8px 0;
  color: #333;
}
.review-time {
  color: #999;
  font-size: 12px;
}
.loading {
  text-align: center;
  padding: 50px;
  color: #999;
}
</style>
