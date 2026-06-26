import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import App from '../App.vue'
import HomePage from '@/views/HomePage.vue'

const routes = [
  { path: '/', name: 'home', component: HomePage },
]

describe('App', () => {
  let router

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    router = createRouter({
      history: createMemoryHistory(),
      routes,
    })
  })

  it('renders brand name and search bar', async () => {
    router.push('/')
    await router.isReady()
    const wrapper = mount(App, {
      global: {
        plugins: [router],
        stubs: {
          'router-link': true,
          'el-icon': true,
          'el-avatar': true,
          'el-button': true,
          'el-dropdown': true,
          'el-dropdown-menu': true,
          'el-dropdown-item': true,
        },
      },
    })
    expect(wrapper.text()).toContain('淘籍籍')
    const searchInput = wrapper.find('input')
    expect(searchInput.exists()).toBe(true)
  })
})
