<template>
  <div class="login-page">
    <!-- 浮动书籍装饰（全屏） -->
    <div class="floating-books">
      <span class="book-icon" style="top:10%;left:10%;animation-delay:0s;">📚</span>
      <span class="book-icon" style="top:18%;right:15%;animation-delay:0.7s;">📖</span>
      <span class="book-icon" style="bottom:22%;left:8%;animation-delay:1.4s;">📕</span>
      <span class="book-icon" style="bottom:10%;right:10%;animation-delay:2.1s;">📗</span>
      <span class="book-icon" style="top:42%;right:22%;animation-delay:2.8s;">📘</span>
      <span class="book-icon" style="bottom:42%;left:20%;animation-delay:3.5s;">📙</span>
      <span class="book-icon" style="top:30%;left:38%;animation-delay:0.4s;">📓</span>
      <span class="book-icon" style="bottom:35%;right:38%;animation-delay:1.1s;">📔</span>
    </div>

    <!-- 左侧品牌区 -->
    <div class="brand-section">
      <div class="brand-content">
        <div class="brand-logo">
          <div class="logo-ring">
            <span class="logo-book">📖</span>
          </div>
          <h1 class="brand-name">淘籍籍</h1>
        </div>
        <p class="brand-tagline">让每一本旧书，都找到新的主人</p>

        <el-button class="home-btn" @click="$router.push('/')">
          <span class="btn-text">逛逛首页</span>
          <span class="btn-arrow">→</span>
        </el-button>

        <div class="features">
          <div class="feature-item">
            <span>🔄</span>
            <span>以淘会友 · 发现每本书的新旅程</span>
          </div>
          <div class="feature-item">
            <span>💰</span>
            <span>好价淘好 · 让阅读不再昂贵</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 右侧液态玻璃卡片 -->
    <div class="form-section">
      <div class="liquid-glass">
        <!-- 玻璃反光 -->
        <div class="glass-shine"></div>

        <div class="form-header">
          <h2 class="form-title">{{ isLogin ? '欢迎回来' : '加入我们' }}</h2>
          <p class="form-subtitle">
            {{ isLogin ? '登录你的账号继续淘书之旅' : '注册账号开始你的二手书交易' }}
          </p>
        </div>

        <el-form :model="form" :rules="rules" ref="formRef" class="login-form">
          <el-form-item prop="username">
            <el-input
              v-model="form.username"
              :placeholder="isLogin ? '请输入用户名' : '设置用户名（3-20位）'"
              :maxlength="20" size="large"
            >
              <template #prefix><el-icon><User /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="form.password" type="password"
              :placeholder="isLogin ? '请输入密码' : '设置密码（6-20位）'"
              show-password :maxlength="20" size="large"
            >
              <template #prefix><el-icon><Lock /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item v-if="!isLogin" prop="confirmPassword">
            <el-input
              v-model="form.confirmPassword" type="password"
              placeholder="再次输入密码确认" show-password
              :maxlength="20" size="large"
            >
              <template #prefix><el-icon><Key /></el-icon></template>
            </el-input>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" size="large" class="submit-btn" @click="submit" :loading="loading">
              {{ isLogin ? '登  录' : '注  册' }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <span>{{ isLogin ? '还没有账号？' : '已有账号？' }}</span>
          <el-link :underline="false" @click="toggleMode" class="toggle-link">
            {{ isLogin ? '立即注册' : '去登录' }}
          </el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock, Key } from '@element-plus/icons-vue'
import request from '@/api/request'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const isLogin = ref(true)
const loading = ref(false)
const formRef = ref()

const form = reactive({ username: '', password: '', confirmPassword: '' })

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度为3-20位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度为6-20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    { validator: (rule, value, cb) => value !== form.password ? cb(new Error('两次输入密码不一致')) : cb(), trigger: 'blur' }
  ]
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  form.username = ''; form.password = ''; form.confirmPassword = ''
  formRef.value?.clearValidate()
}

const submit = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    if (isLogin.value) {
      const res = await request.post('/api/user/login', { username: form.username, password: form.password })
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('userInfo', JSON.stringify(res.data.userInfo))
        ElMessage.success('登录成功')
        window.location.href = route.query.redirect || '/'
      } else { ElMessage.error(res.message || '登录失败') }
    } else {
      const res = await request.post('/api/user/register', { username: form.username, password: form.password })
      if (res.code === 200) {
        ElMessage.success('注册成功，请登录')
        isLogin.value = true; form.password = ''; form.confirmPassword = ''
        formRef.value?.clearValidate()
      } else { ElMessage.error(res.message || '注册失败') }
    }
  } catch { ElMessage.error('请求失败，请检查网络') }
  finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(135deg, #1f1107 0%, #3d2413 30%, #6d4526 55%, #8b5e3c 78%, #c4913e 100%);
  position: relative;
  overflow: hidden;
}

/* ===== 浮动书籍 ===== */
.floating-books {
  position: absolute; inset: 0; pointer-events: none;
}
.book-icon {
  position: absolute; font-size: 36px;
  opacity: 0.10;
  animation: floatBook 8s ease-in-out infinite;
  filter: drop-shadow(0 8px 24px rgba(0,0,0,0.5));
}
@keyframes floatBook {
  0%,100% { transform: translateY(0) rotate(0deg) scale(1); }
  25% { transform: translateY(-24px) rotate(5deg) scale(1.06); }
  50% { transform: translateY(-10px) rotate(-3deg) scale(0.93); }
  75% { transform: translateY(-30px) rotate(4deg) scale(1.04); }
}

/* ===== 左侧品牌（50%） ===== */
.brand-section {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  position: relative; z-index: 1;
}
.brand-content {
  text-align: center; padding: 40px;
  max-width: 420px;
}
.brand-logo { margin-bottom: 12px; }
.logo-ring {
  width: 110px; height: 110px;
  margin: 0 auto 22px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: radial-gradient(circle at 35% 30%, rgba(255,255,255,0.20), rgba(255,255,255,0.04));
  border: 2px solid rgba(255,255,255,0.15);
  box-shadow: 0 0 40px rgba(196, 145, 62, 0.15), inset 0 0 30px rgba(255,255,255,0.04);
}
.logo-book { font-size: 50px; animation: bounceBook 3s ease-in-out infinite; }
@keyframes bounceBook {
  0%,100% { transform: rotate(-10deg) scale(1); }
  50% { transform: rotate(10deg) scale(1.12); }
}
.brand-name {
  font-size: 44px; font-weight: 800; color: #fff;
  letter-spacing: 8px; text-shadow: 0 2px 30px rgba(0,0,0,0.4);
}
.brand-tagline {
  font-size: 16px; color: rgba(255,255,255,0.6);
  margin-bottom: 36px; letter-spacing: 3px;
}

/* 首页按钮 */
.home-btn {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 14px 36px; border-radius: 50px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.20);
  color: #fff; font-size: 15px; font-weight: 500;
  cursor: pointer; transition: all 0.35s;
  backdrop-filter: blur(6px);
  margin-bottom: 40px;
}
.home-btn:hover {
  background: rgba(255,255,255,0.16);
  border-color: rgba(255,255,255,0.35);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(0,0,0,0.25);
}
.btn-arrow { transition: transform 0.3s; }
.home-btn:hover .btn-arrow { transform: translateX(4px); }

/* 特性列表 */
.features { display: flex; flex-direction: column; gap: 12px; }
.feature-item {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: rgba(255,255,255,0.55);
  letter-spacing: 1px;
}

/* ===== 右侧液态玻璃卡片（50%） ===== */
.form-section {
  flex: 1;
  display: flex; align-items: center; justify-content: center;
  padding: 40px; position: relative; z-index: 1;
}

.liquid-glass {
  position: relative;
  width: 100%; max-width: 420px;
  padding: 46px 40px;
  border-radius: 24px;
  overflow: hidden;

  /* 液态玻璃核心样式 */
  background: linear-gradient(
    145deg,
    rgba(255,255,255,0.14) 0%,
    rgba(255,255,255,0.06) 40%,
    rgba(255,255,255,0.10) 60%,
    rgba(255,255,255,0.04) 100%
  );
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);

  /* 液态玻璃边缘光 */
  border: 1px solid rgba(255,255,255,0.20);
  border-top-color: rgba(255,255,255,0.35);
  border-left-color: rgba(255,255,255,0.25);

  /* 彩色投影 */
  box-shadow:
    0 20px 60px rgba(0,0,0,0.35),
    0 0 40px rgba(196, 145, 62, 0.08),
    inset 0 1px 0 rgba(255,255,255,0.20),
    inset 0 -1px 0 rgba(255,255,255,0.05);
}

/* 液态玻璃的斜向反光带 */
.glass-shine {
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(255,255,255,0.07) 35%,
    rgba(255,255,255,0.03) 40%,
    transparent 45%
  );
  pointer-events: none;
  animation: shineSweep 8s ease-in-out infinite;
}
@keyframes shineSweep {
  0%, 100% { transform: translateX(-20%) translateY(-10%); }
  50% { transform: translateX(10%) translateY(5%); }
}

.form-header { margin-bottom: 28px; }
.form-title {
  font-size: 26px; font-weight: 700; color: #fff;
  margin-bottom: 8px; text-shadow: 0 1px 10px rgba(0,0,0,0.15);
}
.form-subtitle { font-size: 14px; color: rgba(255,255,255,0.55); }

/* 输入框适配液态玻璃 */
.login-form { margin-bottom: 20px; }
.login-form :deep(.el-input__wrapper) {
  border-radius: 12px; padding: 4px 16px;
  background: rgba(255,255,255,0.08) !important;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.12) inset,
    0 2px 8px rgba(0,0,0,0.08) !important;
  transition: all 0.3s;
}
.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(255,255,255,0.28) inset !important;
}
.login-form :deep(.el-input__wrapper.is-focus) {
  background: rgba(255,255,255,0.14) !important;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.40) inset,
    0 0 20px rgba(196,145,62,0.08) !important;
}
.login-form :deep(.el-input__inner) {
  height: 46px; font-size: 14px; color: #fff;
}
.login-form :deep(.el-input__inner::placeholder) {
  color: rgba(255,255,255,0.35);
}
.login-form :deep(.el-input__prefix .el-icon) {
  font-size: 18px; color: rgba(255,255,255,0.35);
}

/* 按钮 - 金色渐变 + 光感 */
.submit-btn {
  width: 100%; height: 50px;
  font-size: 16px; font-weight: 600; letter-spacing: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, #d4943e, #f0b45e);
  border: none; color: #2d1b0e;
  transition: all 0.3s;
  box-shadow: 0 4px 16px rgba(212, 148, 62, 0.25);
}
.submit-btn:hover {
  background: linear-gradient(135deg, #e0a34a, #ffc876);
  transform: translateY(-2px);
  box-shadow: 0 8px 28px rgba(212, 148, 62, 0.4);
}

/* 底部切换 */
.form-footer {
  text-align: center; font-size: 14px;
  color: rgba(255,255,255,0.45);
}
.toggle-link {
  font-size: 14px; font-weight: 600;
  color: #f0b45e !important;
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .login-page { flex-direction: column; }
  .brand-section { padding: 50px 20px 20px; min-height: auto; }
  .brand-name { font-size: 34px; }
  .form-section { padding: 10px 20px 40px; }
  .liquid-glass { padding: 34px 24px; }
}
</style>
