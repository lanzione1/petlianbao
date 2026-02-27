import { createRouter, createWebHistory } from 'vue-router'
import { useAdminStore } from '@/stores/admin'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/full-test',
      name: 'FullTest',
      component: () => import('@/pages/FullTestPage.vue'),
    },
    {
      path: '/vue-test',
      name: 'VueTest',
      component: () => import('@/pages/TestPage.vue'),
    },
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/pages/LoginPage.vue'),
    },
    {
      path: '/',
      component: () => import('@/pages/LayoutPage.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/pages/DashboardPage.vue'),
        },
        {
          path: 'packages',
          name: 'Packages',
          component: () => import('@/pages/PackagesPage.vue'),
        },
        {
          path: 'merchants',
          name: 'Merchants',
          component: () => import('@/pages/MerchantsPage.vue'),
        },
        {
          path: 'merchants/:id',
          name: 'MerchantDetail',
          component: () => import('@/pages/MerchantDetailPage.vue'),
        },
        {
          path: 'revenue',
          name: 'Revenue',
          component: () => import('@/pages/RevenuePage.vue'),
        },
        {
          path: 'ranking',
          name: 'Ranking',
          component: () => import('@/pages/RankingPage.vue'),
        },
        {
          path: 'media',
          name: 'Media',
          component: () => import('@/pages/MediaPage.vue'),
        },
        {
          path: 'logs',
          name: 'Logs',
          component: () => import('@/pages/LogsPage.vue'),
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.path === '/vue-test' || to.path === '/full-test') {
    next()
    return
  }
  
  const hasToken = !!localStorage.getItem('admin_token')
  
  if (to.path !== '/login' && !hasToken) {
    next('/login')
  } else if (to.path === '/login' && hasToken) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router
