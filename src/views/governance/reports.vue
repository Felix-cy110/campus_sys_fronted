<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { getReportStats, getReportCases, getReportDetail, handleReport } from '@/api'

const loading = ref(false)
const cases = ref<any[]>([])
const total = ref(0)
const stats = ref<any>({})
const filters = reactive({ pageNum: 1, pageSize: 20, targetType: undefined as number | undefined, status: undefined as number | undefined })

const detailVisible = ref(false)
const detail = ref<any>(null)
const handleVisible = ref(false)
const handleForm = reactive({ action: 'CONFIRM', handleRemark: '', syncAction: true })

const statusMap: Record<number, { label: string; type: string }> = {
  0: { label: '待处理', type: 'warning' },
  1: { label: '已处理', type: 'success' },
  2: { label: '已驳回', type: 'danger' },
}

const targetTypeMap: Record<number, string> = { 1: '帖子', 2: '评论', 3: '用户', 4: '租赁商品', 5: '闲置商品' }

async function loadData() {
  loading.value = true
  try {
    const [caseRes, statRes] = await Promise.all([getReportCases(filters), getReportStats()])
    cases.value = caseRes.data?.list || []
    total.value = caseRes.data?.total || 0
    stats.value = statRes.data || {}
  } finally {
    loading.value = false
  }
}

async function openDetail(id: number) {
  const res = await getReportDetail(id)
  detail.value = res.data
  detailVisible.value = true
}

function openHandle(row: any) {
  detail.value = row
  handleForm.action = 'CONFIRM'
  handleForm.handleRemark = ''
  handleForm.syncAction = true
  handleVisible.value = true
}

async function submitHandle() {
  if (!detail.value?.id) return
  await handleReport(detail.value.id, { ...handleForm })
  ElMessage.success('处理成功')
  handleVisible.value = false
  detailVisible.value = false
  await loadData()
}

onMounted(loadData)
</script>

<template>
  <div class="page">
    <el-row :gutter="16" class="stats-row">
      <el-col :span="8"><el-card>待处理举报 {{ stats.pendingCount || 0 }}</el-card></el-col>
      <el-col :span="8"><el-card>今日新增 {{ stats.todayNewCount || 0 }}</el-card></el-col>
      <el-col :span="8"><el-card>已确认违规 {{ stats.confirmedCount || 0 }}</el-card></el-col>
    </el-row>

    <el-card>
      <div class="toolbar">
        <el-select v-model="filters.targetType" clearable placeholder="对象类型" style="width:140px">
          <el-option v-for="(label, val) in targetTypeMap" :key="val" :value="Number(val)" :label="label" />
        </el-select>
        <el-select v-model="filters.status" clearable placeholder="处理状态" style="width:140px">
          <el-option :value="0" label="待处理" />
          <el-option :value="1" label="已处理" />
          <el-option :value="2" label="已驳回" />
        </el-select>
        <el-button type="primary" @click="loadData">查询</el-button>
      </div>

      <el-table :data="cases" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="对象类型" width="100">
          <template #default="{ row }">{{ row.targetTypeDesc || targetTypeMap[row.targetType] || '-' }}</template>
        </el-table-column>
        <el-table-column prop="targetId" label="对象ID" width="100" />
        <el-table-column prop="targetSummary" label="内容摘要" min-width="180" show-overflow-tooltip />
        <el-table-column label="举报原因" width="130">
          <template #default="{ row }">{{ row.reasonDesc || row.reason || '-' }}</template>
        </el-table-column>
        <el-table-column prop="reporterNickname" label="举报人" width="110" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusMap[row.status]?.type">{{ row.statusDesc || statusMap[row.status]?.label }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="举报时间" width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row.id)">详情</el-button>
            <el-button v-if="row.status === 0" link type="success" @click="openHandle(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pager">
        <el-pagination background layout="total, prev, pager, next" :total="total"
          :current-page="filters.pageNum" :page-size="filters.pageSize"
          @current-change="(p: number) => { filters.pageNum = p; loadData() }" />
      </div>
    </el-card>

    <el-drawer v-model="detailVisible" title="举报详情" size="40%">
      <el-descriptions v-if="detail" :column="2" border>
        <el-descriptions-item label="ID">{{ detail.id }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusMap[detail.status]?.type">{{ detail.statusDesc || statusMap[detail.status]?.label }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="对象类型">{{ detail.targetTypeDesc || targetTypeMap[detail.targetType] }}</el-descriptions-item>
        <el-descriptions-item label="对象ID">{{ detail.targetId }}</el-descriptions-item>
        <el-descriptions-item label="举报原因">{{ detail.reasonDesc || detail.reason }}</el-descriptions-item>
        <el-descriptions-item label="举报人">{{ detail.reporterNickname }}</el-descriptions-item>
        <el-descriptions-item label="补充说明" :span="2">{{ detail.remark || '无' }}</el-descriptions-item>
        <el-descriptions-item v-if="detail.handleRecord" label="处理备注" :span="2">{{ detail.handleRecord.handleRemark }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button v-if="detail?.status === 0" type="primary" @click="openHandle(detail)">处理</el-button>
      </template>
    </el-drawer>

    <el-dialog v-model="handleVisible" title="处理举报" width="480px">
      <el-form label-width="90px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="handleForm.action">
            <el-radio value="CONFIRM">确认违规</el-radio>
            <el-radio value="REJECT">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="联动处理">
          <el-switch v-model="handleForm.syncAction" />
          <span style="margin-left:8px;color:#909399;font-size:12px">确认违规时自动处理违规内容</span>
        </el-form-item>
        <el-form-item label="处理备注">
          <el-input v-model="handleForm.handleRemark" type="textarea" :rows="3" placeholder="可选填写处理说明" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="submitHandle">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page { padding: 16px; }
.stats-row { margin-bottom: 16px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; }
.pager { display: flex; justify-content: flex-end; margin-top: 16px; }
</style>
