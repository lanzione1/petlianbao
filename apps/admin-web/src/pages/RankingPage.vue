<template>
  <div class="ranking-page">
    <div class="page-header">
      <h3>商家排行榜</h3>
      <div class="ranking-tabs">
        <button 
          :class="['tab-btn', { active: type === 'revenue' }]" 
          @click="changeType('revenue')"
        >
          收入排行
        </button>
        <button 
          :class="['tab-btn', { active: type === 'customers' }]" 
          @click="changeType('customers')"
        >
          客户数排行
        </button>
        <button 
          :class="['tab-btn', { active: type === 'appointments' }]" 
          @click="changeType('appointments')"
        >
          预约数排行
        </button>
      </div>
    </div>

    <div class="top-three" v-if="ranking.length >= 3">
      <div class="top-item second">
        <div class="top-rank">2</div>
        <div class="top-name">{{ ranking[1]?.shopName }}</div>
        <div class="top-value">{{ getValue(ranking[1]) }}</div>
      </div>
      <div class="top-item first">
        <div class="top-rank">1</div>
        <div class="top-name">{{ ranking[0]?.shopName }}</div>
        <div class="top-value">{{ getValue(ranking[0]) }}</div>
      </div>
      <div class="top-item third">
        <div class="top-rank">3</div>
        <div class="top-name">{{ ranking[2]?.shopName }}</div>
        <div class="top-value">{{ getValue(ranking[2]) }}</div>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 60px">排名</th>
            <th>店铺名称</th>
            <th>联系电话</th>
            <th>套餐</th>
            <th>{{ getTypeLabel() }}</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(item, index) in ranking" :key="item.id">
            <td>
              <span :class="['rank-badge', getRankClass(index)]">{{ index + 1 }}</span>
            </td>
            <td>{{ item.shopName }}</td>
            <td>{{ item.phone || '-' }}</td>
            <td>
              <span :class="['plan-badge', 'plan-' + item.planType]">{{ getPlanName(item.planType) }}</span>
            </td>
            <td class="highlight">{{ getValue(item) }}</td>
            <td>
              <button class="btn btn-sm" @click="$router.push('/merchants/' + item.id)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="ranking.length === 0" class="empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api'

const type = ref('revenue')
const ranking = ref<any[]>([])

onMounted(() => {
  loadData()
})

async function loadData() {
  try {
    const res = await adminApi.getMerchantRanking(type.value, 50) as any
    ranking.value = res || []
  } catch (e) {
    console.error('加载数据失败', e)
  }
}

function changeType(newType: string) {
  type.value = newType
  loadData()
}

function getValue(item: any) {
  if (type.value === 'revenue') {
    return formatMoney(item.revenue)
  } else if (type.value === 'customers') {
    return item.customers + ' 人'
  } else {
    return item.appointments + ' 次'
  }
}

function getTypeLabel() {
  const labels: Record<string, string> = {
    revenue: '累计收入',
    customers: '客户数',
    appointments: '预约数',
  }
  return labels[type.value] || ''
}

function formatMoney(amount: number) {
  if (!amount) return '0.00'
  return (amount / 100).toFixed(2) + ' 元'
}

function getPlanName(plan: string) {
  const plans: Record<string, string> = {
    free: '免费',
    basic: '基础',
    professional: '专业',
    enterprise: '企业',
  }
  return plans[plan] || plan || '免费'
}

function getRankClass(index: number) {
  if (index === 0) return 'rank-1'
  if (index === 1) return 'rank-2'
  if (index === 2) return 'rank-3'
  return ''
}
</script>

<style scoped>
.ranking-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h3 {
  margin: 0;
}

.ranking-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
  cursor: pointer;
}

.tab-btn.active {
  background: #1890ff;
  border-color: #1890ff;
  color: white;
}

.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
}

.top-item {
  text-align: center;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.top-item.first {
  order: 2;
  transform: scale(1.1);
  background: linear-gradient(135deg, #fff7e6, #ffe7ba);
}

.top-item.second {
  order: 1;
  background: linear-gradient(135deg, #f5f5f5, #e8e8e8);
}

.top-item.third {
  order: 3;
  background: linear-gradient(135deg, #fff1e6, #ffd9b3);
}

.top-rank {
  width: 40px;
  height: 40px;
  line-height: 40px;
  border-radius: 50%;
  background: #1890ff;
  color: white;
  font-weight: 600;
  margin: 0 auto 12px;
}

.top-item.first .top-rank {
  background: #faad14;
}

.top-item.second .top-rank {
  background: #8c8c8c;
}

.top-item.third .top-rank {
  background: #fa8c16;
}

.top-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.top-value {
  font-size: 20px;
  font-weight: 600;
  color: #52c41a;
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

.rank-badge {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  border-radius: 4px;
  background: #f5f5f5;
  font-size: 12px;
}

.rank-badge.rank-1 {
  background: #faad14;
  color: white;
}

.rank-badge.rank-2 {
  background: #8c8c8c;
  color: white;
}

.rank-badge.rank-3 {
  background: #fa8c16;
  color: white;
}

.plan-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.plan-free { background: #f5f5f5; color: #666; }
.plan-basic { background: #e6f7ff; color: #1890ff; }
.plan-professional { background: #f6ffed; color: #52c41a; }
.plan-enterprise { background: #fff7e6; color: #fa8c16; }

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
