import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import Login from '../views/Login.vue'

describe('Login.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('renders brand section', () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          'router-link': true,
          'el-button': true,
          'el-input': true,
          'el-icon': true,
          'el-form': true,
          'el-form-item': true,
          'el-tabs': true,
          'el-tab-pane': true,
          'el-checkbox': true,
        },
      },
    })
    expect(wrapper.text()).toContain('淘籍籍')
    expect(wrapper.text()).toContain('让每一本旧书')
  })

  it('has username and password fields', () => {
    const wrapper = mount(Login, {
      global: {
        stubs: {
          'router-link': true,
          'el-button': true,
          'el-input': { template: '<input class="el-input__inner" />' },
          'el-icon': true,
          'el-form': { template: '<div><slot /></div>' },
          'el-form-item': { template: '<div><slot /></div>' },
          'el-tabs': { template: '<div><slot /></div>' },
          'el-tab-pane': { template: '<div><slot /></div>' },
          'el-checkbox': true,
        },
      },
    })
    const inputs = wrapper.findAll('input')
    expect(inputs.length).toBeGreaterThanOrEqual(2)
  })
})
