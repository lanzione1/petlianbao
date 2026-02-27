<template>
  <div class="pets-page">
    <div class="header">
      <h1>我的宠物</h1>
      <button class="add-btn" @click="goToAdd">+ 添加</button>
    </div>

    <div class="loading" v-if="loading">加载中...</div>

    <div class="empty" v-else-if="pets.length === 0">
      <div class="empty-icon">🐾</div>
      <p>还没有添加宠物</p>
      <button @click="goToAdd">添加第一只宠物</button>
    </div>

    <div class="pet-list" v-else>
      <div class="pet-card" v-for="pet in pets" :key="pet.id" @click="goToDetail(pet.id)">
        <div class="pet-avatar">
          <img v-if="pet.avatar" :src="pet.avatar" />
          <span v-else class="pet-emoji">{{ pet.species === 'dog' ? '🐕' : pet.species === 'cat' ? '🐱' : '🐾' }}</span>
        </div>
        <div class="pet-info">
          <div class="pet-name">{{ pet.name }}</div>
          <div class="pet-breed">{{ pet.breed || '未知品种' }}</div>
        </div>
        <div class="pet-arrow">›</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
const pets = ref<any[]>([])
const loading = ref(true)

onMounted(async () => {
  await loadPets()
})

async function loadPets() {
  try {
    const { data } = await api.get('/h5/pets')
    pets.value = data.data || []
  } catch (e) {
    console.error('Load pets failed:', e)
  } finally {
    loading.value = false
  }
}

function goToAdd() {
  router.push('/pet/new')
}

function goToDetail(id: string) {
  router.push(`/pet/${id}`)
}
</script>

<style scoped>
.pets-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header h1 {
  margin: 0;
  font-size: 20px;
}

.add-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 20px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.loading, .empty {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty button {
  margin-top: 16px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
}

.pet-list {
  padding: 12px;
}

.pet-card {
  display: flex;
  align-items: center;
  padding: 16px;
  background: white;
  border-radius: 12px;
  margin-bottom: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.2s;
}

.pet-card:active {
  transform: scale(0.98);
}

.pet-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  overflow: hidden;
}

.pet-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.pet-emoji {
  font-size: 24px;
}

.pet-info {
  flex: 1;
}

.pet-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.pet-breed {
  font-size: 13px;
  color: #999;
}

.pet-arrow {
  font-size: 20px;
  color: #ccc;
}
</style>