<template>
  <div class="review-container">
    <el-card class="review-card">
      <template #header>
        <div class="card-header">
          <span>订单评价</span>
          <el-button size="small" @click="$router.back()">返回</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="80px">
        <el-form-item label="评分">
          <el-rate v-model="form.rating" :max="5" show-text :texts="['很差', '差', '一般', '好', '非常好']" />
        </el-form-item>

        <el-form-item label="评价内容">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="5"
            placeholder="分享你的购买体验吧~"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="submitReview" :loading="loading" :disabled="form.rating === 0">
            提交评价
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/api/request'

const route = useRoute()
const router = useRouter()
const loading = ref(false)

const form = reactive({
  rating: 5,
  content: ''
})

const submitReview = async () => {
  if (form.rating === 0) {
    ElMessage.warning('请给个评分~')
    return
  }

  loading.value = true
  const orderId = route.params.id
  try {
    const res = await request.post(`/api/order/${orderId}/review`, {
      rating: form.rating,
      content: form.content
    })
    if (res.code === 200) {
      ElMessage.success('评价成功，感谢你的反馈！')
      router.push(`/order/${orderId}`)
    } else {
      ElMessage.error(res.message || '评价失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.review-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}
</style>
