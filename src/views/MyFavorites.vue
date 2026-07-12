<template>
  <div class="favorites-page">
    <div class="favorites-layout">
      <!-- 左侧导航 -->
      <ProfileSidebar activeMenu="favorites" />

      <!-- 右侧内容 -->
      <main class="favorites-content">
        <!-- 状态标签 -->
        <div class="fav-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ active: activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- 商品网格 -->
        <div class="fav-grid" v-loading="loading">
          <template v-if="filteredList.length > 0">
            <div v-for="item in filteredList" :key="item.id" class="fav-card">
              <a class="card-link" @click="goToDetail(item.bookId || item.id)">
                <div class="card-image">
                  <img v-if="item.images && item.images !== '/img/null'" :src="getImageUrl(item.images.split(',')[0])" />
                  <div v-else class="no-img">📖</div>
                </div>
                <div class="card-body">
                  <div class="card-title" :title="item.title || item.bookTitle">{{ item.title || item.bookTitle }}</div>
                  <div class="card-row-placeholder"></div>
                  <div class="card-price">
                    <span class="price-sign">¥</span>
                    <span class="price-number" v-html="formatPrice(item.sellPrice || item.price)"></span>
                  </div>
                  <div class="card-stats">
                    <span class="card-status">{{ getStatusText(item.status) }}</span>
                  </div>
                </div>
              </a>
              <div class="card-actions">
                <button class="action-btn action-danger" @click="removeFavorite(item.id)">取消收藏</button>
              </div>
            </div>
          </template>

          <div v-else-if="!loading" class="empty-state">
            <el-empty description="还没有收藏的图书哦~" />
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
const favoriteList = ref([])
const activeTab = ref('all')

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'offshelf', label: '已下架' },
  { key: 'sold', label: '已售出' },
]

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + path
}

const formatPrice = (price) => {
  if (price == null) return '0'
  const parts = price.toFixed(2).split('.')
  return parts[0] + '<span class="price-decimal">.' + parts[1] + '</span>'
}

const getStatusText = (status) => {
  if (status === 0) return '在售'
  if (status === 1) return '已售出'
  if (status === 2) return '已下架'
  return '未知'
}

const filteredList = computed(() => {
  if (activeTab.value === 'all') return favoriteList.value
  if (activeTab.value === 'offshelf') return favoriteList.value.filter(i => i.status === 2)
  if (activeTab.value === 'sold') return favoriteList.value.filter(i => i.status === 1)
  return favoriteList.value
})

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
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete('/api/favorite/' + id)
      if (res.code === 200) { ElMessage.success('已取消收藏'); loadFavorites() }
      else { ElMessage.error(res.message || '操作失败') }
    } catch (error) { ElMessage.error('请求失败') }
  }).catch(() => {})
}

const goToDetail = (bookId) => {
  router.push('/book/' + bookId)
}

onMounted(() => { loadFavorites() })
</script>

<style scoped>
.favorites-page {
  min-height: calc(100vh - 60px);
  background: #f5f0eb;
}

.favorites-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

.favorites-content {
  flex: 1;
  min-width: 0;
}

/* 状态标签 */
.fav-tabs {
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
.tab-btn:hover { color: #3d2413; background: #faf8f6; }
.tab-btn.active {
  color: #3d2413;
  font-weight: 600;
  border-bottom-color: #8b5e3c;
}

/* 商品网格 */
.fav-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: #fff;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  padding: 20px;
  min-height: 200px;
}

.fav-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
}
.fav-card:hover {
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transform: translateY(-2px);
}

.card-link {
  display: block;
  text-decoration: none;
  cursor: pointer;
}

.card-image {
  width: 100%;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f5f0eb;
}
.card-image img { width: 100%; height: 100%; object-fit: cover; }
.no-img {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  font-size: 48px; color: #ccc;
}

.card-body { padding: 12px 14px; }

.card-title {
  font-size: 14px; font-weight: 500; color: #333;
  line-height: 1.4;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden; min-height: 39px;
}

.card-row-placeholder { height: 4px; }

.card-price { margin-bottom: 6px; display: flex; align-items: baseline; gap: 1px; }
.price-sign { font-size: 12px; color: #f56c6c; font-weight: 700; }
.price-number { font-size: 20px; color: #f56c6c; font-weight: 700; }
:deep(.price-decimal) { font-size: 17px; }

.card-stats { display: flex; justify-content: center; align-items: center; font-size: 12px; color: #999; }
.card-status { padding: 2px 10px; border-radius: 20px; background: #f5f5f5; }

.card-actions { padding: 0 14px 14px; }

.action-btn {
  width: 100%;
  padding: 6px 0;
  font-size: 12px;
  border: 1px solid #f5c6cb;
  background: #fff;
  border-radius: 20px;
  cursor: pointer;
  color: #e74c3c;
  transition: all 0.2s;
  text-align: center;
}
.action-btn:hover { background: #fff5f5; }

/* 空状态 */
.empty-state { grid-column: 1 / -1; padding: 60px 0; }

@media (max-width: 768px) {
  .favorites-layout { flex-direction: column; padding: 12px; }
  .fav-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
}
</style>
