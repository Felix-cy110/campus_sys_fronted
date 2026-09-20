<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Delete } from '@element-plus/icons-vue'
import { uploadImage, batchVirtualPublishPost } from '@/api/post'

interface PostItem {
  title: string
  content: string
  images: File[]
  previewUrls: string[]
}

const createPost = (): PostItem => ({ title: '', content: '', images: [], previewUrls: [] })

const posts = ref<PostItem[]>([createPost()])
const generating = ref(false)

const addPost = () => posts.value.push(createPost())

const removePost = (index: number) => {
  if (posts.value.length === 1) {
    ElMessage.warning('至少保留一条帖子')
    return
  }
  posts.value.splice(index, 1)
}

const handleImageChange = (index: number, e: Event) => {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  const post = posts.value[index]
  if (!post) return
  post.images.push(...files)
  files.forEach(f => post.previewUrls.push(URL.createObjectURL(f)))
  ;(e.target as HTMLInputElement).value = ''
}

const removeImage = (postIndex: number, imgIndex: number) => {
  const post = posts.value[postIndex]
  if (!post || imgIndex < 0 || imgIndex >= post.images.length) return
  const previewUrl = post.previewUrls[imgIndex]
  if (previewUrl) URL.revokeObjectURL(previewUrl)
  post.images.splice(imgIndex, 1)
  post.previewUrls.splice(imgIndex, 1)
}

const handleGenerate = async () => {
  const invalid = posts.value.some(p => !p.title.trim() || !p.content.trim())
  if (invalid) {
    ElMessage.warning('标题和正文不能为空')
    return
  }
  generating.value = true
  try {
    // 先为每个帖子批量上传图片，收集 URL
    const postDataList: { title: string; content: string; contact?: string; imageUrls: string[] }[] = []
    for (const post of posts.value) {
      const imageUrls: string[] = []
      for (const file of post.images) {
        const res = await uploadImage(file)
        if (res.data?.url) imageUrls.push(res.data.url)
      }
      postDataList.push({
        title: post.title,
        content: post.content,
        imageUrls,
      })
    }
    // 一次性批量发送
    const res = await batchVirtualPublishPost({ posts: postDataList })
    const { successCount, failCount, results } = res.data
    // 逐条展示失败信息
    if (results) {
      for (const r of results) {
        if (!r.success) {
          ElMessage.error(`「${r.title}」发布失败：${r.errorMsg || '未知错误'}`)
        }
      }
    }
    if (successCount > 0) {
      ElMessage.success(`成功生成 ${successCount} 条帖子${failCount > 0 ? `，${failCount} 条失败` : ''}`)
      posts.value = [createPost()]
    } else {
      ElMessage.error('所有帖子生成失败')
    }
  } catch (e: any) {
    ElMessage.error(`批量生成失败：${e?.message || '未知错误'}`)
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">帖子批量生成</h2>
    </div>

    <div class="post-list">
      <el-card
        v-for="(post, index) in posts"
        :key="index"
        shadow="never"
        class="post-card"
      >
        <div class="card-title">
          <span class="card-index">帖子 {{ index + 1 }}</span>
          <el-button link type="danger" :icon="Delete" @click="removePost(index)">删除</el-button>
        </div>

        <el-form label-position="top">
          <el-form-item label="标题">
            <el-input v-model="post.title" placeholder="请输入帖子标题" clearable />
          </el-form-item>

          <el-form-item label="正文">
            <el-input
              v-model="post.content"
              type="textarea"
              :rows="4"
              placeholder="请输入帖子正文"
            />
          </el-form-item>

          <el-form-item label="图片">
            <div class="image-area">
              <div
                v-for="(url, imgIndex) in post.previewUrls"
                :key="imgIndex"
                class="image-thumb"
              >
                <img :src="url" />
                <span class="image-remove" @click="removeImage(index, imgIndex)">×</span>
              </div>
              <label class="image-add">
                <el-icon><Plus /></el-icon>
                <input type="file" accept="image/*" multiple @change="handleImageChange(index, $event)" />
              </label>
            </div>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <div class="actions">
      <el-button :icon="Plus" @click="addPost">添加帖子</el-button>
      <el-button type="primary" size="large" :loading="generating" @click="handleGenerate">一键生成</el-button>
    </div>
  </div>
</template>

<style scoped>
.page-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-card {
  border-radius: 8px;
}

.card-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-index {
  font-weight: 600;
  font-size: 15px;
}

.image-area {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.image-thumb {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
}

.image-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: 2px;
  right: 4px;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  text-shadow: 0 0 3px rgba(0,0,0,0.6);
  line-height: 1;
}

.image-add {
  width: 80px;
  height: 80px;
  border-radius: 6px;
  border: 1px dashed var(--el-border-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 22px;
  color: var(--el-text-color-secondary);
  transition: border-color 0.2s;
}

.image-add:hover {
  border-color: var(--el-color-primary);
  color: var(--el-color-primary);
}

.image-add input {
  display: none;
}

.actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
}
</style>
