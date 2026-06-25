<template>
  <div class="favorites-container">
    <h2>我的收藏</h2>

    <div class="book-list" v-loading="loading">
      <el-card
        v-for="item in favoriteList"
        :key="item.id"
        class="book-card"
      >
        <div class="book-content" @click="goToDetail(item.bookId || item.id)">
          <div class="book-image">
            <img v-if="item.images && item.images !== '/img/null'" :src="getImageUrl(item.images.split(',')[0])" class="book-img" />
            <div v-else class="no-img">暂无图片</div>
          </div>
          <div class="book-info">
            <div class="book-title">{{ item.title || item.bookTitle }}</div>
            <div>作者：{{ item.author || '未知' }}</div>
            <div class="price">¥{{ item.sellPrice || item.price }}</div>
          </div>
        </div>
        <div class="card-actions">
          <el-button type="danger" size="small" @click="removeFavorite(item.id)">取消收藏</el-button>
        </div>
      </el-card>
    </div>

    <div v-if="!loading && favoriteList.length === 0" class="empty">
      <el-empty description="还没有收藏的图书哦~" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request, { imageBaseUrl } from '@/api/request'

const router = useRouter()
const favoriteList = ref([])
const loading = ref(false)

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return imageBaseUrl + path
}

const loadFavorites = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/favorite/list')
    if (res.code === 200) {
      favoriteList.value = res.data || []
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

const removeFavorite = (id) => {
  ElMessageBox.confirm('确定取消收藏吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/api/favorite/${id}`)
      if (res.code === 200) {
        ElMessage.success('已取消收藏')
        loadFavorites()
      } else {
        ElMessage.error(res.message || '操作失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const goToDetail = (bookId) => {
  router.push(`/book/${bookId}`)
}

onMounted(() => {
  loadFavorites()
})
</script>

<style scoped>
.favorites-container {
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.book-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.book-card {
  width: 100%;
}
.book-content {
  display: flex;
  gap: 20px;
  cursor: pointer;
}
.book-image {
  width: 120px;
  flex-shrink: 0;
}
.book-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}
.no-img {
  width: 120px;
  height: 120px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  border-radius: 4px;
}
.book-info {
  flex: 1;
}
.book-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 8px;
}
.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}
.card-actions {
  margin-top: 12px;
  text-align: right;
}
.empty {
  margin-top: 50px;
}
</style>
