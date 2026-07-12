<template>
  <div class="orders-page">
    <div class="orders-layout">
      <!-- ===== 左侧导航 ===== -->
      <ProfileSidebar :activeMenu="orderType" />

      <!-- ===== 右侧内容 ===== -->
      <main class="orders-content">
        <!-- 状态标签 -->
        <div class="order-tabs">
          <button
            v-for="tab in orderTabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 订单列表 -->
        <div class="order-list" v-loading="loading">
          <template v-if="filteredOrders.length > 0">
            <div v-for="order in filteredOrders" :key="order.id" class="order-card">
              <!-- 卡片头部 -->
              <div class="card-header">
                <div class="header-left">
                  <router-link :to="orderType === 'buy' ? `/user/${order.sellerId}` : `/user/${order.buyerId}`" class="user-link">
                    <el-avatar :size="28" :src="getUserAvatar(order)">{{ getDisplayName(order).charAt(0) }}</el-avatar>
                    <span class="user-name">{{ getDisplayName(order) }}</span>
                  </router-link>
                </div>
                <span class="order-status" :class="'status-' + order.status">{{ getStatusText(order.status) }}</span>
              </div>

              <!-- 卡片主体 -->
              <div class="card-body">
                <router-link :to="`/order/${order.id}`" class="body-left">
                  <div class="book-image">
                    <img v-if="order.bookImage" :src="getImageUrl(order.bookImage)" alt="商品图片" />
                    <div v-else class="no-image">📖</div>
                  </div>
                </router-link>
                <div class="body-right">
                  <router-link :to="`/order/${order.id}`" class="book-title">{{ order.bookTitle || '商品已删除' }}</router-link>
                  <div class="book-desc">{{ order.bookDescription || '' }}</div>
                  <div class="book-price">¥{{ order.totalPrice?.toFixed(2) }}</div>
                </div>
              </div>

              <!-- 卡片底部（操作按钮） -->
              <div class="card-footer">
                <!-- 买家操作 -->
                <template v-if="orderType === 'buy'">
                  <button v-if="order.status === 0" class="btn btn-primary" @click="payOrder(order.id)">立即付款</button>
                  <button v-if="order.status === 2" class="btn btn-primary" @click="confirmReceive(order.id)">确认收货</button>
                  <button v-if="order.status === 3" class="btn btn-default" @click="goReview(order.id)">去评价</button>
                  <button v-if="order.status === 0 || order.status === 1" class="btn btn-default" @click="cancelOrder(order.id)">取消订单</button>
                </template>
                <!-- 卖家操作 -->
                <template v-else>
                  <button v-if="order.status === 1" class="btn btn-primary" @click="shipOrder(order.id)">标记发货</button>
                </template>
                <button class="btn btn-default" @click="contactSeller(order)">联系{{ orderType === 'buy' ? '卖家' : '买家' }}</button>
                <button class="btn btn-default" @click="goToDetail(order.id)">订单详情</button>
              </div>
            </div>
          </template>

          <div v-else-if="!loading" class="empty-state">
            <el-empty :description="'暂无' + getActiveTabLabel() + '订单'" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import ProfileSidebar from '@/components/ProfileSidebar.vue'

const router = useRouter()
const loading = ref(false)
const orderType = ref('buy') // 'buy' | 'sell'
const activeTab = ref('all')
const orders = ref([])


const orderTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending_pay', label: '待付款' },
  { key: 'pending_ship', label: '待发货' },
  { key: 'pending_receive', label: '待收货' },
  { key: 'pending_review', label: '待评价' },
  { key: 'refund', label: '退款/取消' },
]

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + path
}

const getStatusText = (status) => {
  const map = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消', '-1': '已取消' }
  return map[status] || '未知'
}

const getUserAvatar = (order) => {
  if (orderType.value === 'buy' && order.seller) return order.seller.avatar
  if (orderType.value === 'sell' && order.buyer) return order.buyer.avatar
  return ''
}

const getDisplayName = (order) => {
  if (orderType.value === 'buy' && order.seller) return order.seller.nickname || order.seller.username
  if (orderType.value === 'sell' && order.buyer) return order.buyer.nickname || order.buyer.username
  return '用户'
}

const filteredOrders = computed(() => {
  if (activeTab.value === 'all') return orders.value
  if (activeTab.value === 'pending_pay') return orders.value.filter(o => o.status === 0)
  if (activeTab.value === 'pending_ship') return orders.value.filter(o => o.status === 1)
  if (activeTab.value === 'pending_receive') return orders.value.filter(o => o.status === 2)
  if (activeTab.value === 'pending_review') return orders.value.filter(o => o.status === 3)
  if (activeTab.value === 'refund') return orders.value.filter(o => o.status === 4 || o.status === -1)
  return orders.value
})

const getActiveTabLabel = () => {
  const tab = orderTabs.find(t => t.key === activeTab.value)
  return tab ? tab.label : ''
}

const switchOrderType = (type) => {
  orderType.value = type
  activeTab.value = 'all'
  loadOrders()
}

const switchTab = (tab) => {
  activeTab.value = tab
}

const loadOrders = async () => {
  loading.value = true
  try {
    const url = orderType.value === 'buy' ? '/api/order/my/buy' : '/api/order/my/sell'
    const res = await request.get(url)
    if (res.code === 200) {
      orders.value = res.data || []
    } else {
      ElMessage.error('加载失败')
    }
  } catch (error) {
    console.error('加载错误:', error)
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/order/${id}`)
}

const goReview = (id) => {
  router.push(`/order/${id}/review`)
}

const contactSeller = (order) => {
  const otherUserId = orderType.value === 'buy' ? order.sellerId : order.buyerId
  router.push(`/chat/${otherUserId}`)
}

const payOrder = async (id) => {
    try {
      const res = await request.post("/api/pay/alipay", { orderId: id })
      if (res.code === 200 && res.data) {
        const div = document.createElement("div")
        div.innerHTML = res.data
        document.body.appendChild(div)
        document.querySelector("form").submit()
      } else {
        ElMessage.error(res.message || "支付请求失败")
      }
    } catch (error) {
      ElMessage.error("支付请求失败，请重试")
    }
  }

const cancelOrder = (id) => {
  ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${id}/cancel`)
      if (res.code === 200) {
        ElMessage.success('订单已取消')
        loadOrders()
      } else {
        ElMessage.error(res.message || '取消失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const confirmReceive = (id) => {
  ElMessageBox.confirm('确认已收到商品？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${id}/confirm`)
      if (res.code === 200) {
        ElMessage.success('已确认收货')
        loadOrders()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const shipOrder = (id) => {
  ElMessageBox.confirm('确认已发货？', '提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消'
  }).then(async () => {
    try {
      const res = await request.put(`/api/order/${id}/ship`)
      if (res.code === 200) {
        ElMessage.success('已标记发货')
        loadOrders()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadOrders()
})
</script>

<style scoped>
.orders-page {
  min-height: calc(100vh - 60px);
  background: #f5f0eb;
}

.orders-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

/* 侧边栏已提取到 ProfileSidebar.vue 组件中 */

/* ===== 右侧内容 ===== */
.orders-content {
  flex: 1;
  min-width: 0;
}

/* 状态标签 */
.order-tabs {
  display: flex;
  gap: 0;
  background: #fff;
  border-radius: 20px 20px 0 0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  overflow: hidden;
}

.tab-btn {
  flex: 1;
  padding: 12px 8px;
  border: none;
  background: #fff;
  color: #666;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}
.tab-btn:hover {
  color: #3d2413;
  background: #faf8f6;
}
.tab-btn.active {
  color: #3d2413;
  font-weight: 600;
  border-bottom-color: #8b5e3c;
}

/* 订单列表 */
.order-list {
  background: #fff;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  min-height: 200px;
}

/* 订单卡片 */
.order-card {
  border-bottom: 1px solid #f0f0f0;
  padding: 16px 20px;
}
.order-card:last-child {
  border-bottom: none;
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.header-left {
  display: flex;
  align-items: center;
}

.user-link {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  cursor: pointer;
}
.user-link:hover .user-name {
  color: #3d2413;
}

.user-name {
  font-size: 13px;
  color: #333;
  font-weight: 500;
}

.order-status {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 20px;
}
.order-status.status-0 { color: #e6a23c; background: #fdf6ec; }
.order-status.status-1 { color: #409eff; background: #ecf5ff; }
.order-status.status-2 { color: #909399; background: #f4f4f5; }
.order-status.status-3 { color: #67c23a; background: #f0f9eb; }
.order-status.status-4,
.order-status.status--1 { color: #999; background: #f5f5f5; }

/* 卡片主体 */
.card-body {
  display: flex;
  gap: 14px;
  margin-bottom: 14px;
}

.body-left {
  flex-shrink: 0;
  text-decoration: none;
  cursor: pointer;
}

.book-image {
  width: 112px;
  height: 112px;
  border-radius: 20px;
  overflow: hidden;
  background: #f5f0eb;
}
.book-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #ccc;
}

.body-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.book-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  text-decoration: none;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 4px;
}
.book-title:hover {
  color: #3d2413;
}

.book-desc {
  font-size: 12px;
  color: #999;
  margin-bottom: auto;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-price {
  font-size: 20px;
  font-weight: 700;
  color: #f56c6c;
  margin-top: 8px;
}


/* 卡片底部 */
.card-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.btn {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #e0e0e0;
  background: #fff;
  color: #333;
  transition: all 0.2s;
  white-space: nowrap;
}
.btn-default:hover {
  border-color: #ccc;
  background: #fafafa;
}
.btn-primary {
  background: #ffe60f;
  border-color: #ffe60f;
  color: #333;
  font-weight: 500;
}
.btn-primary:hover {
  background: #f5d900;
  border-color: #f5d900;
}

/* 空状态 */
.empty-state {
  padding: 60px 0;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .orders-layout {
    flex-direction: column;
    padding: 12px;
  }

  .order-tabs {
    overflow-x: auto;
  }
  .tab-btn {
    flex: none;
    padding: 10px 14px;
    font-size: 12px;
  }
  .book-image {
    width: 80px;
    height: 80px;
  }
  .card-footer {
    flex-wrap: wrap;
  }
}
</style>

