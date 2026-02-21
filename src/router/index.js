import { createRouter, createWebHistory } from 'vue-router'

import App from '@/App.vue'

const routes = [
  {
    path: '/',
    name: 'home',
    component: App
  },

]

const router = createRouter({
  history: createWebHistory(), // 使用 HTML5 模式
  routes
})


export default router
