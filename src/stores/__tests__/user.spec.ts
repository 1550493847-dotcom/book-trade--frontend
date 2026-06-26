import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '../user'

describe('user store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('starts with empty token (not logged in)', () => {
    const store = useUserStore()
    expect(store.token).toBe('')
    expect(store.isLogin).toBe(false)
    expect(store.displayName).toBe('用户')
  })

  it('setLogin saves token and userInfo', () => {
    const store = useUserStore()
    store.setLogin('test-token', { id: 1, username: 'alice', nickname: 'Alice' })
    expect(store.token).toBe('test-token')
    expect(store.isLogin).toBe(true)
    expect(store.displayName).toBe('Alice')
    expect(localStorage.getItem('token')).toBe('test-token')
  })

  it('displayName uses nickname first', () => {
    const store = useUserStore()
    store.setLogin('tk', { nickname: '小明', username: 'xiaoming' })
    expect(store.displayName).toBe('小明')
  })

  it('displayName falls back to username', () => {
    const store = useUserStore()
    store.setLogin('tk', { username: 'xiaoming' })
    expect(store.displayName).toBe('xiaoming')
  })

  it('logout clears everything', () => {
    const store = useUserStore()
    store.setLogin('tk', { id: 1, username: 'alice' })
    store.logout()
    expect(store.token).toBe('')
    expect(store.isLogin).toBe(false)
    expect(store.userInfo).toEqual({})
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('updateInfo merges partial data', () => {
    const store = useUserStore()
    store.setLogin('tk', { id: 1, username: 'alice', phone: '123' })
    store.updateInfo({ phone: '456', email: 'a@b.com' })
    expect(store.userInfo.phone).toBe('456')
    expect(store.userInfo.email).toBe('a@b.com')
    expect(store.userInfo.username).toBe('alice')
  })

  it('avatarUrl returns full URL when path is relative', () => {
    const store = useUserStore()
    store.setLogin('tk', { avatar: '/uploads/avatar.png' })
    expect(store.avatarUrl).toBe('http://localhost:8080/uploads/avatar.png')
  })

  it('avatarUrl returns as-is when already absolute', () => {
    const store = useUserStore()
    store.setLogin('tk', { avatar: 'https://cdn.example.com/avatar.jpg' })
    expect(store.avatarUrl).toBe('https://cdn.example.com/avatar.jpg')
  })

  it('avatarUrl returns empty when no avatar', () => {
    const store = useUserStore()
    store.setLogin('tk', {})
    expect(store.avatarUrl).toBe('')
  })

  it('refreshFromStorage reloads from localStorage', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('userInfo', JSON.stringify({ id: 2, username: 'bob' }))
    const store = useUserStore()
    store.refreshFromStorage()
    expect(store.token).toBe('stored-token')
    expect(store.isLogin).toBe(true)
    expect(store.userInfo.username).toBe('bob')
  })
})
