<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { assignAdminPermissions, getAdminPermissions, getAdminList } from '@/api'
import type { AdminPermissionCode } from '@/types'

const loading = ref(false)
const list = ref<any[]>([])
const pageNum = ref(1)
const pageSize = ref(10)
const total = ref(0)

const permissionDialogVisible = ref(false)
const assigningLoading = ref(false)
const assigningRow = ref<any>(null)
const assigningCodes = ref<AdminPermissionCode[]>([])

const permissionOptions: { label: string; value: AdminPermissionCode }[] = [
  { label: '广告投放终审与增删改', value: 'AD_PUBLISH_AUDIT' },
  { label: '商家绑定终审', value: 'SHOP_BINDING_AUDIT_FINAL' },
  { label: '管理员账号管理', value: 'ADMIN_ACCOUNT_MANAGE' },
  { label: '评价审核', value: 'REVIEW_AUDIT' },
  { label: '评论审核', value: 'COMMENT_AUDIT' },
  { label: '举报处理', value: 'REPORT_AUDIT' },
  { label: '校园专题管理', value: 'TOPIC_CAMPAIGN_MANAGE' },
  { label: '专题帖子运营', value: 'TOPIC_POST_MANAGE' },
  { label: '学生认证审核', value: 'CERTIFICATION_AUDIT' },
  { label: '敏感词管理', value: 'SENSITIVE_WORD_MANAGE' },
  { label: '学校管理', value: 'SCHOOL_MANAGE' },
  { label: '校区/生活区管理', value: 'LOCATION_MANAGE' },
  { label: '计算任务管理', value: 'CALCULATION_MANAGE' },
  { label: '徽章管理', value: 'BADGE_MANAGE' },
]

const loadAdmins = async () => {
  loading.value = true
  try {
    const res = await getAdminList({
      page: pageNum.value,
      size: pageSize.value,
      role: 2,
    })
    list.value = res.data?.list || []
    total.value = Number(res.data?.total || 0)
  } catch (error: any) {
    ElMessage.error(error?.message || '加载校级管理员列表失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (val: number) => {
  pageNum.value = val
  loadAdmins()
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  pageNum.value = 1
  loadAdmins()
}

const openAssignDialog = async (row: any) => {
  permissionDialogVisible.value = true
  assigningRow.value = row
  assigningLoading.value = true
  try {
    const res = await getAdminPermissions(row.id)
    assigningCodes.value = Array.isArray(res.data) ? res.data : []
  } catch (error: any) {
    ElMessage.error(error?.message || '加载校级管理员权限失败')
    permissionDialogVisible.value = false
  } finally {
    assigningLoading.value = false
  }
}

const submitAssign = async () => {
  if (!assigningRow.value?.id) return
  assigningLoading.value = true
  try {
    await assignAdminPermissions(assigningRow.value.id, assigningCodes.value)
    ElMessage.success('权限配置成功')
    permissionDialogVisible.value = false
  } catch (error: any) {
    ElMessage.error(error?.message || '权限配置失败')
  } finally {
    assigningLoading.value = false
  }
}

loadAdmins()
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">校级管理员权限</h2>
      <div class="page-subtitle">仅超级管理员可配置校级管理员能力点</div>
    </div>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="list" stripe>
        <el-table-column prop="id" label="校级管理员ID" width="120" />
        <el-table-column prop="nickname" label="昵称" min-width="140" />
        <el-table-column prop="schoolId" label="学校ID" width="120">
          <template #default="{ row }">{{ row.schoolId || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="Number(row.status) === 1 ? 'success' : 'danger'">
              {{ Number(row.status) === 1 ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openAssignDialog(row)">配置权限</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
          :current-page="pageNum"
          :page-size="pageSize"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handleSizeChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="permissionDialogVisible" title="配置校级管理员权限" width="520px" :close-on-click-modal="false">
      <el-skeleton :rows="4" animated v-if="assigningLoading" />
      <template v-else>
        <div style="margin-bottom: 12px; color: var(--el-text-color-regular)">
          目标校级管理员：{{ assigningRow?.nickname || '-' }}（ID: {{ assigningRow?.id || '-' }}）
        </div>
        <el-checkbox-group v-model="assigningCodes">
          <el-checkbox v-for="item in permissionOptions" :key="item.value" :value="item.value">
            {{ item.label }}
          </el-checkbox>
        </el-checkbox-group>
      </template>
      <template #footer>
        <el-button @click="permissionDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="assigningLoading" @click="submitAssign">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}

.page-subtitle {
  color: var(--el-text-color-regular);
  font-size: 14px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}
</style>
