<template>
  <div class="mybooks-page">
    <div class="mybooks-layout">
      <!-- 左侧导航 -->
      <ProfileSidebar activeMenu="center" />

      <!-- 右侧内容 -->
      <main class="mybooks-content">
        <!-- ===== 用户信息头部 ===== -->
        <div class="profile-header">
          <div class="profile-card">
            <div class="profile-avatar">
              <el-avatar :size="80" :src="userStore.avatarUrl">{{ userStore.displayName?.charAt(0) || '用' }}</el-avatar>
            </div>
            <div class="profile-info">
              <div class="profile-nickname">
                <span class="nick-text">{{ userStore.displayName || '用户' }}</span>
              </div>
              <div class="profile-meta">
                <span class="meta-item">{{ userLocation }}</span>
                <span class="meta-divider">|</span>
                <span class="meta-item">粉丝 {{ followerCount }}</span>
                <span class="meta-divider">|</span>
                <span class="meta-item">关注 {{ followingCount }}</span>
              </div>
            </div>
            <div class="profile-actions">
              <router-link to="/user-info" class="edit-btn">编辑资料</router-link>
            </div>
          </div>

          <!-- 统计选项卡 -->
          <div class="profile-tabs">
            <div class="tab-item active">
              <span class="tab-label">宝贝</span>
              <span class="tab-count">{{ bookList.length }}</span>
            </div>
          </div>
        </div>

        <!-- ===== 商品网格 ===== -->
        <div class="books-grid" v-loading="loading">
          <template v-if="bookList.length > 0">
            <div v-for="book in bookList" :key="book.id" class="book-card">
              <!-- 已售出遮罩 -->
              <div v-if="book.status === 1" class="sold-mask">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='80'%3E💔%3C/text%3E%3C/svg%3E" class="sold-img" />
              </div>
              <a class="card-link" @click="goToDetail(book.id)">
                <div class="card-image">
                  <img v-if="book.images && book.images !== '/img/null'" :src="getImageUrl(book.images.split(',')[0])" />
                  <div v-else class="no-img">📖</div>
                </div>
                <div class="card-body">
                  <div class="card-title" :title="book.title">{{ book.title }}</div>
                  <div class="card-row-placeholder"></div>
                  <div class="card-price">
                    <span class="price-sign">¥</span>
                    <span class="price-number">{{ formatPrice(book.sellPrice) }}</span>
                  </div>
                  <div class="card-stats">
                    <span>{{ book.viewCount || 0 }}次浏览</span>
                    <span v-if="book.status === 0" class="status-tag status-on">在售</span>
                    <span v-else-if="book.status === 1" class="status-tag status-sold">已售</span>
                    <span v-else class="status-tag status-off">下架</span>
                  </div>
                </div>
              </a>
              <div class="card-actions">
                <button v-if="book.status === 0" class="action-btn" @click="offShelf(book.id)">下架</button>
                <button v-if="book.status === 2" class="action-btn action-primary" @click="onShelf(book.id)">上架</button>
                <button class="action-btn" @click="openEdit(book)">编辑</button>
                <button class="action-btn action-danger" @click="deleteBook(book.id)">删除</button>
              </div>
            </div>
          </template>

          <div v-else-if="!loading" class="empty-state">
            <el-empty description="还没有发布商品，去发布一本吧~">
              <router-link to="/publish" class="publish-link">去发布</router-link>
            </el-empty>
          </div>
        </div>
      </main>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑图书" width="550px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="书名">
          <el-input v-model="editForm.title" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="editForm.author" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="editForm.category" placeholder="选择分类">
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
        </el-form-item>
        <el-form-item label="原价">
          <el-input-number v-model="editForm.originalPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="售价">
          <el-input-number v-model="editForm.sellPrice" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'
import ProfileSidebar from '@/components/ProfileSidebar.vue'

const router = useRouter()
const userStore = useUserStore()
const bookList = ref([])
const loading = ref(false)
const editDialogVisible = ref(false)
const saving = ref(false)

// 用户信息（示例数据，可从后端获取）
const userLocation = ref('')
const followerCount = ref(0)
const followingCount = ref(0)

const editForm = reactive({
  id: null, title: '', author: '', category: '',
  originalPrice: null, sellPrice: null, description: ''
})

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

const loadMyBooks = async () => {
  loading.value = true
  try {
    const res = await request.get('/api/book/my')
    if (res.code === 200) {
      bookList.value = res.data || []
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

const offShelf = (id) => {
  ElMessageBox.confirm('确定要下架该商品吗？', '提示', {
    confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning'
  }).then(async () => {
    try {
      const res = await request.put(`/api/book/${id}/offshelf`)
      if (res.code === 200) { ElMessage.success('下架成功'); loadMyBooks() }
      else { ElMessage.error(res.message || '下架失败') }
    } catch (error) { ElMessage.error('请求失败') }
  }).catch(() => {})
}

const onShelf = async (id) => {
  try {
    const res = await request.put(`/api/book/${id}/onshelf`)
    if (res.code === 200) { ElMessage.success('上架成功'); loadMyBooks() }
    else { ElMessage.error(res.message || '上架失败') }
  } catch (error) { ElMessage.error('请求失败') }
}

const openEdit = (book) => {
  editForm.id = book.id; editForm.title = book.title; editForm.author = book.author || ''
  editForm.category = book.category || ''; editForm.originalPrice = book.originalPrice
  editForm.sellPrice = book.sellPrice; editForm.description = book.description || ''
  editDialogVisible.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const res = await request.put(`/api/book/${editForm.id}`, {
      title: editForm.title, author: editForm.author, category: editForm.category,
      originalPrice: editForm.originalPrice, sellPrice: editForm.sellPrice,
      description: editForm.description
    })
    if (res.code === 200) { ElMessage.success('修改成功'); editDialogVisible.value = false; loadMyBooks() }
    else { ElMessage.error(res.message || '修改失败') }
  } catch (error) { ElMessage.error('请求失败') }
  finally { saving.value = false }
}

const deleteBook = (id) => {
  ElMessageBox.confirm('确定要永久删除该商品吗？此操作不可恢复！', '警告', {
    confirmButtonText: '删除', cancelButtonText: '取消', type: 'error'
  }).then(async () => {
    try {
      const res = await request.delete(`/api/book/${id}`)
      if (res.code === 200) { ElMessage.success('已删除'); loadMyBooks() }
      else { ElMessage.error(res.message || '删除失败') }
    } catch (error) { ElMessage.error('请求失败') }
  }).catch(() => {})
}

const goToDetail = (id) => {
  router.push(`/book/${id}`)
}

onMounted(() => { loadMyBooks() })
</script>

<style scoped>
.mybooks-page {
  min-height: calc(100vh - 60px);
  background: #f5f0eb;
}

.mybooks-layout {
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  gap: 20px;
}

/* ===== 右侧内容 ===== */
.mybooks-content {
  flex: 1;
  min-width: 0;
}

/* 用户信息头部 */
.profile-header {
  background: #fff;
  border-radius: 20px;
  margin-bottom: 20px;
  overflow: hidden;
}

.profile-card {
  display: flex;
  align-items: center;
  padding: 24px;
  gap: 20px;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-nickname {
  margin-bottom: 8px;
}

.nick-text {
  font-size: 20px;
  font-weight: 600;
  color: #3d2413;
}

.profile-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #8b5e3c;
}

.meta-divider {
  color: #d4c5b5;
}

.profile-actions {
  flex-shrink: 0;
}

.edit-btn {
  display: inline-block;
  padding: 8px 24px;
  background: #f5f0eb;
  border-radius: 20px;
  color: #3d2413;
  font-size: 13px;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}
.edit-btn:hover {
  background: #ebe2d8;
}

/* 选项卡 */
.profile-tabs {
  border-top: 1px solid #f0f0f0;
  padding: 0 24px;
}

.tab-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 0;
  border-bottom: 3px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}
.tab-item.active {
  border-bottom-color: #8b5e3c;
}

.tab-label {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}
.tab-item.active .tab-label {
  color: #3d2413;
  font-weight: 600;
}

.tab-count {
  font-size: 13px;
  color: #999;
}

/* ===== 商品网格 ===== */
.books-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  background: #fff;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  min-height: 200px;
  align-content: start;
  padding: 20px;
}

.book-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  transition: all 0.3s;
  position: relative;
}
.book-card:hover {
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  transform: translateY(-3px);
}

/* 已售出遮罩 */
.sold-mask {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.4);
}
.sold-img {
  width: 120px;
  height: 120px;
  opacity: 0.6;
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
.card-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.no-img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #ccc;
}

.card-body {
  padding: 12px 14px;
}

.card-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 39px;
}

.card-row-placeholder {
  height: 4px;
}

.card-price {
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 1px;
}
.price-sign {
  font-size: 12px;
  color: #f56c6c;
  font-weight: 700;
}
.price-number {
  font-size: 20px;
  color: #f56c6c;
  font-weight: 700;
}
:deep(.price-decimal) {
  font-size: 17px;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #999;
}

.status-tag {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}
.status-on {
  background: #e8f8e0;
  color: #67c23a;
}
.status-sold {
  background: #f5f5f5;
  color: #999;
}
.status-off {
  background: #fdf6ec;
  color: #e6a23c;
}

/* 操作按钮 */
.card-actions {
  display: flex;
  gap: 6px;
  padding: 8px 14px 14px;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  padding: 5px 0;
  font-size: 12px;
  border: 1px solid #e0e0e0;
  background: #fff;
  border-radius: 20px;
  cursor: pointer;
  color: #333;
  transition: all 0.2s;
  text-align: center;
}
.action-btn:hover {
  border-color: #ccc;
  background: #fafafa;
}
.action-primary {
  background: #ffe60f;
  border-color: #ffe60f;
  font-weight: 500;
}
.action-primary:hover {
  background: #f5d900;
}
.action-danger {
  color: #e74c3c;
  border-color: #f5c6cb;
}
.action-danger:hover {
  background: #fff5f5;
}

/* 空状态 */
.empty-state {
  grid-column: 1 / -1;
  padding: 40px 0;
  width: 100%;
}

.publish-link {
  display: inline-block;
  margin-top: 12px;
  padding: 8px 32px;
  background: linear-gradient(135deg, #d4943e, #f0b45e);
  color: #fff;
  border-radius: 20px;
  text-decoration: none;
  font-weight: 500;
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
  .mybooks-layout {
    flex-direction: column;
    padding: 12px;
  }
  .mybooks-content {
    width: 100%;
  }
  .profile-card {
    flex-direction: column;
    text-align: center;
    padding: 20px;
  }
  .profile-meta {
    justify-content: center;
    flex-wrap: wrap;
  }
  .books-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
}
</style>