# CampusX 管理后台

基于 **Vue 3 + TypeScript + Vite** 构建的校园综合管理后台，配套 CampusSys 后端服务。

自动构建和手动部署配置见 [CI/CD 使用说明](CICD.md)。

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 框架 | Vue 3.5 | Composition API + `<script setup>` |
| 语言 | TypeScript 5.9 | 类型安全 |
| 构建 | Vite 7 | 极速 HMR |
| UI 组件 | Element Plus 2.13 | 自动按需导入（unplugin） |
| 状态管理 | Pinia 3 | 模块化 stores |
| 路由 | Vue Router 5 | 动态路由 + 权限守卫 |
| HTTP | Axios | 统一拦截器 |
| 图表 | ECharts 6 | 数据可视化 |
| 样式 | SCSS | 全局 + 组件样式 |

## 功能模块

| 模块 | 路由 | 说明 |
|------|------|------|
| 📊 数据看板 | `/statistics` | 运营数据概览 |
| 👤 用户管理 | `/user/*` | 用户列表、校级管理员、批量注册、学校/专业变更申请、退款记录、院系专业管理 |
| 🏪 店铺管理 | `/shop/*` | 店铺列表及审核 |
| ✍️ 评价管理 | `/review/*` | 评价列表、审核、新增教师、课程申请审核 |
| 💬 评论管理 | `/comment/*` | 评论审核、批量生成 |
| 📄 帖子管理 | `/post/*` | 帖子列表、批量生成 |
| ⚖️ 纠纷处理 | `/dispute/*` | 纠纷列表、聊天室 |
| 🚨 举报治理 | `/governance/*` | 举报中心、处罚记录 |
| 📢 校园专题 | `/topic/*` | 专题管理、帖子运营 |
| 🎯 限时活动 | `/activity/*` | 图书预售、邀请有奖 |
| 🤖 AI 助手 | `/ai/*` | AI 辅助功能 |
| ⚙️ 系统配置 | `/system/*` | 系统设置、权限管理、敏感词、计算规则等 |
| 🏷️ 商家管理 | `/merchant/*` | 商家绑定审核 |
| 🏅 徽章管理 | `/badge/*` | 徽章定义、发放管理 |
| 📣 广告管理 | `/advertisement/*` | 广告发布审核 |

## 权限体系

项目内置两级管理员权限：

- **超级管理员**（`role === 1`）：拥有全部功能访问权，可跨学校筛选数据
- **校级管理员**（`role === 2`）：仅允许访问本校数据，权限范围受限

路由层面通过 Vue Router 的 `meta` 元信息进行精细化控制：

- `permissionCodes` — 所需权限码列表
- `requireSuperAdmin` — 仅超级管理员可访问
- `requireCampusAdmin` — 仅校级管理员可访问
- `requiresAuth` — 需要登录态（默认 `true`）

未登录用户会被重定向到登录页，无权限用户会被重定向到首页。

## 快速开始

### 环境要求

- Node.js >= 22.12（CI 使用 Node.js 22）
- pnpm（推荐）或 npm

### 安装与启动

```bash
# 安装依赖
pnpm install

# 启动开发服务器（默认端口 3002）
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

### 环境变量

开发前可复制 `.env.example` 为 `.env` 并按需修改：

```bash
cp .env.example .env
```

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `VITE_BACKEND_PREFIX` | API、图片和下载资源共用的后端前缀；支持 HTTPS 地址或 `/backend` 这类同源路径 | 空（本地走 Vite 代理） |
| `CB_MANAGE_LOCAL_PORT` | 本地开发端口 | `36664` |

### 代理配置

开发服务器会将 `/api` 和 `/images` 前缀的请求代理到 `http://localhost:5659`。线上环境只需在构建前设置一次统一前缀，例如：

```bash
VITE_BACKEND_PREFIX=https://api.example.com pnpm build
```

也可以通过网关把后端统一挂在管理端域名的 `/backend` 下，然后设置 `VITE_BACKEND_PREFIX=/backend`，避免跨域。接口请求、学校申诉图片及其他通过 `resolveBackendUrl()` 处理的后端资源会一起切换，无需分别修改地址。

## 目录结构

```
CampusX-fronted/
├── index.html                  # 入口 HTML
├── vite.config.ts              # Vite 配置（路径别名、代理、自动导入）
├── tsconfig.json               # TypeScript 配置
├── .env.example                # 环境变量示例
├── public/                     # 静态资源
└── src/
    ├── main.ts                 # 应用入口（注册 Element Plus / Pinia / Router）
    ├── App.vue                 # 根组件
    ├── api/                    # 接口函数（按模块拆分）
    │   ├── index.ts            # 统一导出
    │   ├── auth.ts             # 认证模块
    │   ├── user.ts             # 用户模块
    │   ├── shop.ts             # 店铺模块
    │   ├── review.ts           # 评价模块
    │   ├── comment.ts          # 评论模块
    │   ├── post.ts             # 帖子模块
    │   ├── dispute.ts          # 纠纷模块
    │   ├── governance.ts       # 举报治理模块
    │   ├── topic.ts            # 专题模块
    │   ├── activity.ts         # 活动模块
    │   ├── statistics.ts       # 统计模块
    │   ├── advertisement.ts    # 广告模块
    │   ├── badge.ts            # 徽章模块
    │   ├── department.ts       # 院系专业模块
    │   ├── location.ts         # 位置模块
    │   ├── school.ts           # 学校模块
    │   ├── calculation.ts      # 计算规则模块
    │   ├── password-reset.ts   # 密码重置模块
    │   └── sensitive-word.ts   # 敏感词模块
    ├── views/                  # 页面组件
    │   ├── layout/             # 布局组件（AdminLayout）
    │   ├── login/              # 登录页
    │   ├── statistics/         # 数据看板
    │   ├── user/               # 用户管理
    │   ├── shop/               # 店铺管理
    │   ├── review/             # 评价管理
    │   ├── comment/            # 评论管理
    │   ├── post/               # 帖子管理
    │   ├── dispute/            # 纠纷处理
    │   ├── governance/         # 举报治理
    │   ├── topic/              # 校园专题
    │   ├── activity/           # 限时活动
    │   ├── ai/                 # AI 助手
    │   ├── system/             # 系统配置
    │   ├── merchant/           # 商家管理
    │   ├── badge/              # 徽章管理
    │   └── advertisement/      # 广告管理
    ├── components/             # 公共组件
    ├── stores/                 # Pinia 状态管理
    │   ├── index.ts            # Pinia 实例
    │   ├── user.ts             # 用户状态（登录态、权限码）
    │   ├── schoolFilter.ts     # 学校筛选状态
    │   └── config.ts           # 应用配置
    ├── composables/            # 组合式函数（useTable 等）
    ├── router/                 # Vue Router 配置
    │   └── index.ts            # 路由表 + 权限守卫
    ├── utils/                  # 工具函数
    │   └── request.ts          # Axios 封装（拦截器、错误处理）
    ├── types/                  # TypeScript 类型定义
    └── styles/                 # 全局 SCSS 样式
```

## 核心约定

### API 请求

- 所有 API 函数在 `src/api/` 下按模块分文件，统一从 `src/api/index.ts` 导出
- 接口路径不含 `/api/v1` 前缀，由 `backend-url.ts` 和 `request.ts` 统一添加
- 请求工具提供 `get / post / put / del` 四个方法

### 学校筛选

所有列表/数据页面需遵循学校筛选权限约定：

```typescript
import { useSchoolFilterStore } from '@/stores'
const schoolFilterStore = useSchoolFilterStore()

// 请求中传入 campusIds
const params: any = { page: page.value, size: size.value }
if (schoolFilterStore.selectedSchoolIds.length > 0) {
  params.campusIds = schoolFilterStore.selectedSchoolIds
}

// 监听筛选变化自动刷新
watch(() => schoolFilterStore.selectedSchoolIds, fetchData, { deep: true })
```

- 超级管理员：顶部显示多选学校筛选框，可选任意学校
- 校级管理员：不显示筛选框，自动固定为本校数据

### 页面标题

路由 meta 中的 `title` 自动拼接为 `{title} - CampusX 管理后台` 格式作为浏览器标签页标题。
