import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../cart'

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with empty items', () => {
    const store = useCartStore()
    expect(store.items).toEqual([])
  })

  it('addItem adds a book to cart', () => {
    const store = useCartStore()
    const book = { id: 1, title: '测试图书', author: '测试作者', sellPrice: 29.9, images: '/img/1.jpg' }
    const result = store.addItem(book)
    expect(result).toBe(true)
    expect(store.items).toHaveLength(1)
    expect(store.items[0].bookId).toBe(1)
    expect(store.items[0].title).toBe('测试图书')
  })

  it('addItem returns false for duplicate', () => {
    const store = useCartStore()
    const book = { id: 1, title: '测试图书', sellPrice: 29.9 }
    store.addItem(book)
    const result = store.addItem(book)
    expect(result).toBe(false)
    expect(store.items).toHaveLength(1)
  })

  it('removeItem removes a book by bookId', () => {
    const store = useCartStore()
    store.addItem({ id: 1, title: '书1', sellPrice: 10 })
    store.addItem({ id: 2, title: '书2', sellPrice: 20 })
    store.removeItem(1)
    expect(store.items).toHaveLength(1)
    expect(store.items[0].bookId).toBe(2)
  })

  it('clearCart empties items', () => {
    const store = useCartStore()
    store.addItem({ id: 1, title: '书1', sellPrice: 10 })
    store.addItem({ id: 2, title: '书2', sellPrice: 20 })
    store.clearCart()
    expect(store.items).toEqual([])
  })

  it('hasItem checks if book exists', () => {
    const store = useCartStore()
    store.addItem({ id: 1, title: '书1', sellPrice: 10 })
    expect(store.hasItem(1)).toBe(true)
    expect(store.hasItem(2)).toBe(false)
  })

  it('persists to localStorage', async () => {
    const { nextTick } = await import('vue')
    const store = useCartStore()
    store.addItem({ id: 1, title: '持久化测试', sellPrice: 15 })
    await nextTick()
    const saved = JSON.parse(localStorage.getItem('cartItems') || '[]')
    expect(saved).toHaveLength(1)
    expect(saved[0].bookId).toBe(1)
  })
})
