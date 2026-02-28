<template>
  <div class="pet-detail-page">
    <div class="header">
      <button class="back-btn" @click="router.back()">‹ 返回</button>
      <h1>{{ isNew ? '添加宠物' : '编辑宠物' }}</h1>
      <button class="save-btn" @click="save" :disabled="saving">
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </div>

    <div class="form">
      <div class="form-item">
        <label>宠物名称 *</label>
        <input type="text" v-model="form.name" placeholder="请输入宠物名称" />
      </div>

      <div class="form-item">
        <label>宠物类型 *</label>
        <div class="type-selector">
          <button :class="{ active: form.species === 'dog' }" @click="form.species = 'dog'">
            🐕 狗狗
          </button>
          <button :class="{ active: form.species === 'cat' }" @click="form.species = 'cat'">
            🐱 猫咪
          </button>
          <button :class="{ active: form.species === 'other' }" @click="form.species = 'other'">
            🐾 其他
          </button>
        </div>
      </div>

      <div class="form-item">
        <label>品种</label>
        <input type="text" v-model="form.breed" placeholder="如：金毛、英短" />
      </div>

      <div class="form-item">
        <label>性别</label>
        <div class="gender-selector">
          <button :class="{ active: form.gender === 'male' }" @click="form.gender = 'male'">
            公
          </button>
          <button :class="{ active: form.gender === 'female' }" @click="form.gender = 'female'">
            母
          </button>
          <button :class="{ active: form.gender === 'unknown' }" @click="form.gender = 'unknown'">
            未知
          </button>
        </div>
      </div>

      <div class="form-item">
        <label>生日</label>
        <input type="date" v-model="form.birthday" />
      </div>

      <div class="form-item">
        <label>体重(kg)</label>
        <input type="number" step="0.1" v-model="form.weight" placeholder="如：5.5" />
      </div>

      <div class="form-item">
        <label>备注</label>
        <textarea v-model="form.notes" placeholder="如：怕生、特殊习惯等"></textarea>
      </div>
    </div>

    <button class="delete-btn" v-if="!isNew" @click="deletePet">删除宠物</button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import api from '../api'

const route = useRoute()
const router = useRouter()

const isNew = computed(() => route.params.id === 'new')
const saving = ref(false)

const form = ref({
  name: '',
  species: 'dog' as 'dog' | 'cat' | 'other',
  breed: '',
  gender: 'unknown' as 'male' | 'female' | 'unknown',
  birthday: '',
  weight: '',
  notes: '',
})

onMounted(async () => {
  if (!isNew.value) {
    await loadPet()
  }
})

async function loadPet() {
  try {
    const { data } = await api.get(`/h5/pets/${route.params.id}`)
    const pet = data.data
    form.value = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      gender: pet.gender || 'unknown',
      birthday: pet.birthday ? pet.birthday.split('T')[0] : '',
      weight: pet.weight || '',
      notes: pet.notes || '',
    }
  } catch (e) {
    console.error('Load pet failed:', e)
    router.back()
  }
}

async function save() {
  if (!form.value.name) {
    alert('请输入宠物名称')
    return
  }

  saving.value = true
  try {
    const data = {
      name: form.value.name,
      species: form.value.species,
      breed: form.value.breed || null,
      gender: form.value.gender,
      birthday: form.value.birthday || null,
      weight: form.value.weight ? parseFloat(form.value.weight) : null,
      notes: form.value.notes || null,
    }

    if (isNew.value) {
      await api.post('/h5/pets', data)
    } else {
      await api.put(`/h5/pets/${route.params.id}`, data)
    }

    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function deletePet() {
  if (!confirm('确定要删除这只宠物吗？')) return

  try {
    await api.delete(`/h5/pets/${route.params.id}`)
    router.back()
  } catch (e: any) {
    alert(e.response?.data?.message || '删除失败')
  }
}
</script>

<style scoped>
.pet-detail-page {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 30px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.back-btn {
  background: none;
  border: none;
  color: white;
  font-size: 24px;
  cursor: pointer;
  padding: 0 8px;
}

.header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.save-btn {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
}

.save-btn:disabled {
  opacity: 0.6;
}

.form {
  padding: 20px;
}

.form-item {
  margin-bottom: 20px;
  background: white;
  padding: 16px;
  border-radius: 12px;
}

.form-item label {
  display: block;
  margin-bottom: 12px;
  color: #333;
  font-weight: 500;
  font-size: 15px;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  font-size: 16px;
  background: #fafafa;
  box-sizing: border-box;
}

.form-item textarea {
  min-height: 80px;
  resize: vertical;
}

.type-selector,
.gender-selector {
  display: flex;
  gap: 10px;
}

.type-selector button,
.gender-selector button {
  flex: 1;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 8px;
  background: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.type-selector button.active,
.gender-selector button.active {
  border-color: #667eea;
  background: #f0f4ff;
  color: #667eea;
}

.delete-btn {
  width: calc(100% - 40px);
  margin: 0 20px;
  padding: 16px;
  background: #fff;
  border: 1px solid #ff4d4f;
  border-radius: 12px;
  color: #ff4d4f;
  font-size: 16px;
  cursor: pointer;
}
</style>