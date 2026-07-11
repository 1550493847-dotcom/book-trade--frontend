// src/api/request.js
import axios from 'axios'
import { ElMessage } from 'element-plus'

// 生产环境使用 VITE_API_BASE_URL，开发环境用 Vite proxy（空字符串）
const baseURL = import.meta.env.VITE_API_BASE_URL || ''

const request = axios.create({
    baseURL,
    timeout: 10000
})

request.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) {
        config.headers['Authorization'] = 'Bearer ' + token
    }
    return config
})

request.interceptors.response.use(response => {
    return response.data
}, error => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
})

export const imageBaseUrl = baseURL
export default request
