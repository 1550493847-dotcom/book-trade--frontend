import { ref, watch } from 'vue'
import { defineStore } from 'pinia'

export const useCartStore = defineStore('cart', () => {
  // ===== 状态 =====
  const items = ref(loadCart())

  function loadCart() {
    try {
      const raw = localStorage.getItem('cartItems')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  }

  // ===== 持久化 =====
  function saveCart() {
    localStorage.setItem('cartItems', JSON.stringify(items.value))
  }

  watch(items, saveCart, { deep: true })

  // ===== 计算 =====
  function findIndex(bookId) {
    return items.value.findIndex((i) => i.bookId === bookId)
  }

  // ===== 操作 =====
  function addItem(book) {
    const idx = findIndex(book.id)
    if (idx >= 0) return false // 已在购物车
    items.value.push({
      bookId: book.id,
      title: book.title,
      author: book.author || '未知',
      sellPrice: book.sellPrice,
      images: book.images,
      addedAt: Date.now()
    })
    return true
  }

  function removeItem(bookId) {
    const idx = findIndex(bookId)
    if (idx >= 0) items.value.splice(idx, 1)
  }

  function clearCart() {
    items.value = []
  }

  function hasItem(bookId) {
    return findIndex(bookId) >= 0
  }

  return {
    items,
    addItem,
    removeItem,
    clearCart,
    hasItem
  }
})
