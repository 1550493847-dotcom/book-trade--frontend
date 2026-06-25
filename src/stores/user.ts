import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useUserStore = defineStore('user', () => {
  // ===== 状态 =====
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(loadUserInfo())

  // ===== 计算属性 =====
  const isLogin = computed(() => !!token.value)

  const avatarUrl = computed(() => {
    const avatar = userInfo.value?.avatar
    if (!avatar) return ''
    if (avatar.startsWith('http')) return avatar
    return 'http://localhost:8080' + avatar
  })

  const displayName = computed(() => {
    return userInfo.value?.nickname || userInfo.value?.username || '用户'
  })

  // ===== 辅助 =====
  function loadUserInfo() {
    try {
      const raw = localStorage.getItem('userInfo')
      return raw ? JSON.parse(raw) : {}
    } catch {
      return {}
    }
  }

  // ===== 操作 =====
  function setLogin(tk, info) {
    token.value = tk
    userInfo.value = info || {}
    localStorage.setItem('token', tk)
    localStorage.setItem('userInfo', JSON.stringify(info || {}))
  }

  function logout() {
    token.value = ''
    userInfo.value = {}
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  function updateInfo(info) {
    userInfo.value = { ...userInfo.value, ...info }
    localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
  }

  function refreshFromStorage() {
    token.value = localStorage.getItem('token') || ''
    userInfo.value = loadUserInfo()
  }

  return {
    token,
    userInfo,
    isLogin,
    avatarUrl,
    displayName,
    setLogin,
    logout,
    updateInfo,
    refreshFromStorage
  }
})
