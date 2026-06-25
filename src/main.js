import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())  // 引入 Pinia 状态管理
app.use(ElementPlus)  // 引入 Element Plus 组件库
app.use(router)       // 引入路由

app.mount('#app')
