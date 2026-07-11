<template>
  <div class="my-books-container">
    <h2>我发布的商品</h2>
    
    <div class="book-list" v-loading="loading">
      <el-card v-for="book in bookList" :key="book.id" class="book-card">
        <div class="book-content">
          <div class="book-image">
            <img v-if="book.images && book.images !== '/img/null'" v-lazy="getImageUrl(book.images.split(',')[0])" class="book-img" />
            <div v-else class="no-img">暂无图片</div>
          </div>
          <div class="book-info">
            <div class="book-title">{{ book.title }}</div>
            <div>作者：{{ book.author || '未知' }}</div>
            <div class="price">¥{{ book.sellPrice }}</div>
            <div class="status">
              状态：
              <el-tag :type="book.status === 0 ? 'success' : book.status === 1 ? 'danger' : 'info'">
                {{ book.status === 0 ? '在售' : book.status === 1 ? '已售出' : '已下架' }}
              </el-tag>
            </div>
            <div>浏览量：{{ book.viewCount }}</div>
            <div class="actions">
              <!-- 上架/下架 -->
              <el-button
                v-if="book.status === 0"
                type="danger"
                size="small"
                @click="offShelf(book.id)"
              >
                下架
              </el-button>
              <el-button
                v-if="book.status === 2"
                type="success"
                size="small"
                @click="onShelf(book.id)"
              >
                上架
              </el-button>
              <!-- 编辑 -->
              <el-button type="primary" size="small" @click="openEdit(book)">编辑</el-button>
              <!-- 删除 -->
              <el-button type="danger" size="small" plain @click="deleteBook(book.id)">删除</el-button>
              <!-- 查看详情 -->
              <el-button size="small" @click="goToDetail(book.id)">查看详情</el-button>
            </div>
          </div>
        </div>
      </el-card>
    </div>

    <div v-if="!loading && bookList.length === 0" class="empty">
      <el-empty description="暂无发布商品，去发布一本吧~" />
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
        <el-form-item label="商品图片">
          <div class="edit-images">
            <div v-for="(img, idx) in editImageList" :key="idx" class="edit-image-item">
              <img :src="getImageUrl(img)" />
              <el-button class="img-del-btn" size="small" circle type="danger" @click="removeEditImage(idx)">×</el-button>
            </div>
            <el-upload
              v-if="editImageList.length < 3"
              :http-request="editUploadImage"
              :show-file-list="false"
            >
              <el-button class="add-img-btn" size="small">
                <el-icon><Plus /></el-icon>
              </el-button>
            </el-upload>
          </div>
          <div class="upload-tip">最多3张图片，悬停图片可删除，点击新增</div>
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
import request, { imageBaseUrl } from '@/api/request'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox } from 'element-plus'

const router = useRouter()
const bookList = ref([])
const loading = ref(false)
const editDialogVisible = ref(false)
const saving = ref(false)
const editForm = reactive({
const editImageList = ref([])  // 编辑中的图片列表
const editUploadFiles = ref([]) // 已上传的文件路径
  id: null,
  title: '',
  author: '',
  category: '',
  originalPrice: null,
  sellPrice: null,
  description: ''
})

const getImageUrl = (path) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  return imageBaseUrl + path
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
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.put(`/api/book/${id}/offshelf`)
      if (res.code === 200) {
        ElMessage.success('下架成功')
        loadMyBooks()
      } else {
        ElMessage.error(res.message || '下架失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const onShelf = async (id) => {
  try {
    const res = await request.put(`/api/book/${id}/onshelf`)
    if (res.code === 200) {
      ElMessage.success('上架成功')
      loadMyBooks()
    } else {
      ElMessage.error(res.message || '上架失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  }
}

const openEdit = (book) => {
  // 加载已有图片
  if (book.images) {
    editImageList.value = book.images.split(",").filter(Boolean)
  } else {
    editImageList.value = []
  }
  editUploadFiles.value = []
  editForm.id = book.id
  editForm.title = book.title
  editForm.author = book.author || ''
  editForm.category = book.category || ''
  editForm.originalPrice = book.originalPrice
  editForm.sellPrice = book.sellPrice
  editForm.description = book.description || ''
  editDialogVisible.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    const res = await request.put(`/api/book/${editForm.id}`, {
      title: editForm.title,
      author: editForm.author,
      category: editForm.category,
      originalPrice: editForm.originalPrice,
      sellPrice: editForm.sellPrice,
      description: editForm.description,
      images: editImageList.value.join(",")
    })
    if (res.code === 200) {
      ElMessage.success('修改成功')
      editDialogVisible.value = false
      loadMyBooks()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    saving.value = false
  }
}

const deleteBook = (id) => {
  ElMessageBox.confirm('确定要永久删除该商品吗？此操作不可恢复！', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'error'
  }).then(async () => {
    try {
      const res = await request.delete(`/api/book/${id}`)
      if (res.code === 200) {
        ElMessage.success('已删除')
        loadMyBooks()
      } else {
        ElMessage.error(res.message || '删除失败')
      }
    } catch (error) {
      ElMessage.error('请求失败')
    }
  }).catch(() => {})
}

const goToDetail = (id) => {
  router.push(`/book/${id}`)
}

onMounted(() => {
  loadMyBooks()
})
// ===== 编辑图片管理 =====
const editUploadImage = async (options) => {
  const file = options.file
  const isImage = file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/jpg"
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) { ElMessage.error("只能上传 JPG/PNG 格式的图片!"); return }
  if (!isLt2M) { ElMessage.error("图片大小不能超过 2MB!"); return }
  const formData = new FormData()
  formData.append("file", file)
  try {
    const res = await request.post("/api/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    })
    if (res.code === 200) {
      editImageList.value.push(res.data)
      ElMessage.success("图片上传成功")
      options.onSuccess()
    } else {
      ElMessage.error("上传失败"); options.onError()
    }
  } catch (error) {
    ElMessage.error("上传失败，请重试"); options.onError()
  }
}

const removeEditImage = async (idx) => {
  const imgPath = editImageList.value[idx]
  try {
    // 尝试从服务器删除文件
    await request.delete("/api/upload", { params: { path: imgPath } })
  } catch (e) { /* 文件删除失败不影响图片列表移除 */ }
  editImageList.value.splice(idx, 1)
}

      ElMessage.success('修改成功')
      editDialogVisible.value = false
      loadMyBooks()
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error) {
    ElMessage.error('请求失败')
  } finally {
    saving.value = false
  }
}


<style scoped>
.my-books-container {
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.book-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.book-card {
  width: 100%;
  margin-bottom: 10px;
}
.book-content {
  display: flex;
  gap: 20px;
}
.book-image {
  width: 120px;
}
.book-img {
  width: 120px;
  height: 120px;
  object-fit: cover;
}
.no-img {
  width: 120px;
  height: 120px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}
.book-info {
  flex: 1;
}
.book-title {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
}
.price {
  color: #f56c6c;
  font-size: 20px;
  font-weight: bold;
  margin: 10px 0;
}
.status {
  margin: 10px 0;
}
.actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.empty {
  margin-top: 50px;
}

@media (max-width: 768px) {
.edit-images {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: flex-start;
}
.edit-image-item {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
}
.edit-image-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.edit-image-item:hover .img-del-btn {
  opacity: 1;
}
.img-del-btn {
  position: absolute !important;
  top: -6px;
  right: -6px;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  padding: 0 !important;
  font-size: 14px !important;
  line-height: 1 !important;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 1;
}
.add-img-btn {
  width: 80px;
  height: 80px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  background: #fafafa;
}
.add-img-btn:hover {
  border-color: #a0712a;
  color: #a0712a;
}
.upload-tip {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
  .mybooks-container { padding: 12px; }
  .book-list { gap: 10px; }
  .book-card { width: calc(50% - 5px); }
  .book-card:hover { transform: none; }
  .empty { margin-top: 30px; }
}

</style>




