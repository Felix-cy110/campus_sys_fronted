<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { FolderOpened, Delete, Plus } from '@element-plus/icons-vue'
import { batchRegisterVirtualUsers, batchUploadAvatars, getAllSchools } from '@/api'
import { uploadImage } from '@/api/post'

const activeTab = ref<'smart' | 'manual' | 'avatar'>('smart')

// 学校列表
const schools = ref<any[]>([])
const loadSchools = async () => {
  try {
    const res = await getAllSchools()
    schools.value = res.data || []
  } catch (error) {
    console.error('加载学校列表失败:', error)
  }
}
loadSchools()

// ========== 智能生成 ==========
const smartCampusId = ref<number | undefined>(undefined)
const smartCount = ref<number | undefined>(undefined)
const smartStartYear = ref<number | undefined>(undefined)
const smartEndYear = ref<number | undefined>(undefined)
const smartLoading = ref(false)

const handleSmartSubmit = async () => {
  if (!smartCampusId.value) {
    ElMessage.warning('请选择目标学校')
    return
  }
  if (!smartCount.value || smartCount.value < 1) {
    ElMessage.warning('请输入有效的生成数量')
    return
  }
  if (smartCount.value > 500) {
    ElMessage.warning('单次最多生成 500 个用户')
    return
  }
  const startYear = smartStartYear.value || new Date().getFullYear()
  const endYear = smartEndYear.value || startYear

  smartLoading.value = true
  try {
    const res = await batchRegisterVirtualUsers({
      campusId: smartCampusId.value,
      count: smartCount.value,
      enrollmentYearStart: Math.min(startYear, endYear),
      enrollmentYearEnd: Math.max(startYear, endYear),
    })
    const data = res.data as any
    ElMessage.success(`批量注册成功！共创建 ${data?.successCount ?? smartCount.value} 个虚拟用户`)
  } catch (error: any) {
    ElMessage.error(error?.message || '批量注册失败')
  } finally {
    smartLoading.value = false
  }
}

const handleSmartClear = () => {
  smartCampusId.value = undefined
  smartCount.value = undefined
  smartStartYear.value = undefined
  smartEndYear.value = undefined
}

// ========== 头像批量导入 ==========
const avatarFile = ref<File | null>(null)
const avatarUploading = ref(false)
const uploadResult = ref<string[]>([])

const handleFileChange = (file: File) => {
  avatarFile.value = file
}

const handleAvatarUpload = async () => {
  if (!avatarFile.value) {
    ElMessage.warning('请先选择 ZIP 文件')
    return
  }
  avatarUploading.value = true
  try {
    const res = await batchUploadAvatars(avatarFile.value)
    const data = res.data as any
    uploadResult.value = data?.urls || []
    ElMessage.success(`头像上传成功！共 ${uploadResult.value.length} 张`)
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败')
  } finally {
    avatarUploading.value = false
  }
}

// ========== 手动生成 ==========
interface ManualUser {
  username: string
  avatarFile: File | null
  avatarPreview: string
}

const manualCampusId = ref<number | undefined>(undefined)
const manualList = ref<ManualUser[]>([{ username: '', avatarFile: null, avatarPreview: '' }])
const manualLoading = ref(false)

const addManualRow = () => {
  manualList.value.push({ username: '', avatarFile: null, avatarPreview: '' })
}

const removeManualRow = (index: number) => {
  if (manualList.value.length === 1) {
    ElMessage.warning('至少保留一条记录')
    return
  }
  const row = manualList.value[index]
  if (!row) return
  if (row.avatarPreview) URL.revokeObjectURL(row.avatarPreview)
  manualList.value.splice(index, 1)
}

const handleManualAvatarChange = (index: number, e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const row = manualList.value[index]
  if (!row) return
  if (row.avatarPreview) URL.revokeObjectURL(row.avatarPreview)
  row.avatarFile = file
  row.avatarPreview = URL.createObjectURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

const handleManualSubmit = async () => {
  if (!manualCampusId.value) {
    ElMessage.warning('请选择目标学校')
    return
  }
  const invalid = manualList.value.some((row) => !row.username.trim())
  if (invalid) {
    ElMessage.warning('用户名不能为空')
    return
  }
  const noAvatar = manualList.value.some((row) => !row.avatarFile)
  if (noAvatar) {
    ElMessage.warning('每位用户都需要上传头像')
    return
  }
  manualLoading.value = true
  try {
    const users: { nickname: string; avatarUrl: string }[] = []
    for (const row of manualList.value) {
      const res = await uploadImage(row.avatarFile!)
      users.push({ nickname: row.username.trim(), avatarUrl: res.data.url })
    }
    const { post } = await import('@/utils/request')
    const res = await post('/admin/user/manual-register', { campusId: manualCampusId.value, users })
    const data = res.data as any
    ElMessage.success(`注册成功！共创建 ${data?.createdCount ?? users.length} 个虚拟用户`)
    handleManualClear()
  } catch (error: any) {
    ElMessage.error(error?.message || '注册失败')
  } finally {
    manualLoading.value = false
  }
}

const handleManualClear = () => {
  manualList.value.forEach(row => { if (row.avatarPreview) URL.revokeObjectURL(row.avatarPreview) })
  manualList.value = [{ username: '', avatarFile: null, avatarPreview: '' }]
  manualCampusId.value = undefined
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">批量注册用户</h2>
    </div>

    <el-card shadow="never">
      <el-tabs v-model="activeTab" class="register-tabs">
        <!-- 智能生成 -->
        <el-tab-pane label="智能生成" name="smart">
          <div class="tab-desc">选择目标学校，填写生成数量和入学年份区间，系统将自动注册虚拟用户。</div>

          <div class="smart-form">
            <el-form inline>
              <el-form-item label="目标学校" required>
                <el-select
                  v-model="smartCampusId"
                  placeholder="请选择学校"
                  clearable
                  style="width: 220px"
                >
                  <el-option
                    v-for="school in schools"
                    :key="school.id"
                    :label="`${school.name} (ID: ${school.id})`"
                    :value="school.id"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="生成数量" required>
                <el-input-number
                  v-model="smartCount"
                  :min="1"
                  :max="500"
                  placeholder="请输入数量"
                  style="width: 160px"
                  controls-position="right"
                />
              </el-form-item>
              <el-form-item label="入学年份区间">
                <el-input-number
                  v-model="smartStartYear"
                  :min="2000"
                  :max="2100"
                  placeholder="起始年份"
                  style="width: 130px"
                  controls-position="right"
                />
                <span style="margin: 0 8px">至</span>
                <el-input-number
                  v-model="smartEndYear"
                  :min="2000"
                  :max="2100"
                  placeholder="结束年份"
                  style="width: 130px"
                  controls-position="right"
                />
              </el-form-item>
            </el-form>
            <el-form label-width="100px">
              <el-form-item>
                <el-button type="primary" :loading="smartLoading" @click="handleSmartSubmit">
                  确认注册
                </el-button>
                <el-button @click="handleSmartClear">清空</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 头像批量导入 -->
        <el-tab-pane label="头像批量导入" name="avatar">
          <div class="tab-desc">将所有头像图片（.png 格式）打包成 .zip 文件上传，系统将自动导入为可用头像。</div>

          <el-form label-width="80px">
            <el-form-item label="选择文件">
              <el-upload
                :auto-upload="false"
                accept=".zip"
                :limit="1"
                :on-change="(file: any) => handleFileChange(file.raw)"
              >
                <el-button type="primary">
                  <el-icon style="margin-right: 6px"><FolderOpened /></el-icon>
                  选择 ZIP 文件
                </el-button>
                <template #tip>
                  <span class="form-tip">仅支持 .zip 格式，内含 .png 头像图片</span>
                </template>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button
                type="success"
                :loading="avatarUploading"
                :disabled="!avatarFile"
                @click="handleAvatarUpload"
              >
                开始上传
              </el-button>
            </el-form-item>
          </el-form>

          <div v-if="uploadResult.length > 0" class="upload-result">
            <div class="result-header">
              <span class="result-count">上传成功 {{ uploadResult.length }} 张头像</span>
            </div>
            <div class="url-list">
              <div v-for="(url, idx) in uploadResult" :key="idx" class="url-item">
                {{ url }}
              </div>
            </div>
          </div>
        </el-tab-pane>

        <!-- 手动生成 -->
        <el-tab-pane label="手动生成" name="manual">
          <div class="tab-desc">手动输入每位虚拟用户的昵称并上传头像，提交后系统将注册为本校虚拟用户。</div>

          <el-form inline style="margin-bottom: 16px">
            <el-form-item label="目标学校" required>
              <el-select v-model="manualCampusId" placeholder="请选择学校" clearable style="width: 220px">
                <el-option
                  v-for="school in schools"
                  :key="school.id"
                  :label="`${school.name} (ID: ${school.id})`"
                  :value="school.id"
                />
              </el-select>
            </el-form-item>
          </el-form>

          <el-table :data="manualList" stripe style="width: 100%">
            <el-table-column type="index" label="序号" width="70" />
            <el-table-column label="头像" width="100">
              <template #default="{ row, $index }">
                <div class="avatar-cell">
                  <el-avatar v-if="row.avatarPreview" :src="row.avatarPreview" :size="40" />
                  <label class="avatar-upload-btn">
                    <el-icon><Plus /></el-icon>
                    <input type="file" accept="image/*" @change="handleManualAvatarChange($index, $event)" />
                  </label>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="昵称 *" min-width="200">
              <template #default="{ row }">
                <el-input v-model="row.username" placeholder="请输入昵称" clearable />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" fixed="right">
              <template #default="{ $index }">
                <el-button link type="danger" :icon="Delete" @click="removeManualRow($index)" />
              </template>
            </el-table-column>
          </el-table>

          <div class="manual-actions">
            <el-button :icon="Plus" @click="addManualRow">添加一行</el-button>
            <div class="manual-actions-right">
              <el-button @click="handleManualClear">清空</el-button>
              <el-button type="primary" :loading="manualLoading" @click="handleManualSubmit">确认注册</el-button>
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style lang="scss" scoped>
.page-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.register-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 20px;
  }
}

.tab-desc {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
  padding: 10px 14px;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  border-left: 3px solid var(--el-color-primary);
}

.smart-form {
  margin-bottom: 16px;
}

.form-tip {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  margin-top: 4px;
}

.upload-result {
  margin-top: 16px;
}

.result-header {
  margin-bottom: 8px;
}

.result-count {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.url-list {
  max-height: 200px;
  overflow-y: auto;
  background: var(--el-fill-color-light);
  border-radius: 6px;
  padding: 10px;
}

.url-item {
  font-size: 12px;
  color: var(--el-text-color-regular);
  word-break: break-all;
  padding: 2px 0;
}

.empty-placeholder {
  padding: 40px 0;
}

.manual-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16px;
}

.manual-actions-right {
  display: flex;
  gap: 8px;
}

.avatar-cell {
  display: flex;
  align-items: center;
  gap: 6px;
}

.avatar-upload-btn {
  width: 28px;
  height: 28px;
  border: 1px dashed var(--el-border-color);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
  &:hover { border-color: var(--el-color-primary); color: var(--el-color-primary); }
  input { display: none; }
}
</style>
