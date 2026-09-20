<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTable } from '@/composables'
import { getSchoolList, addSchool, updateSchool, deleteSchool } from '@/api'

const {
  loading,
  data,
  total,
  pageNum,
  pageSize,
  fetchData,
  handlePageChange,
  handleSizeChange,
} = useTable(getSchoolList, { getParams: () => searchParams.value })

const dialog = ref({ visible: false, id: 0, name: '', code: '', province: '', city: '', logo: '' })
const searchParams = ref({ keyword: '', province: '', city: '' })

const openAddDialog = () => {
  dialog.value = { visible: true, id: 0, name: '', code: '', province: '', city: '', logo: '' }
}

const openEditDialog = (row: any) => {
  dialog.value = { visible: true, id: row.id, name: row.name, code: row.code || '', province: row.province, city: row.city, logo: row.logoUrl }
}

const submitDialog = async () => {
  if (!dialog.value.name.trim()) {
    ElMessage.warning('请输入学校名称')
    return
  }
  if (!dialog.value.code.trim()) {
    ElMessage.warning('请输入学校编码')
    return
  }
  try {
    if (dialog.value.id) {
      await updateSchool(dialog.value.id, {
      name: dialog.value.name,
      code: dialog.value.code,
      province: dialog.value.province,
      city: dialog.value.city,
      logoUrl: dialog.value.logo,
    })
    } else {
      await addSchool({
      name: dialog.value.name,
      code: dialog.value.code,
      province: dialog.value.province,
      city: dialog.value.city,
      logoUrl: dialog.value.logo,
    })
    }
    ElMessage.success('操作成功')
    dialog.value.visible = false
    handleSearch()
  } catch (error) {}
}

const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该学校吗？', '提示', { type: 'warning' })
    await deleteSchool(row.id)
    ElMessage.success('删除成功')
    handleSearch()
  } catch (error) {}
}

const handleSearch = () => {
  pageNum.value = 1
  fetchData(searchParams.value)
}

fetchData(searchParams.value)
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">学校管理</h2>
      <el-button type="primary" @click="openAddDialog">添加学校</el-button>
    </div>

    <el-card class="search-card" shadow="never">
      <el-form :inline="true" :model="searchParams">
        <el-form-item label="关键词">
          <el-input v-model="searchParams.keyword" placeholder="请输入学校名称" clearable />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="searchParams.province" placeholder="请输入省份" clearable />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="searchParams.city" placeholder="请输入城市" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="() => { searchParams = { keyword: '', province: '', city: '' }; handleSearch() }">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never">
      <el-table v-loading="loading" :data="data" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="Logo" width="80">
          <template #default="{ row }"><el-avatar :src="row.logoUrl" /></template>
        </el-table-column>
        <el-table-column prop="name" label="学校名称" min-width="160" />
        <el-table-column prop="code" label="学校编码" width="120" />
        <el-table-column prop="province" label="省份" width="120" />
        <el-table-column prop="city" label="城市" width="120" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination :current-page="pageNum" :page-size="pageSize" :total="total" layout="total, sizes, prev, pager, next, jumper" @current-change="handlePageChange" @size-change="handleSizeChange" />
      </div>
    </el-card>

    <el-dialog v-model="dialog.visible" :title="dialog.id ? '编辑学校' : '添加学校'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="学校名称">
          <el-input v-model="dialog.name" placeholder="请输入学校名称" />
        </el-form-item>
        <el-form-item label="学校编码">
          <el-input v-model="dialog.code" placeholder="请输入学校编码" />
        </el-form-item>
        <el-form-item label="省份">
          <el-input v-model="dialog.province" placeholder="请输入省份" />
        </el-form-item>
        <el-form-item label="城市">
          <el-input v-model="dialog.city" placeholder="请输入城市" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" @click="submitDialog">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.search-card { margin-bottom: 20px; }
.pagination-container { display: flex; justify-content: flex-end; margin-top: 20px; }
</style>
