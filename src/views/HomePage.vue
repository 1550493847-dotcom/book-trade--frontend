<template>
  <div class="home-container">
    <!-- 筛选区域（分类 + 排序） -->
    <div class="filter-bar">
      <div class="filter-left">
        <span class="result-hint" v-if="route.query.keyword">
          搜索 "{{ route.query.keyword }}" 的结果
        </span>
      </div>
      <div class="filter-right">
        <el-select v-model="category" placeholder="全部分类" clearable @change="loadBooks" class="filter-select">
          <el-option label="文学" value="文学" />
          <el-option label="科技" value="科技" />
          <el-option label="教材" value="教材" />
          <el-option label="历史" value="历史" />
          <el-option label="哲学" value="哲学" />
          <el-option label="艺术" value="艺术" />
          <el-option label="外语" value="外语" />
          <el-option label="考试" value="考试" />
          <el-option label="其他" value="其他" />
        </el-select>
        <el-select v-model="sortBy" placeholder="排序" @change="loadBooks" class="filter-select">
          <el-option label="默认排序" value="" />
          <el-option label="价格从低到高" value="price_asc" />
          <el-option label="价格从高到低" value="price_desc" />
          <el-option label="最新发布" value="newest" />
        </el-select>
      </div>
    </div>

    <!-- 图书列表 -->
    <div class="book-list" v-loading="loading">
      <el-card
        v-for="book in bookList"
        :key="book.id"
        class="book-card"
        @click="goToDetail(book.id)"
      >
        <template #header>
          <div class="book-title">{{ book.title }}</div>
        </template>
        <div class="book-info">
          <div v-if="book.images && book.images !== '/img/null'">
            <img v-lazy="getImageUrl(book.images.split(',')[0])" class="book-img" />
          </div>
          <div v-else class="no-img">暂无图片</div>
          <div>作者：{{ book.author || '未知' }}</div>
          <div>分类：{{ book.category || '未分类' }}</div>
          <div class="price">¥{{ book.sellPrice }}</div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <div v-if="!loading && bookList.length === 0" class="empty">
      <el-empty :description="route.query.keyword ? '没找到相关图书，换个关键词试试~' : '暂无图书上架~'" />
    </div>

    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="pageSize"
        :total="total"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request, { imageBaseUrl } from '@/api/request'

const router = useRouter()
const route = useRoute()
const bookList = ref([])
const loading = ref(false)
const category = ref('')
const sortBy = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const total = ref(0)

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return imageBaseUrl + path
}

const loadBooks = async () => {
  loading.value = true
  if (!route.query.keyword) currentPage.value = 1
  try {
    const params = { page: currentPage.value, size: pageSize.value }
    if (route.query.keyword) params.keyword = route.query.keyword
    if (category.value) params.category = category.value
    if (sortBy.value) params.sortBy = sortBy.value

    const res = await request.get('/api/book/list', { params })
    if (res.code === 200) {
      if (Array.isArray(res.data)) {
        bookList.value = res.data
        total.value = res.data.length
      } else if (res.data && res.data.records) {
        bookList.value = res.data.records
        total.value = res.data.total || res.data.records.length
      } else {
        bookList.value = res.data || []
        total.value = (res.data || []).length
      }
    } else {
      ElMessage.error('加载失败')
    }
  } catch (error) {
    console.error('加载错误：', error)
    ElMessage.error('请求失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadBooks()
}

const goToDetail = (id) => {
  router.push(`/book/${id}`)
}

// 搜索关键词或筛选条件变化时重新加载
watch([() => route.query.keyword, category, sortBy], () => {
  currentPage.value = 1
  loadBooks()
})

onMounted(() => {
  loadBooks()
})
</script>

<style scoped>
.home-container {
  padding: 0;
}
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 20px;
  padding: 14px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.result-hint {
  color: #8b5e3c;
  font-size: 14px;
  font-weight: 500;
}
.filter-right {
  display: flex;
  gap: 10px;
}
.filter-select {
  width: 140px;
}
.book-list {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
}
.book-card {
  width: 280px;
  cursor: pointer;
  transition: transform 0.2s;
}
.book-card:hover {
  transform: translateY(-5px);
}
.book-title {
  font-size: 18px;
  font-weight: bold;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.book-info {
  line-height: 1.8;
}
.book-img {
  width: 100%;
  height: 150px;
  object-fit: cover;
}
.no-img {
  width: 100%;
  height: 150px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}
.pagination {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}
.empty {
  margin-top: 50px;
}

@media (max-width: 768px) {
  .book-list { gap: 10px; }
  .book-card { width: calc(50% - 5px); }
  .book-card:hover { transform: none; }
  .filter-bar { flex-direction: column; align-items: stretch; }
  .filter-right { flex-direction: column; gap: 8px; }
  .filter-select { width: 100%; }
  .pagination { margin-top: 16px; }
  .empty { margin-top: 30px; }
}

</style>
