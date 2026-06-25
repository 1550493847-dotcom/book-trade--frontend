// src/api/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建 axios 实例
const request = axios.create({
    baseURL: '',  // 通过 Vite proxy 转发到后端，避免 CORS
    timeout: 10000
})

// 请求拦截器（自动带上 token）
request.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
})

// 响应拦截器（统一处理错误）
request.interceptors.response.use(response => {
    return response.data
}, error => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
})
// 图片基础路径（用于直接显示图片，不走 proxy）
export const imageBaseUrl = 'http://localhost:8080'
export default request