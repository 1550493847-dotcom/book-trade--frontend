import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '@/views/HomePage.vue'
import Login from '@/views/Login.vue'
import PublishBook from '@/views/PublishBook.vue'
import BookDetail from '@/views/BookDetail.vue'
import MyOrders from '@/views/MyOrders.vue'
import MyBooks from '@/views/MyBooks.vue'
import UserInfo from '@/views/UserInfo.vue'
import ChangePassword from '@/views/ChangePassword.vue'
import MyFavorites from '@/views/MyFavorites.vue'
import ChatList from '@/views/ChatList.vue'
import ChatRoom from '@/views/ChatRoom.vue'
import OrderDetail from '@/views/OrderDetail.vue'
import Notifications from '@/views/Notifications.vue'
import ReviewPage from '@/views/ReviewPage.vue'
import CartPage from '@/views/CartPage.vue'
import SellerPage from '@/views/SellerPage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
  { path: '/login', name: 'login', component: Login },
  { path: '/publish', name: 'publish', component: PublishBook, meta: { requiresAuth: true } },
  { path: '/book/:id', name: 'bookDetail', component: BookDetail },
  { path: '/my-books', name: 'myBooks', component: MyBooks, meta: { requiresAuth: true } },
  { path: '/orders', name: 'orders', component: MyOrders, meta: { requiresAuth: true } },
  { path: '/order/:id', name: 'orderDetail', component: OrderDetail, meta: { requiresAuth: true } },
  { path: '/order/:id/review', name: 'review', component: ReviewPage, meta: { requiresAuth: true } },
  { path: '/user-info', name: 'userInfo', component: UserInfo, meta: { requiresAuth: true } },
  { path: '/change-password', name: 'changePassword', component: ChangePassword, meta: { requiresAuth: true } },
  { path: '/favorites', name: 'favorites', component: MyFavorites, meta: { requiresAuth: true } },
  { path: '/chat', name: 'chatList', component: ChatList, meta: { requiresAuth: true } },
  { path: '/chat/:id', name: 'chatRoom', component: ChatRoom, meta: { requiresAuth: true } },
  { path: '/cart', name: 'cart', component: CartPage, meta: { requiresAuth: true } },
  { path: '/notifications', name: 'notifications', component: Notifications, meta: { requiresAuth: true } },
  { path: '/user/:id', name: 'sellerPage', component: SellerPage }
]

const router = createRouter({
  history: createWebHistory('/book-trade--frontend/'), // 添加了基础路径
  routes
})

// 路由守卫：需要登录的页面自动跳转登录
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router
