<template>
  <div class="media-page">
    <div class="page-header">
      <h3>素材库管理</h3>
      <div class="filters">
        <select v-model="filters.type" class="filter-select" @change="loadMedia">
          <option value="">全部类型</option>
          <option value="image">图片</option>
          <option value="video">视频</option>
          <option value="document">文档</option>
        </select>
        <button class="btn btn-sm" @click="loadMedia">刷新</button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-label">总素材</span>
        <span class="stat-value">{{ stats.total || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">图片</span>
        <span class="stat-value">{{ stats.images || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">视频</span>
        <span class="stat-value">{{ stats.videos || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">文档</span>
        <span class="stat-value">{{ stats.documents || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">总大小</span>
        <span class="stat-value">{{ formatSize(stats.totalSize) }}</span>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>预览</th>
            <th>文件名</th>
            <th>类型</th>
            <th>大小</th>
            <th>所属商家</th>
            <th>上传时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in mediaList" :key="item.id">
            <td>
              <div class="preview-box">
                <img 
                  v-if="item.type === 'image'" 
                  :src="item.url" 
                  @click="previewImage(item.url)"
                />
                <span v-else-if="item.type === 'video'" class="file-icon">视频</span>
                <span v-else class="file-icon">文档</span>
              </div>
            </td>
            <td>{{ item.name }}</td>
            <td>
              <span :class="['type-badge', 'type-' + item.type]">{{ getTypeName(item.type) }}</span>
            </td>
            <td>{{ formatSize(item.size) }}</td>
            <td>{{ item.shopName || '-' }}</td>
            <td>{{ formatDateTime(item.createdAt) }}</td>
            <td>
              <button class="btn btn-sm" @click="viewUrl(item.url)">查看</button>
              <button class="btn btn-sm btn-danger" @click="handleDelete(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="mediaList.length === 0" class="empty">暂无素材</div>
    </div>

    <div class="pagination" v-if="totalPages > 1">
      <button 
        class="page-btn" 
        :disabled="page === 1"
        @click="page--; loadMedia()"
      >
        上一页
      </button>
      <span>{{ page }} / {{ totalPages }}</span>
      <button 
        class="page-btn" 
        :disabled="page === totalPages"
        @click="page++; loadMedia()"
      >
        下一页
      </button>
    </div>

    <div v-if="previewUrl" class="preview-modal" @click="previewUrl = ''">
      <img :src="previewUrl" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api'

const mediaList = ref<any[]>([])
const stats = ref<any>({})
const page = ref(1)
const totalPages = ref(1)
const previewUrl = ref('')

const filters = reactive({
  type: '',
})

onMounted(() => {
  loadMedia()
  loadStats()
})

async function loadMedia() {
  try {
    const res = await adminApi.getMediaList({
      page: page.value,
      limit: 20,
      type: filters.type || undefined,
    }) as any
    mediaList.value = res.list || []
    totalPages.value = res.totalPages || 1
  } catch (e) {
    console.error('加载失败', e)
  }
}

async function loadStats() {
  try {
    const res = await adminApi.getMediaStats() as any
    stats.value = res
  } catch (e) {
    console.error('加载统计失败', e)
  }
}

async function handleDelete(id: string) {
  if (!confirm('确定删除该素材吗？')) return
  try {
    await adminApi.deleteMedia(id)
    loadMedia()
    loadStats()
  } catch (e) {
    alert('删除失败')
  }
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('zh-CN')
}

function formatSize(size: number) {
  if (!size) return '-'
  if (size < 1024) return size + ' B'
  if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'
  return (size / 1024 / 1024).toFixed(2) + ' MB'
}

function getTypeName(type: string) {
  const names: Record<string, string> = {
    image: '图片',
    video: '视频',
    document: '文档',
  }
  return names[type] || type
}

function previewImage(url: string) {
  previewUrl.value = url
}

function viewUrl(url: string) {
  window.open(url, '_blank')
}
</script>

<style scoped>
.media-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h3 {
  margin: 0;
}

.filters {
  display: flex;
  gap: 8px;
}

.filter-select {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.stats-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding: 16px;
  background: white;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: #666;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
}

.preview-box {
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.preview-box img {
  max-width: 100%;
  max-height: 100%;
  cursor: pointer;
}

.file-icon {
  font-size: 12px;
  color: #666;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.type-image { background: #e6f7ff; color: #1890ff; }
.type-video { background: #fff7e6; color: #fa8c16; }
.type-document { background: #f6ffed; color: #52c41a; }

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

th {
  font-weight: 500;
  color: #666;
  font-size: 13px;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.page-btn {
  padding: 6px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: pointer;
}

.preview-modal img {
  max-width: 90%;
  max-height: 90%;
}
</style>
