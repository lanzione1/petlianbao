<template>
  <div
    style="
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    "
  >
    <div
      style="
        background: white;
        padding: 40px;
        border-radius: 16px;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      "
    >
      <h1 style="text-align: center; margin-bottom: 30px; color: #333; font-size: 24px">
        宠联宝管理后台
      </h1>

      <div
        style="
          background: #f0f0f0;
          padding: 10px;
          margin-bottom: 20px;
          font-size: 12px;
          border-radius: 4px;
        "
      >
        <div>当前Token: {{ tokenStatus }}</div>
        <div>已登录: {{ isLoggedIn }}</div>
      </div>

      <form @submit.prevent="handleLogin">
        <div style="margin-bottom: 20px">
          <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px"
            >用户名</label
          >
          <input
            v-model="form.username"
            type="text"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
            "
            placeholder="请输入用户名"
          />
        </div>

        <div style="margin-bottom: 20px">
          <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px"
            >密码</label
          >
          <input
            v-model="form.password"
            type="password"
            style="
              width: 100%;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 8px;
              font-size: 16px;
            "
            placeholder="请输入密码"
          />
        </div>

        <button
          type="submit"
          style="
            width: 100%;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          "
          :disabled="loading"
          :style="{ opacity: loading ? 0.5 : 1 }"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p v-if="error" style="color: red; text-align: center; margin-top: 16px">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAdminStore } from '@/stores/admin';

const router = useRouter();
const store = useAdminStore();

const loading = ref(false);
const error = ref('');

const tokenStatus = computed(() => {
  const token = localStorage.getItem('admin_token');
  return token ? '已设置 (' + token.substring(0, 10) + '...)' : '未设置';
});

const isLoggedIn = computed(() => store.isLoggedIn);

const form = reactive({
  username: 'admin',
  password: 'admin123456',
});

async function handleLogin() {
  loading.value = true;
  error.value = '';

  try {
    console.log('Login attempt:', form.username);
    await store.login(form.username, form.password);
    console.log('Login success, token:', localStorage.getItem('admin_token'));
    window.location.href = '#/dashboard';
  } catch (e: any) {
    console.error('Login error:', e);
    error.value = e.response?.data?.message || '登录失败';
  } finally {
    loading.value = false;
  }
}
</script>
