<template>
  <div class="user-info-container">
    <el-card class="info-card">
      <template #header>
        <div class="card-header">
          <span>个人信息</span>
          <el-button type="primary" size="small" @click="editMode = !editMode">
            {{ editMode ? '取消' : '编辑' }}
          </el-button>
        </div>
      </template>

      <el-form :model="userInfo" label-width="100px" class="info-form">
        <el-form-item label="头像">
          <div class="avatar-section">
            <el-avatar :size="80" :src="avatarUrl">
              <span style="font-size: 28px;">{{ userInfo.nickname?.charAt(0) || '用' }}</span>
            </el-avatar>
            <el-upload
              v-if="editMode"
              :http-request="uploadAvatar"
              :show-file-list="false"
              accept="image/*"
            >
              <el-button size="small" style="margin-left: 16px;">更换头像</el-button>
            </el-upload>
          </div>
        </el-form-item>

        <el-form-item label="用户名">
          <span>{{ userInfo.username }}</span>
        </el-form-item>

        <el-form-item label="昵称">
          <el-input v-if="editMode" v-model="userInfo.nickname" placeholder="请输入昵称" />
          <span v-else>{{ userInfo.nickname || '未设置' }}</span>
        </el-form-item>

        <el-form-item label="手机号">
          <el-input v-if="editMode" v-model="userInfo.phone" placeholder="请输入手机号" />
          <span v-else>{{ userInfo.phone || '未设置' }}</span>
        </el-form-item>

        <el-form-item label="邮箱">
          <el-input v-if="editMode" v-model="userInfo.email" placeholder="请输入邮箱" />
          <span v-else>{{ userInfo.email || '未设置' }}</span>
        </el-form-item>

        <el-form-item label="个性签名">
          <el-input v-if="editMode" v-model="userInfo.bio" type="textarea" :rows="3" placeholder="介绍一下自己吧" />
          <span v-else>{{ userInfo.bio || '这个人很懒，什么都没写~' }}</span>
        </el-form-item>

        <el-form-item v-if="editMode">
          <el-button type="primary" @click="saveInfo" :loading="saving">保存修改</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <div class="action-cards">
      <el-card class="action-card" @click="$router.push('/change-password')" shadow="hover">
        <el-icon><Lock /></el-icon>
        <span>修改密码</span>
      </el-card>
      <el-card class="action-card" @click="$router.push('/favorites')" shadow="hover">
        <el-icon><Star /></el-icon>
        <span>我的收藏</span>
      </el-card>
      <el-card class="action-card" @click="$router.push('/notifications')" shadow="hover">
        <el-icon><Bell /></el-icon>
        <span>消息通知</span>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Lock, Star, Bell } from '@element-plus/icons-vue'
import request, { imageBaseUrl } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const editMode = ref(false)
const saving = ref(false)
const userInfo = reactive({
  username: '',
  nickname: '',
  phone: '',
  email: '',
  bio: '',
  avatar: ''
})

const avatarUrl = computed(() => {
  if (!userInfo.avatar) return ''
  if (userInfo.avatar.startsWith('http')) return userInfo.avatar
  return imageBaseUrl + userInfo.avatar
})

const loadUserInfo = async () => {
  try {
    const res = await request.get('/api/user/info')
    if (res.code === 200) {
      Object.assign(userInfo, res.data)
    } else {
      // 从 localStorage 读取基础信息
      const cached = localStorage.getItem('userInfo')
      if (cached) {
        Object.assign(userInfo, JSON.parse(cached))
      }
    }
  } catch (error) {
    const cached = localStorage.getItem('userInfo')
    if (cached) {
      Object.assign(userInfo, JSON.parse(cached))
    }
  }
}

const uploadAvatar = async (options) => {
  const file = options.file
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('头像不能超过2MB')
    return
  }

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await request.post('/api/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.code === 200) {
      userInfo.avatar = res.data
      ElMessage.success('头像上传成功')
    }
  } catch (error) {
    ElMessage.error('上传失败')
  }
}

const saveInfo = async () => {
  saving.value = true
  try {
    const res = await request.put('/api/user/info', {
      nickname: userInfo.nickname,
      phone: userInfo.phone,
      email: userInfo.email,
      bio: userInfo.bio,
      avatar: userInfo.avatar
    })
    if (res.code === 200) {
      ElMessage.success('保存成功')
      userStore.updateInfo({ ...userInfo })
      editMode.value = false
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadUserInfo()
})
</script>

<style scoped>
.user-info-container {
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
.info-form {
  padding: 10px 0;
}
.avatar-section {
  display: flex;
  align-items: center;
}
.action-cards {
  display: flex;
  gap: 16px;
  margin-top: 20px;
}
.action-card {
  flex: 1;
  cursor: pointer;
  text-align: center;
  transition: transform 0.2s;
}
.action-card:hover {
  transform: translateY(-3px);
}
.action-card .el-icon {
  font-size: 28px;
  margin-bottom: 8px;
  display: block;
}

@media (max-width: 768px) {
  .user-info-container { padding: 12px; }
  .avatar-section { flex-direction: column; text-align: center; }
}

</style>
