<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, VideoPlay, VideoPause, Edit } from '@element-plus/icons-vue'
import dayjs from 'dayjs'
import type { InviteRewardActivity, RewardTier, InviteeRecord } from '@/api/activity'
import {
  getInviteRewardActivities,
  createInviteRewardActivity,
  updateInviteRewardActivity,
  closeActivity,
  drawActivity,
  getRewardTiers,
  createRewardTier,
  updateRewardTier,
  deleteRewardTier,
  assignWinningCode,
  getInviteeRecords,
} from '@/api/activity'

const loading = ref(false)
const activity = ref<InviteRewardActivity | null>(null)
const selectedActivityId = ref<number | null>(null)
const activities = ref<InviteRewardActivity[]>([])
const tiers = ref<RewardTier[]>([])
const inviteeRecords = ref<InviteeRecord[]>([])
const totalInviteeRecords = ref(0)

const inviteePage = ref({ pageNum: 1, pageSize: 10 })

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getInviteRewardActivities()
    activities.value = res.data.list || []
    if (activities.value.length > 0) {
      const nextActivity = activities.value.find((a) => a.id === selectedActivityId.value)
        || activities.value.find((a) => a.status === 0)
        || activities.value[0]!
      activity.value = nextActivity
      selectedActivityId.value = nextActivity.id
      fetchTiers()
      fetchInviteeRecords()
    } else if (activities.value.length === 0) {
      activity.value = null
      selectedActivityId.value = null
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => { fetchActivities() })

const fetchTiers = async () => {
  if (!activity.value) return
  const res = await getRewardTiers(activity.value.id)
  tiers.value = res.data.list || []
}

const fetchInviteeRecords = async () => {
  if (!activity.value) return
  const res = await getInviteeRecords({ activityId: activity.value.id, ...inviteePage.value })
  inviteeRecords.value = res.data.list || []
  totalInviteeRecords.value = res.data.total || 0
}

const handleActivityChange = (id: number) => {
  activity.value = activities.value.find((a) => a.id === id) || null
  inviteePage.value.pageNum = 1
  fetchTiers()
  fetchInviteeRecords()
}

const getStatusType = (status: number) => ({ 0: 'success', 1: 'info', 2: 'warning' }[status] ?? 'info')
const getStatusText = (status: number) => ({ 0: '进行中', 1: '已开奖', 2: '已关闭' }[status] ?? '未知')

const formatTime = (t: string | number) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'

// 后端无 rewardBudget，隐藏统计卡片中金额相关字段
const canDraw = computed(() => activity.value?.status === 0)
const canClose = computed(() => activity.value?.status === 0)
const canEditTiers = computed(() => activity.value?.status === 0)

const handleDraw = async () => {
  try {
    await ElMessageBox.confirm('确定宣布开奖吗？开奖后获奖号码将对用户公开，活动结束。', '宣布开奖', { type: 'warning' })
    await drawActivity(activity.value!.id)
    ElMessage.success('开奖成功')
    fetchActivities()
  } catch {}
}

const handleClose = async () => {
  try {
    await ElMessageBox.confirm('确定提前关闭活动吗？关闭后活动终止且不开奖。', '提前关闭', { type: 'warning' })
    await closeActivity(activity.value!.id)
    ElMessage.success('活动已关闭')
    fetchActivities()
  } catch {}
}

// 新建活动
const createDialogVisible = ref(false)
const createForm = ref({ name: '', description: '', startTime: '', endTime: '', coverImage: '', prizes: [{ level: '特等奖', description: '', sort: 1 }] })
const createFormRef = ref()
const createRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const handleCreateSubmit = async () => {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await createInviteRewardActivity({
      name: createForm.value.name,
      description: createForm.value.description,
      startTime: createForm.value.startTime,
      endTime: createForm.value.endTime,
      coverImage: createForm.value.coverImage,
      prizes: createForm.value.prizes,
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    activity.value = null
    await fetchActivities()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  }
}

// 编辑活动（仅编辑基本信息，奖品通过奖品表单管理）
const editDialogVisible = ref(false)
const editForm = ref({ name: '', description: '', startTime: '', endTime: '', coverImage: '' })
const uploadLoading = ref(false)
const editFormRef = ref()

const editRules = {
  name: [{ required: true, message: '请输入活动名称', trigger: 'blur' }],
  startTime: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  endTime: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
}

const handleUpload = async (file: File) => {
  uploadLoading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    const res = await import('@/utils/request').then(m => m.post<any>('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } }))
    editForm.value.coverImage = res.data?.url || res.data
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploadLoading.value = false
  }
  return false
}

const handleEdit = () => {
  if (activity.value) {
    editForm.value = {
      name: activity.value.name,
      description: activity.value.description,
      startTime: activity.value.startTime,
      endTime: activity.value.endTime,
      coverImage: activity.value.coverImage || '',
    }
  }
  editDialogVisible.value = true
}

const handleEditSubmit = async () => {
  const valid = await editFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    await updateInviteRewardActivity(activity.value!.id, {
      name: editForm.value.name,
      description: editForm.value.description,
      startTime: editForm.value.startTime,
      endTime: editForm.value.endTime,
      coverImage: editForm.value.coverImage,
      prizes: tiers.value.map(t => ({ level: t.level, description: t.description, sort: t.sort })),
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    fetchActivities()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  }
}

// 奖品管理
const tierDialogVisible = ref(false)
const tierDialogTitle = ref('')
const tierForm = ref<{ id?: number; level: string; description: string; sort: number; quantity: number }>({
  id: undefined, level: '', description: '', sort: 1, quantity: 1,
})
const tierRules = {
  level: [{ required: true, message: '请输入奖项名称', trigger: 'blur' }],
  quantity: [{ required: true, message: '请输入数量', trigger: 'blur' }],
}
const tierFormRef = ref()

const handleAddTier = () => {
  tierDialogTitle.value = '添加奖品'
  tierForm.value = { id: undefined, level: '', description: '', sort: tiers.value.length + 1, quantity: 1 }
  tierDialogVisible.value = true
}

const handleEditTier = (row: RewardTier) => {
  tierDialogTitle.value = '编辑奖品'
  tierForm.value = { id: row.id, level: row.level, description: row.description, sort: row.sort, quantity: row.quantity || 1 }
  tierDialogVisible.value = true
}

// 指定获奖号码
const assignCodeDialogVisible = ref(false)
const assignCodePrizeId = ref<number>(0)
const assignCodeValues = ref<string[]>([''])

const handleAssignCode = (row: RewardTier) => {
  assignCodePrizeId.value = row.id
  assignCodeValues.value = (row.winningCodes && row.winningCodes.length > 0) ? [...row.winningCodes] : ['']
  assignCodeDialogVisible.value = true
}

const handleAssignCodeSubmit = async () => {
  const codes = assignCodeValues.value.map(c => c.trim()).filter(Boolean)
  if (codes.length === 0) {
    ElMessage.warning('请至少输入一个获奖号码')
    return
  }
  try {
    await assignWinningCode(assignCodePrizeId.value, codes)
    ElMessage.success('获奖号码已设置')
    assignCodeDialogVisible.value = false
    fetchTiers()
  } catch (e: any) {
    ElMessage.error(e?.message || '设置失败')
  }
}

const handleDeleteTier = async (row: RewardTier) => {  try {
    await ElMessageBox.confirm('确定删除该奖品吗？', '删除确认', { type: 'warning' })
    await deleteRewardTier(row.id)
    ElMessage.success('删除成功')
    fetchTiers()
  } catch {}
}

const handleTierSubmit = async () => {
  const valid = await tierFormRef.value?.validate().catch(() => false)
  if (!valid) return
  try {
    if (tierForm.value.id) {
      await updateRewardTier(tierForm.value.id, { level: tierForm.value.level, description: tierForm.value.description, sort: tierForm.value.sort, quantity: tierForm.value.quantity })
      ElMessage.success('更新成功')
    } else {
      await createRewardTier(activity.value!.id, { level: tierForm.value.level, description: tierForm.value.description, sort: tierForm.value.sort, quantity: tierForm.value.quantity })
      ElMessage.success('添加成功')
    }
    tierDialogVisible.value = false
    fetchTiers()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const handleInviteePageChange = (page: number) => { inviteePage.value.pageNum = page; fetchInviteeRecords() }
const handleInviteeSizeChange = (size: number) => { inviteePage.value.pageSize = size; inviteePage.value.pageNum = 1; fetchInviteeRecords() }

const sourceText = (s: number) => ({ 1: '付费发帖', 2: '交易达标', 3: '邀请奖励' }[s] ?? '未知')
</script>

<template>
  <div class="invite-reward-container">
    <div style="display:flex;justify-content:flex-end;margin-bottom:12px">
      <el-button type="primary" :icon="Plus" @click="createDialogVisible = true">新建活动</el-button>
    </div>

    <el-empty v-if="!loading && activities.length === 0" description="暂无抽奖活动，点击右上角新建" style="padding:60px 0" />

    <el-card v-if="activities.length > 0" v-loading="loading" class="activity-selector">
      <el-select
        v-model="selectedActivityId"
        :disabled="!activity"
        filterable
        placeholder="选择或搜索活动"
        style="width: 300px"
        @change="handleActivityChange"
      >
        <el-option v-for="act in activities" :key="act.id" :label="act.name" :value="act.id" />
      </el-select>
    </el-card>

    <el-card v-if="activity" v-loading="loading" class="status-card">
      <div class="status-header">
        <div class="status-info">
          <h2 class="activity-name">{{ activity.name }}</h2>
          <el-tag :type="getStatusType(activity.status)" size="large">{{ getStatusText(activity.status) }}</el-tag>
        </div>
        <div class="status-actions">
          <el-button v-if="canDraw" type="success" :icon="VideoPlay" size="large" @click="handleDraw">宣布开奖</el-button>
          <el-button v-if="canClose" type="warning" :icon="VideoPause" size="large" @click="handleClose">提前关闭</el-button>
          <el-button type="primary" :icon="Edit" size="large" @click="handleEdit">编辑活动</el-button>
        </div>
      </div>
      <div class="time-info">
        <div class="time-item"><span class="label">开始时间：</span><span class="value">{{ formatTime(activity.startTime) }}</span></div>
        <div class="time-item"><span class="label">结束时间：</span><span class="value">{{ formatTime(activity.endTime) }}</span></div>
        <div class="time-item"><span class="label">活动描述：</span><span class="value">{{ activity.description || '暂无描述' }}</span></div>
      </div>
    </el-card>

    <el-card v-if="activity" class="tiers-card">
      <template #header>
        <div class="card-header">
          <span>奖品列表</span>
          <el-button type="primary" :icon="Plus" @click="handleAddTier" :disabled="!canEditTiers">添加奖品</el-button>
        </div>
      </template>
      <el-table :data="tiers" stripe v-loading="loading">
        <el-table-column label="数量" width="80">
          <template #default="{ row }">{{ row.quantity ?? 1 }}</template>
        </el-table-column>
        <el-table-column prop="level" label="奖项名称" width="150" />
        <el-table-column prop="description" label="描述" min-width="150" />
        <el-table-column label="获奖号码" min-width="160">
          <template #default="{ row }">
            <template v-if="row.winningCodes && row.winningCodes.length > 0">
              <el-popover placement="top" :width="220" trigger="click">
                <template #reference>
                  <span class="code-highlight" style="cursor:pointer">
                    {{ row.winningCodes[0] }}
                    <span v-if="row.winningCodes.length > 1" class="code-extra">+{{ row.winningCodes.length - 1 }}</span>
                  </span>
                </template>
                <div>
                  <div v-for="code in row.winningCodes" :key="code" class="code-highlight" style="line-height:2">{{ code }}</div>
                </div>
              </el-popover>
            </template>
            <span v-else style="color:#ccc">未设置</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleAssignCode(row)">指定号码</el-button>
            <el-button type="primary" link @click="handleEditTier(row)" :disabled="!canEditTiers">编辑</el-button>
            <el-button type="danger" link @click="handleDeleteTier(row)" :disabled="!canEditTiers">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="tiers.length === 0" description="暂无奖品" />
    </el-card>

    <el-card v-if="activity" class="invitees-card">
      <template #header>
        <div class="card-header"><span>抽奖号码记录</span></div>
      </template>
      <el-table :data="inviteeRecords" stripe v-loading="loading">
        <el-table-column prop="code" label="号码" width="140" />
        <el-table-column label="持有用户" width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :src="row.avatarUrl" :size="32" />
              <span class="nickname">{{ row.nickname }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="120">
          <template #default="{ row }">{{ sourceText(row.source) }}</template>
        </el-table-column>
        <el-table-column label="获取时间" width="180">
          <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="inviteePage.pageNum"
          v-model:page-size="inviteePage.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalInviteeRecords"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handleInviteePageChange"
          @size-change="handleInviteeSizeChange"
        />
      </div>
      <el-empty v-if="inviteeRecords.length === 0" description="暂无号码记录" />
    </el-card>

    <!-- 新建活动弹窗 -->
    <el-dialog v-model="createDialogVisible" title="新建抽奖活动" width="500px" destroy-on-close>
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="createForm.startTime" type="datetime" placeholder="选择开始时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="createForm.endTime" type="datetime" placeholder="选择结束时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="初始奖品">
          <div v-for="(prize, i) in createForm.prizes" :key="i" style="display:flex;gap:8px;margin-bottom:6px">
            <el-input v-model="prize.level" placeholder="奖项名称" style="width:140px" />
            <el-input v-model="prize.description" placeholder="描述（选填）" style="flex:1" />
            <el-input-number v-model="prize.sort" :min="1" style="width:90px" controls-position="right" />
            <el-button link type="danger" @click="createForm.prizes.splice(i,1)" :disabled="createForm.prizes.length===1">删除</el-button>
          </div>
          <el-button link type="primary" @click="createForm.prizes.push({level:'',description:'',sort:createForm.prizes.length+1})">+ 添加奖品</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateSubmit">创建</el-button>
      </template>
    </el-dialog>

    <!-- 指定获奖号码弹窗 -->
    <el-dialog v-model="assignCodeDialogVisible" title="指定获奖号码" width="400px" destroy-on-close>
      <div v-for="(_, i) in assignCodeValues" :key="i" style="display:flex;gap:8px;margin-bottom:8px">
        <el-input v-model="assignCodeValues[i]" placeholder="请输入8位获奖号码" maxlength="8" />
        <el-button link type="danger" @click="assignCodeValues.splice(i,1)" :disabled="assignCodeValues.length===1">删除</el-button>
      </div>
      <el-button link type="primary" @click="assignCodeValues.push('')">+ 添加号码</el-button>
      <template #footer>
        <el-button @click="assignCodeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleAssignCodeSubmit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑活动弹窗 -->
    <el-dialog v-model="editDialogVisible" title="编辑活动" width="500px" destroy-on-close>
      <el-form ref="editFormRef" :model="editForm" :rules="editRules" label-width="100px">
        <el-form-item label="活动名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入活动名称" />
        </el-form-item>
        <el-form-item label="活动描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="请输入活动描述" />
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker v-model="editForm.startTime" type="datetime" placeholder="选择开始时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间" prop="endTime">
          <el-date-picker v-model="editForm.endTime" type="datetime" placeholder="选择结束时间" style="width:100%" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="封面图片">
          <el-upload :show-file-list="false" :before-upload="handleUpload" accept="image/*">
            <img v-if="editForm.coverImage" :src="editForm.coverImage" style="width:120px;height:80px;object-fit:cover;border-radius:4px;cursor:pointer" />
            <el-button v-else :loading="uploadLoading" size="small">点击上传</el-button>
          </el-upload>
          <el-button v-if="editForm.coverImage" link type="danger" size="small" @click="editForm.coverImage = ''" style="margin-left:8px">删除</el-button>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleEditSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 奖品弹窗 -->
    <el-dialog v-model="tierDialogVisible" :title="tierDialogTitle" width="440px" destroy-on-close>
      <el-form ref="tierFormRef" :model="tierForm" :rules="tierRules" label-width="100px">
        <el-form-item label="奖项名称" prop="level">
          <el-input v-model="tierForm.level" placeholder="如：特等奖、一等奖" />
        </el-form-item>
        <el-form-item label="数量" prop="quantity">
          <el-input-number v-model="tierForm.quantity" :min="1" style="width:100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="tierForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tierDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleTierSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.invite-reward-container {
  padding: 16px;
}

.activity-selector {
  margin-bottom: 16px;
}

.status-card {
  margin-bottom: 16px;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.activity-name {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.status-actions {
  display: flex;
  gap: 12px;
}

.time-info {
  display: flex;
  gap: 40px;
  color: #666;
  flex-wrap: wrap;
}

.time-item .label {
  color: #999;
  margin-right: 8px;
}

.stats-row {
  margin-bottom: 16px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 10px 0;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 600;
  color: #333;
}

.stat-value.price {
  color: #f56c6c;
}

.tiers-card,
.invitees-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 4px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nickname {
  font-size: 14px;
}

.price-highlight {
  color: #f56c6c;
  font-weight: 600;
}

.code-highlight {
  color: #333;
  font-weight: 600;
}

.code-extra {
  font-size: 11px;
  font-weight: 400;
  color: #bbb;
  margin-left: 2px;
}

.reward-received {
  color: #67c23a;
  font-weight: 600;
}

.pagination-wrapper {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
