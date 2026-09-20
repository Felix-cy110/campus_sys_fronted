import { get, post, put } from '@/utils/request'
import type { ApiResponse, PageResponse, PageParams, UserAdminVO } from '@/types'

export type CertificationStatusNum = 0 | 1 | 2 | 3

export interface UserListParams extends PageParams {
  keyword?: string
  campusId?: number
  isVirtual?: number
  status?: number
}

const empty = <T>(data: T): Promise<ApiResponse<T>> =>
  Promise.resolve({ code: 0, message: 'success', data, timestamp: Date.now() })

// GET /admin/user/page — 分页查询用户列表
export function getUserList(params: UserListParams) {
  return get<PageResponse<UserAdminVO>>('/admin/user/page', { params })
}

// GET /admin/user/{id} — 获取用户详情
export function getUserDetail(id: number) {
  return get<UserAdminVO>(`/admin/user/${id}`)
}

// PUT /admin/user/status — 更新用户状态（禁用/启用）
export function updateUserStatus(userId: number, status: number) {
  return put('/admin/user/status', { userId, status })
}

// 后端无此接口
export function deleteUser(_id: number) {
  return empty<null>(null)
}

// 后端无此接口
export function promoteUserToAdmin(_id: number, _schoolId?: number) {
  return empty<null>(null)
}

// 后端无此接口
export function demoteAdminToUser(_id: number) {
  return empty<null>(null)
}

export interface CertificationAdminVO {
  id: number
  userId: number
  userNickname: string
  userAvatar: string
  realName: string
  studentId: string
  studentCardUrl: string
  idCardUrl: string
  status: number
  statusDesc: string
  campusName: string
  rejectReason: string
  reviewerId: number
  reviewerName: string
  reviewedAt: string
  createdAt: string
}

// POST /admin/certification/review — 通过认证（status=1）
export function approveCertification(certificationId: number) {
  return post('/admin/certification/review', { certificationId, status: 1 })
}

// POST /admin/certification/review — 驳回认证（status=2）
export function rejectCertification(certificationId: number, rejectReason: string) {
  return post('/admin/certification/review', { certificationId, status: 2, rejectReason })
}

export interface CertificationListParams {
  page?: number
  size?: number
  status?: number
  campusId?: number
  keyword?: string
}

// GET /admin/certification/list
export function getCertificationList(params: CertificationListParams) {
  return get<PageResponse<CertificationAdminVO>>('/admin/certification/list', { params })
}

// GET /admin/page?role=... — 分页查询管理员列表
export function getAdminList(params: UserListParams & { role?: number; page?: number; size?: number }) {
  return get<PageResponse<UserAdminVO>>('/admin/page', { params })
}

export interface SchoolChangeRequest {
  appealId: number
  userId: number
  userNickname: string
  currentCampusId: number
  currentCampusName: string
  currentMajorId: number
  currentMajorName: string
  targetCampusId: number
  targetCampusName: string
  targetMajorId: number
  targetMajorName: string
  studentCardUrl: string
  idCardUrl: string
  reason?: string
  status: 0 | 1 | 2
  statusDesc: string
  appealYear: number
  reviewerId: number
  reviewerName: string
  rejectReason: string
  reviewedAt: string
  createdAt: string
}

export interface SchoolChangeListParams {
  page?: number
  size?: number
  status?: 0 | 1 | 2
}

// GET /admin/school-appeal/list — 分页查询申诉列表（后端用 page/size）
export function getSchoolChangeList(params: SchoolChangeListParams) {
  return get<PageResponse<SchoolChangeRequest>>('/admin/school-appeal/list', { params })
}

// POST /admin/school-appeal/review — 通过申诉（status=1）
export function approveSchoolChange(appealId: number) {
  return post('/admin/school-appeal/review', { appealId, status: 1 })
}

// POST /admin/school-appeal/review — 驳回申诉（status=2）
export function rejectSchoolChange(appealId: number, rejectReason: string) {
  return post('/admin/school-appeal/review', { appealId, status: 2, rejectReason })
}

// POST /admin/user/batch-virtual — 批量注册虚拟用户
export function batchRegisterVirtualUsers(data: { campusId: number; count: number; enrollmentYearStart: number; enrollmentYearEnd: number }) {
  return post('/admin/user/batch-virtual', data)
}

// POST /admin/avatar/batch-upload — 批量上传AI头像（multipart/form-data）
export function batchUploadAvatars(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return post('/admin/avatar/batch-upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
