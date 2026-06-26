<template>
  <div class="orders-container">
    <h2>我的订单</h2>
    
    <!-- 标签页切换 -->
    <el-tabs v-model="activeTab" @tab-click="handleTabClick">
      <el-tab-pane label="我买的" name="buy"></el-tab-pane>
      <el-tab-pane label="我卖的" name="sell"></el-tab-pane>
    </el-tabs>

    <!-- 订单列表 -->
    <div class="order-list" v-loading="loading">
      <el-card v-for="order in orderList" :key="order.id" class="order-card">
        <div class="order-content">
          <div class="order-info" @click="goToDetail(order.id)" style="cursor: pointer; flex: 1;">
            <div class="order-no">订单号：{{ order.orderNo }}</div>
            <div>商品：{{ order.bookTitle || `商品ID: ${order.bookId}` }}</div>
            <div class="price">总价：¥{{ order.totalPrice }}</div>
            <div>创建时间：{{ formatDate(order.createTime) }}</div>
            <div class="status">
              状态：
              <el-tag :type="getStatusType(order.status)">
                {{ getStatusText(order.status) }}
              </el-tag>
            </div>
          </div>
          <div class="order-actions">
            <el-button size="small" @click="goToDetail(order.id)">查看详情</el-button>
            <!-- 买家：待付款时显示取消 -->
            <el-button
              v-if="activeTab === 'buy' && order.status === 0"
              type="danger"
              size="small"
              @click="cancelOrder(order.id)"
            >
              取消订单
            </el-button>
            <!-- 买家：待收货时显示确认收货 -->
            <el-button
              v-if="activeTab === 'buy' && order.status === 2"
              type="success"
              size="small"
              @click="confirmReceive(order.id)"
            >
              确认收货
            </el-button>
            <!-- 卖家：待发货时显示发货 -->
            <el-button
              v-if="activeTab === 'sell' && order.status === 1"
              type="primary"
              size="small"
              @click="shipOrder(order.id)"
            >
              标记发货
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="!loading && orderList.length === 0" class="empty">
      <el-empty description="暂无订单" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'

const router = useRouter()
const activeTab = ref('buy')
const orderList = ref([])
const loading = ref(false)

const getStatusText = (status) => {
  const statusMap = { 0: '待付款', 1: '待发货', 2: '待收货', 3: '已完成', 4: '已取消' }
  return statusMap[status] || '未知'
}

const getStatusType = (status) => {
  const typeMap = { 0: 'warning', 1: 'primary', 2: 'info', 3: 'success', 4: 'danger' }
  return typeMap[status] || 'info'
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

const loadOrders = async () => {
  loading.value = true
  try {
    const url = activeTab.value === 'buy' ? '/api/order/my/buy' : '/api/order/my/sell'
    const res = await request.get(url)
    if (res.code === 200) {
      orderList.value = res.data || []
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

const handleTabClick = () => {
  loadOrders()
}

const goToDetail = (id) => {
  router.push(`/order/${id}`)
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
.orders-container {
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.order-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.order-card {
  width: 100%;
}
.order-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-info {
  flex: 1;
}
.order-no {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}
.price {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
  margin: 10px 0;
}
.status {
  margin-top: 10px;
}
.order-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 16px;
}
.empty {
  margin-top: 50px;
}

@media (max-width: 768px) {
  .orders-container { padding: 12px; }
  .order-card { width: 100%; }
  .order-card:hover { transform: none; }
  .order-header { flex-direction: column; align-items: flex-start; gap: 6px; }
}

</style>
