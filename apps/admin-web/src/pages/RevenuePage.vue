<template>
  <div class="revenue-page">
    <div class="page-header">
      <h3>收入统计</h3>
      <div class="date-range">
        <input type="date" v-model="startDate" />
        <span>至</span>
        <input type="date" v-model="endDate" />
        <button class="btn btn-primary btn-sm" @click="loadData">查询</button>
        <button class="btn btn-sm" @click="setRange(7)">近7天</button>
        <button class="btn btn-sm" @click="setRange(30)">近30天</button>
      </div>
    </div>

    <div class="summary-cards">
      <div class="summary-card">
        <div class="summary-value">{{ formatMoney(summary.totalRevenue) }}</div>
        <div class="summary-label">总收入（元）</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ summary.totalTransactions }}</div>
        <div class="summary-label">交易笔数</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ formatMoney(summary.avgRevenue) }}</div>
        <div class="summary-label">日均收入（元）</div>
      </div>
      <div class="summary-card">
        <div class="summary-value">{{ summary.days }}</div>
        <div class="summary-label">统计天数</div>
      </div>
    </div>

    <div class="chart-container">
      <h4>收入趋势</h4>
      <div class="chart-area">
        <div class="y-axis">
          <span>{{ formatMoney(maxRevenue) }}</span>
          <span>{{ formatMoney(maxRevenue / 2) }}</span>
          <span>0</span>
        </div>
        <div class="bars-container">
          <div 
            v-for="(item, index) in daily" 
            :key="index"
            class="bar-wrapper"
          >
            <div 
              class="bar" 
              :style="{ height: getBarHeight(item.revenue) + '%' }"
              :title="`${item.date}: ${formatMoney(item.revenue)}元 (${item.count}笔)`"
            >
              <span class="bar-tooltip">{{ formatMoney(item.revenue) }}</span>
            </div>
            <span class="bar-label">{{ formatDateShort(item.date) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="table-container">
      <h4>每日明细</h4>
      <table>
        <thead>
          <tr>
            <th>日期</th>
            <th>收入</th>
            <th>交易笔数</th>
            <th>客单价</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in daily" :key="item.date">
            <td>{{ item.date }}</td>
            <td class="highlight">{{ formatMoney(item.revenue) }}</td>
            <td>{{ item.count }}</td>
            <td>{{ item.count > 0 ? formatMoney(item.revenue / item.count) : '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { adminApi } from '@/api'

const startDate = ref('')
const endDate = ref('')
const daily = ref<any[]>([])
const summary = ref({ totalRevenue: 0, totalTransactions: 0, avgRevenue: 0, days: 0 })

const maxRevenue = computed(() => {
  if (!daily.value.length) return 1
  return Math.max(...daily.value.map(d => d.revenue || 0), 1)
})

onMounted(() => {
  setRange(30)
})

function setRange(days: number) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days + 1)
  startDate.value = start.toISOString().split('T')[0]
  endDate.value = end.toISOString().split('T')[0]
  loadData()
}

async function loadData() {
  try {
    const res = await adminApi.getRevenueStats(startDate.value, endDate.value) as any
    daily.value = res.daily || []
    summary.value = res.summary || {}
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function formatMoney(amount: number) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2)
}

function formatDateShort(date: string) {
  const d = new Date(date)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getBarHeight(value: number) {
  if (!maxRevenue.value || !value) return 0
  return (value / maxRevenue.value) * 100
}
</script>

<style scoped>
.revenue-page {
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

.date-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.date-range input {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
}

.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-value {
  font-size: 28px;
  font-weight: 600;
  color: #52c41a;
}

.summary-label {
  font-size: 14px;
  color: #666;
  margin-top: 8px;
}

.chart-container {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.chart-container h4 {
  margin: 0 0 16px 0;
}

.chart-area {
  display: flex;
  height: 200px;
}

.y-axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding-right: 12px;
  font-size: 12px;
  color: #999;
  width: 60px;
  text-align: right;
}

.bars-container {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: 4px;
  padding-bottom: 24px;
  border-bottom: 1px solid #eee;
}

.bar-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 100%;
  justify-content: flex-end;
}

.bar {
  width: 100%;
  max-width: 40px;
  background: linear-gradient(to top, #52c41a, #95de64);
  border-radius: 4px 4px 0 0;
  min-height: 2px;
  position: relative;
  cursor: pointer;
}

.bar:hover {
  opacity: 0.8;
}

.bar-tooltip {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 10px;
  color: #666;
  white-space: nowrap;
  display: none;
}

.bar:hover .bar-tooltip {
  display: block;
}

.bar-label {
  font-size: 10px;
  color: #999;
  margin-top: 4px;
}

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

td.highlight {
  color: #52c41a;
  font-weight: 500;
}
</style>
