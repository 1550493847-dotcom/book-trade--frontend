/**
 * v-lazy — 图片懒加载指令
 *
 * 使用 IntersectionObserver 实现：
 * - 图片进入视口时加载真实 src
 * - 加载前显示 CSS 占位背景
 * - 图片加载失败时显示兜底图标
 *
 * 用法：<img v-lazy="imageUrl" class="book-img" />
 */
export default {
  mounted(el, binding) {
    // 保存真实地址，清空 src 防止提前加载
    const realSrc = binding.value
    if (!realSrc) {
      el.src = ''
      return
    }

    // 占位背景
    el.style.background = '#f0f0f0'
    el.src = ''

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // 进入视口：加载真实图片
            const img = new Image()
            img.onload = () => {
              el.src = realSrc
              el.style.background = ''
              observer.unobserve(el)
            }
            img.onerror = () => {
              // 加载失败：显示兜底
              el.style.background = '#f5f5f5'
              el.alt = '图片加载失败'
              observer.unobserve(el)
            }
            img.src = realSrc
          }
        })
      },
      {
        rootMargin: '100px', // 提前 100px 加载
        threshold: 0.01,
      }
    )

    observer.observe(el)
    el._lazyObserver = observer
  },

  unmounted(el) {
    if (el._lazyObserver) {
      el._lazyObserver.disconnect()
      delete el._lazyObserver
    }
  },
}
