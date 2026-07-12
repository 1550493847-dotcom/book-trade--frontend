<template>
  <div class="order-detail-page">
    <div class="order-detail-layout">
      <ProfileSidebar activeMenu="center" />
      <main class="order-detail-content" v-if="order">
        <div class="order-detail-box">
          <!-- 订单进度条 -->
          <div class="order-steps">
            <el-steps :active="getStepActive(order.status)" finish-status="success" align-center>
              <el-step title="下单" />
              <el-step title="付款" />
              <el-step title="发货" />
              <el-step title="成交" />
            </el-steps>
          </div>

          <div class="section-divider"></div>

          <!-- 卖家信息栏 -->
          <div class="seller-bar">
            <a class="left" href="javascript:void(0)">
              <el-avatar :size="28" :src="getImageUrl(order.seller?.avatar)">
                {{ getSellerInitial() }}
              </el-avatar>
              <div class="name">{{ getSellerName() }}</div>
            </a>
            <div class="status-tag" :class="'status-' + order.status">
              {{ getStatusText(order.status) }}
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- 商品卡片 -->
          <div class="product-main">
            <div class="picture">
              <img :src="getImageUrl(order.bookImage)" style="object-fit:cover;width:96px;height:96px;border-radius:8px;" />
            </div>
            <div class="info">
              <router-link :to="`/book/${order.bookId}`" class="desc">
                <div class="name">{{ order.bookTitle }}</div>
                <div class="tags" v-if="order.bookAuthor">
                  <span class="sku">作者：{{ order.bookAuthor }}</span>
                </div>
              </router-link>
              <div class="price">¥{{ order.totalPrice?.toFixed(2) }}</div>
            </div>
          </div>

          <div class="section-divider"></div>

          <!-- 操作按钮 -->
          <div class="btns">
            <el-button size="small" round class="action-btn primary-btn" @click="buyAgain">再次购买</el-button>
            <el-button size="small" round class="action-btn" @click="viewReview">查看评价</el-button>
            <el-button size="small" round class="action-btn" @click="viewPayment">查看钱款</el-button>
            <el-button size="small" round class="action-btn" @click="reportSeller">投诉卖家</el-button>
            <el-button size="small" round class="action-btn" @click="deleteOrder">删除订单</el-button>
            <el-button size="small" round class="action-btn" @click="contactSeller">联系卖家</el-button>
          </div>

          <div class="section-divider"></div>

          <!-- 订单信息列表 -->
          <ul class="info-list">
            <li class="info-item">
              <div class="bold-text">
                <span class="money-title">成交价</span>
                <span class="money-note">（已到达卖家账户）</span>
              </div>
              <div class="bold-money">¥{{ order.totalPrice?.toFixed(2) }}</div>
            </li>
            <div class="section-divider"></div>
            <li class="info-item">
              <div class="text-label">订单编号</div>
              <div class="text-value">
                <span>{{ order.orderNo }}</span>
                <span class="copy-btn" @click="copyText(order.orderNo)">复制</span>
              </div>
            </li>
            <li class="info-item">
              <div class="text-label">交易快照</div>
              <div class="text-value">
                <span>发生交易争议时，可作为判断依据</span>
                <router-link :to="`/book/${order.bookId}`" class="copy-btn">查看</router-link>
              </div>
            </li>
            <li class="info-item">
              <div class="text-label">卖家昵称</div>
              <div class="text-value">{{ getSellerName() }}</div>
            </li>
            <li class="info-item">
              <div class="text-label">下单时间</div>
              <div class="text-value">{{ formatDate(order.createTime) }}</div>
            </li>
            <li class="info-item" v-if="order.payTime">
              <div class="text-label">付款时间</div>
              <div class="text-value">{{ formatDate(order.payTime) }}</div>
            </li>
            <li class="info-item" v-if="order.shipTime">
              <div class="text-label">发货时间</div>
              <div class="text-value">{{ formatDate(order.shipTime) }}</div>
            </li>
            <li class="info-item" v-if="order.confirmTime">
              <div class="text-label">成交时间</div>
              <div class="text-value">{{ formatDate(order.confirmTime) }}</div>
            </li>
          </ul>
        </div>
      </main>

      <main v-else class="order-detail-content">
        <div class="loading">加载中...</div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue"
import { useRoute, useRouter } from "vue-router"
import { ElMessage, ElMessageBox } from "element-plus"
import ProfileSidebar from "@/components/ProfileSidebar.vue"
import request, { imageBaseUrl } from "@/api/request"

const route = useRoute()
const router = useRouter()
const order = ref(null)

const getImageUrl = (path) => {
  if (!path) return ""
  if (path.startsWith("http")) return path
  return imageBaseUrl + path
}

const getSellerInitial = () => {
  if (!order.value) return "?"
  const seller = order.value.seller
  const name = seller?.nickname || seller?.username || "?"
  return name.charAt(0)
}

const getSellerName = () => {
  if (!order.value) return "未知"
  const seller = order.value.seller
  if (seller) return seller.nickname || seller.username
  return order.value.sellerName || "未知"
}

const getStepActive = (status) => {
  if (status === 4) return 0
  return status
}

const getStatusText = (status) => {
  const map = { 0: "待付款", 1: "待发货", 2: "待收货", 3: "已完成", 4: "已取消" }
  return map[status] || "未知"
}

const formatDate = (dateStr) => {
  if (!dateStr) return ""
  const date = new Date(dateStr)
  const pad = (n) => String(n).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

const copyText = (text) => {
  if (!text) return
  navigator.clipboard.writeText(text).then(() => {
    ElMessage.success("已复制")
  }).catch(() => {
    ElMessage.warning("复制失败")
  })
}

const loadOrder = async () => {
  const id = route.params.id
  try {
    const res = await request.get(`/api/order/${id}`)
    if (res.code === 200) {
      order.value = res.data
    } else {
      ElMessage.error("订单不存在")
      router.push("/orders")
    }
  } catch (error) {
    ElMessage.error("加载失败")
  }
}

const buyAgain = () => {
  if (order.value?.bookId) router.push(`/book/${order.value.bookId}`)
}

const viewReview = () => {
  ElMessage.info("评价功能开发中")
}

const viewPayment = () => {
  ElMessage.info("查看钱款功能开发中")
}

const reportSeller = () => {
  ElMessageBox.confirm("确定要投诉该卖家吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(() => {
    ElMessage.success("投诉已提交")
  }).catch(() => {})
}

const deleteOrder = async () => {
  ElMessageBox.confirm("确定要删除该订单吗？", "提示", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    type: "warning"
  }).then(async () => {
    try {
      const res = await request.delete(`/api/order/${order.value.id}`)
      if (res.code === 200) {
        ElMessage.success("已删除")
        router.push("/orders")
      }
    } catch (error) {
      ElMessage.error("删除失败")
    }
  }).catch(() => {})
}

const contactSeller = () => {
  if (order.value?.sellerId) {
    router.push(`/chat?userId=${order.value.sellerId}`)
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.order-detail-page {
  background: #f5f0eb;
  min-height: calc(100vh - 60px);
}
.order-detail-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  gap: 24px;
  align-items: flex-start;
}
.order-detail-content {
  flex: 1;
  min-width: 0;
}

/* 主容器 - 合并所有内容 */
.order-detail-box {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
}

/* 分隔线 */
.section-divider {
  height: 1px;
  background: #eee;
}

/* 订单进度条 */
.order-steps {
  padding: 24px 40px;
}

/* 卖家信息栏 */
.seller-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
}
.left {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  text-decoration: none;
  color: inherit;
}
.name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.status-tag {
  font-size: 13px;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
}
.status-0 { color: #e6a23c; background: #fdf6ec; }
.status-1 { color: #409eff; background: #ecf5ff; }
.status-2 { color: #909399; background: #f4f4f5; }
.status-3 { color: #67c23a; background: #f0f9eb; }
.status-4 { color: #c0c4cc; background: #f5f5f5; }

/* 商品 */
.product-main {
  display: flex;
  gap: 16px;
  padding: 16px 24px;
}
.picture {
  flex-shrink: 0;
}
.info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.desc {
  text-decoration: none;
  color: inherit;
}
.name {
  font-size: 15px;
  color: #333;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.tags { margin-top: 4px; }
.sku { font-size: 12px; color: #999; }
.price {
  font-size: 20px;
  font-weight: bold;
  color: #f56c6c;
}

/* 操作按钮 */
.btns {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 24px;
}
.action-btn {
  font-size: 12px !important;
  padding: 6px 16px !important;
  border-radius: 20px !important;
  border: 1px solid #e0e0e0 !important;
  background: #fff !important;
  color: #333 !important;
  transition: all 0.2s !important;
}
.action-btn:hover {
  border-color: #ccc !important;
  background: #fafafa !important;
}
.primary-btn {
  background: #8b5e3c !important;
  border-color: #8b5e3c !important;
  color: #fff !important;
  font-weight: 500 !important;
}
.primary-btn:hover {
  background: #3d2413 !important;
  border-color: #3d2413 !important;
  color: #fff !important;
}

/* 订单信息列表 */
.info-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 24px;
}
.bold-text {
  display: flex;
  align-items: center;
  gap: 8px;
}
.money-title { font-size: 14px; color: #333; }
.money-note { font-size: 12px; color: #a3a3a3; }
.bold-money {
  font-size: 22px;
  font-weight: bold;
  color: #f56c6c;
}
.text-label {
  font-size: 14px;
  color: #999;
  width: 100px;
  flex-shrink: 0;
}
.text-value {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  font-size: 14px;
  color: #333;
}
.copy-btn {
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
  flex-shrink: 0;
  text-decoration: none;
}
.copy-btn:hover { text-decoration: underline; }

/* 加载 */
.loading {
  text-align: center;
  padding: 100px 0;
  color: #999;
  font-size: 16px;
}

@media (max-width: 768px) {
  .order-detail-layout { flex-direction: column; padding: 12px; }
  .btns { justify-content: flex-start; }
  .order-steps { padding: 16px; }
}
</style>




