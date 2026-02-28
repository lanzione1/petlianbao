<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-logo">
        <h1>宠联宝</h1>
        <p style="color: #999; font-size: 12px">管理后台</p>
      </div>

      <ul class="sidebar-menu">
        <li
          :class="{ active: $route.path === '/dashboard' }"
          @click="$router.push({ name: 'Dashboard' })"
        >
          仪表盘
        </li>
        <li
          :class="{ active: $route.path === '/merchants' || $route.path.startsWith('/merchants/') }"
          @click="$router.push({ name: 'Merchants' })"
        >
          商家管理
        </li>
        <li
          :class="{ active: $route.path === '/revenue' }"
          @click="$router.push({ name: 'Revenue' })"
        >
          收入统计
        </li>
        <li
          :class="{ active: $route.path === '/ranking' }"
          @click="$router.push({ name: 'Ranking' })"
        >
          商家排行
        </li>
        <li
          :class="{ active: $route.path === '/packages' }"
          @click="$router.push({ name: 'Packages' })"
        >
          套餐管理
        </li>
        <li :class="{ active: $route.path === '/media' }" @click="$router.push({ name: 'Media' })">
          素材库
        </li>
        <li :class="{ active: $route.path === '/logs' }" @click="$router.push({ name: 'Logs' })">
          操作日志
        </li>
      </ul>
    </aside>

    <div class="main-content" style="background: #f5f5f5">
      <header class="header">
        <h2 class="header-title">{{ pageTitle }}</h2>
        <button @click="logout" style="padding: 8px 16px; cursor: pointer">退出</button>
      </header>

      <main class="content" style="background: orange; min-height: 500px">
        <div style="background: orange; padding: 10px; color: white">ROUTER-VIEW START</div>
        <router-view />
        <div style="background: orange; padding: 10px; color: white">ROUTER-VIEW END</div>
      </main>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

export default {
  name: 'LayoutPage',
  setup() {
    const route = useRoute();
    const router = useRouter();

    const pageTitle = computed(() => {
      const titles = {
        '/dashboard': '仪表盘',
        '/merchants': '商家管理',
        '/revenue': '收入统计',
        '/ranking': '商家排行',
        '/packages': '套餐管理',
        '/media': '素材库',
        '/logs': '操作日志',
      };
      return titles[route.path] || '管理后台';
    });

    function logout() {
      localStorage.removeItem('admin_token');
      router.push({ name: 'Login' });
    }

    return { pageTitle, logout };
  },
};
</script>
