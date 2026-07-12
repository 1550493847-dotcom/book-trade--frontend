<template>

  <div class="home-container">

    <!-- main 区域（左：秒杀 | 右：轮播）-->

    <div class="main">

      <div class="main-left">

        <div class="seckill-header">

          <span class="seckill-title">⏰ 限时秒杀</span>

          <div class="seckill-timer">

            <span class="timer-label">距离结束</span>

            <span class="timer-num">{{ timerH }}</span><span class="timer-colon">:</span>

            <span class="timer-num">{{ timerM }}</span><span class="timer-colon">:</span>

            <span class="timer-num">{{ timerS }}</span>

          </div>

        </div>

        <div class="seckill-body">

          <div class="seckill-card" v-for="(item, i) in seckillItems" :key="i" @click="goToDetail(item.id)">

            <div class="seckill-img">

              <img v-if="item.image" :src="getImageUrl(item.image)" />

              <span v-else class="seckill-no-img">📖</span>

            </div>

            <div class="seckill-info">

              <div class="seckill-price">

                <span class="seckill-sign">楼</span>

                <span class="seckill-num">{{ item.price }}</span>

              </div>

              <div class="seckill-original">楼{{ item.originalPrice }}</div>

            </div>

          </div>

        </div>

        <router-link to="/" class="seckill-more">查看更多 ›</router-link>

      </div>

      <div class="main-right">

        <el-carousel :interval="4000" height="368px" indicator-position="none" arrow="always">

          <el-carousel-item v-for="(slide, i) in carouselSlides" :key="i" @click="goToDetail(slide.id)">

            <div class="carousel-content" :style="{ background: slide.bg }">

              <div class="carousel-text">

                <h2>{{ slide.title }}</h2>

                <p>{{ slide.desc }}</p>

                <span class="carousel-btn">立即查看</span>

              </div>

              <div class="carousel-img">

                <span class="carousel-emoji">{{ slide.emoji }}</span>

              </div>

            </div>

          </el-carousel-item>

        </el-carousel>

      </div>

    </div>



    <!-- feeds-main--qb 区域（商品列表 + 筛选）-->

    <div class="feeds-main--qb">

      <!-- 筛选区域（分类按钮 + 排序） -->

      <div class="filter-bar">

        <div class="filter-left">

          <span class="result-hint" v-if="route.query.keyword">

            搜索 "{{ route.query.keyword }}" 的结果

          </span>

          <div class="category-buttons" v-else>

            <button

              v-for="cat in categories"

              :key="cat.value"

              class="cat-btn"

              :class="{ active: category === cat.value }"

              @click="selectCategory(cat.value)"

            >{{ cat.label }}</button>

          </div>

        </div>

        <div class="filter-right">

          <el-select v-model="category" placeholder="全部分类" clearable @change="loadBooks" class="filter-select">
            <el-option label="精选推荐" value="" />
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


          <el-select v-model="sortBy" placeholder="排序" @change="loadBooks" class="filter-select">

            <el-option label="默认排序" value="" />

            <el-option label="价格从低到高" value="price_asc" />

            <el-option label="价格从高到低" value="price_desc" />

            <el-option label="最新发布" value="newest" />

          </el-select>

        </div>

      </div>



      <!-- 图书列表 -->

      <div class="book-list" v-loading="loading">

        <div

          v-for="book in bookList"

          :key="book.id"

          class="book-card"

          @click="goToDetail(book.id)"

        >

          <div class="card-image">

            <img v-if="book.images && book.images !== '/img/null'" v-lazy="getImageUrl(book.images.split(',')[0])" />

            <div v-else class="no-img">📖</div>

          </div>

          <div class="card-body">

            <div class="card-title" :title="book.title">{{ book.title }}</div>

            <div class="card-row-placeholder"></div>

            <div class="card-price">

              <span class="price-sign">¥</span>

              <span class="price-number" v-html="formatPrice(book.sellPrice)"></span>

            </div>

            <div class="card-stats">

              <span>{{ book.viewCount || 0 }}次浏览</span>

              <span class="card-seller">{{ book.author || '未知' }}</span>

            </div>

          </div>

        </div>

      </div>



      <!-- 空状态 -->

      <div v-if="!loading && bookList.length === 0" class="empty">

        <el-empty :description="route.query.keyword ? '没有找到相关图书，换个关键词试试' : '暂无图书上架~'" />

      </div>



      <!-- 分页 -->

      <div class="pagination" v-if="total > pageSize">

        <el-pagination

          v-model:current-page="currentPage"

          :page-size="pageSize"

          :total="total"

          layout="prev, pager, next"

          @current-change="handlePageChange"

        />

      </div>

    </div>

  </div>

</template>



<script setup>

import { ref, watch, onMounted, onUnmounted } from 'vue'

import { useRouter, useRoute } from 'vue-router'

import { ElMessage } from 'element-plus'

import request, { imageBaseUrl } from '@/api/request'



const router = useRouter()

const route = useRoute()

const bookList = ref([])

const loading = ref(false)

const category = ref('')

const categories = [

  { label: '精选推荐', value: '' },

  { label: '文学', value: '文学' },

  { label: '科技', value: '科技' },

  { label: '历史', value: '历史' },

  { label: '艺术', value: '艺术' },

  { label: '考试', value: '考试' }

]



const selectCategory = (val) => {

  category.value = val

  loadBooks()

}

const sortBy = ref('')

const currentPage = ref(1)

const pageSize = ref(12)

const total = ref(0)



const getImageUrl = (path) => {

  if (!path) return ''

  if (path.startsWith('http')) return path

  return imageBaseUrl + path

}



const formatPrice = (price) => {

  if (price == null) return '0'

  const parts = price.toFixed(2).split('.')

  return parts[0] + '<span class="price-decimal">.' + parts[1] + '</span>'

}



const loadBooks = async () => {

  loading.value = true

  if (!route.query.keyword) currentPage.value = 1

  try {

    const params = { page: currentPage.value, size: pageSize.value }

    if (route.query.keyword) params.keyword = route.query.keyword

    if (category.value) params.category = category.value

    if (sortBy.value) params.sortBy = sortBy.value



    const res = await request.get('/api/book/list', { params })

    if (res.code === 200) {

      if (Array.isArray(res.data)) {

        bookList.value = res.data

        total.value = res.data.length

      } else if (res.data && res.data.records) {

        bookList.value = res.data.records

        total.value = res.data.total || res.data.records.length

      } else {

        bookList.value = res.data || []

        total.value = (res.data || []).length

      }

    } else {

      ElMessage.error('加载失败')

    }

  } catch (error) {

    console.error('加载错误：', error)

    ElMessage.error('请求失败')

  } finally {

    loading.value = false

  }

}



const handlePageChange = (page) => {

  currentPage.value = page

  loadBooks()

}



// ===== 限时秒杀倒计时 =====

const timerH = ref('02')

const timerM = ref('38')

const timerS = ref('45')

let timerInterval = null



const startTimer = () => {

  let total = 2 * 3600 + 38 * 60 + 45

  timerInterval = setInterval(() => {

    if (total <= 0) { total = 24 * 3600; return }

    total--

    timerH.value = String(Math.floor(total / 3600)).padStart(2, '0')

    timerM.value = String(Math.floor((total % 3600) / 60)).padStart(2, '0')

    timerS.value = String(total % 60).padStart(2, '0')

  }, 1000)

}



const seckillItems = [

  { id: 1, image: '', price: '4.00', originalPrice: '25.00' },

  { id: 2, image: '', price: '1.00', originalPrice: '15.00' },

  { id: 6, image: '', price: '1.00', originalPrice: '12.00' },

]



const carouselSlides = [

  { title: '旧书不旧', desc: '每一本旧书都藏着新的故事', bg: 'linear-gradient(135deg, #3d2413, #8b5e3c)', emoji: '📚', id: 0 },

  { title: '淘出惊喜', desc: '发现你意想不到的好书', bg: 'linear-gradient(135deg, #8b5e3c, #a0712a)', emoji: '🎁', id: 0 },

  { title: '学生专享', desc: '教材教辅低至3折', bg: 'linear-gradient(135deg, #5a3d2b, #8b5e3c)', emoji: '🎓', id: 0 },

]



const goToDetail = (id) => {

  router.push(`/book/${id}`)

}



// 搜索关键词或筛选条件变化时重新加载

watch([() => route.query.keyword, category, sortBy], () => {

  currentPage.value = 1

  loadBooks()

})



onMounted(() => {

  loadBooks()

  startTimer()

})



onUnmounted(() => {

  if (timerInterval) clearInterval(timerInterval)

})

</script>



<style scoped>

.home-container {

  padding: 0;

}

.filter-bar {

  display: flex;

  justify-content: space-between;

  align-items: center;

  flex-wrap: nowrap;

  gap: 12px;

  margin-bottom: 20px;

  padding: 14px 20px;

}

.filter-left {

  display: flex;

  align-items: center;

  gap: 8px;

  min-width: 0;

  flex: 1;

}

.result-hint {

  color: #8b5e3c;

  font-size: 14px;

  font-weight: 500;

  white-space: nowrap;

}

.category-buttons {

  display: flex;

  gap: 8px;

  flex-wrap: nowrap;

}

.cat-btn {

  padding: 6px 18px;

  border: none;

  border-radius: 50px;

  background: #f0ebe4;

  color: #666;

  font-size: 13px;

  cursor: pointer;

  transition: all 0.2s;

  white-space: nowrap;

  outline: none;

  user-select: none;

}

.cat-btn:hover {

  background: #e8ddd0;

  color: #3d2413;

}

.cat-btn.active {

  background: #d4943e;

  color: #fff;

  font-weight: 600;

}

.filter-right {

  display: flex;

  gap: 10px;

  flex-shrink: 0;

}

.filter-select {

  width: 140px;

}

.filter-select .el-input__wrapper {

  border-radius: 50px !important;

}

.book-list {

  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 16px;

  padding: 0 20px 20px;

  box-sizing: border-box;

}

.book-card {

  cursor: pointer;

  transition: all 0.3s;

  border-radius: 20px;

  overflow: hidden;

  background: #fff;

}

.book-card:hover {

  transform: translateY(-3px);

  box-shadow: 0 1px 4px rgba(0,0,0,0.06);

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

  display: block;

}

.no-img {

  width: 100%;

  height: 100%;

  display: flex;

  align-items: center;

  justify-content: center;

  font-size: 48px;

  color: #ccc;

  min-height: 200px;

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

.card-stats {

  display: flex;

  justify-content: space-between;

  align-items: center;

  font-size: 12px;

  color: #999;

}

.card-seller {

  color: #bbb;

}

.pagination {

  display: flex;

  justify-content: center;

  margin-top: 30px;

}

.empty {

  margin-top: 50px;

}



/* ===== main 区域（左秒杀 + 右轮播）===== */

.main {

  display: flex;

  height: 368px;

  margin-bottom: 16px;

  width: 100%;

  gap: 16px;

}



/* 左：秒杀区 */

.main-left {

  width: 360px;

  flex-shrink: 0;

  background: linear-gradient(135deg, #fff5f0 0%, #fde8e0 100%);

  border-radius: 20px;

  padding: 20px;

  display: flex;

  flex-direction: column;

  overflow: hidden;

}



.seckill-header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  margin-bottom: 16px;

}



.seckill-title {

  font-size: 16px;

  font-weight: 700;

  color: #e74c3c;

}



.seckill-timer {

  display: flex;

  align-items: center;

  gap: 3px;

}



.timer-label {

  font-size: 11px;

  color: #999;

  margin-right: 4px;

}



.timer-num {

  display: inline-block;

  background: #3d2413;

  color: #fff;

  font-size: 14px;

  font-weight: 700;

  padding: 2px 6px;

  border-radius: 4px;

  min-width: 22px;

  text-align: center;

}



.timer-colon {

  font-size: 14px;

  font-weight: 700;

  color: #3d2413;

}



.seckill-body {

  display: flex;

  gap: 12px;

  flex: 1;

}



.seckill-card {

  flex: 1;

  background: #fff;

  border-radius: 14px;

  padding: 12px;

  cursor: pointer;

  transition: all 0.25s;

  display: flex;

  flex-direction: column;

  align-items: center;

}

.seckill-card:hover {

  transform: translateY(-2px);

  box-shadow: 0 2px 8px rgba(0,0,0,0.08);

}



.seckill-img {

  width: 80px;

  height: 80px;

  border-radius: 12px;

  overflow: hidden;

  background: #f5f0eb;

  margin-bottom: 8px;

  display: flex;

  align-items: center;

  justify-content: center;

}

.seckill-img img {

  width: 100%;

  height: 100%;

  object-fit: cover;

}

.seckill-no-img {

  font-size: 32px;

}



.seckill-info {

  text-align: center;

}



.seckill-price {

  display: flex;

  align-items: baseline;

  justify-content: center;

  gap: 1px;

}

.seckill-sign {

  font-size: 11px;

  color: #e74c3c;

  font-weight: 700;

}

.seckill-num {

  font-size: 18px;

  color: #e74c3c;

  font-weight: 700;

}

.seckill-original {

  font-size: 11px;

  color: #bbb;

  text-decoration: line-through;

  margin-top: 2px;

}



.seckill-more {

  display: block;

  text-align: center;

  margin-top: 10px;

  font-size: 12px;

  color: #8b5e3c;

  text-decoration: none;

}

.seckill-more:hover {

  color: #3d2413;

}



/* 右：轮播区 */

.main-right {

  flex: 1;

  border-radius: 20px;

  overflow: hidden;

  min-width: 0;

}



.carousel-content {

  display: flex;

  align-items: center;

  justify-content: space-between;

  height: 100%;

  padding: 0 60px;

  cursor: pointer;

}



.carousel-text h2 {

  font-size: 28px;

  font-weight: 700;

  color: #fff;

  margin: 0 0 8px;

}



.carousel-text p {

  font-size: 14px;

  color: rgba(255,255,255,0.8);

  margin: 0 0 20px;

}



.carousel-btn {

  display: inline-block;

  padding: 8px 28px;

  background: rgba(255,255,255,0.2);

  border: 1px solid rgba(255,255,255,0.4);

  border-radius: 20px;

  color: #fff;

  font-size: 13px;

  transition: all 0.2s;

}

.carousel-btn:hover {

  background: rgba(255,255,255,0.3);

}



.carousel-img {

  flex-shrink: 0;

}



.carousel-emoji {

  font-size: 80px;

  line-height: 1;

}



/* ===== feeds-main--qb 区域 ===== */

.feeds-main--qb {

  width: 100%;

  background-color: #fff;

  border-radius: 20px;

}



@media (max-width: 768px) {

  .main { flex-direction: column; height: auto; }

  .main-left { width: 100%; }

  .main-right { height: 280px; }

  .carousel-content { padding: 0 30px; }

  .carousel-text h2 { font-size: 22px; }

  .book-list { grid-template-columns: repeat(2, 1fr); gap: 12px; }

  .book-card:hover { transform: none; }

  .filter-bar { flex-direction: column; align-items: stretch; }

  .filter-right { flex-direction: column; gap: 8px; }

  .filter-select { width: 100%; }

  .pagination { margin-top: 16px; }

  .empty { margin-top: 30px; }

}



</style>











