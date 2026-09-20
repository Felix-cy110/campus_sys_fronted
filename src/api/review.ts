import { get, post, del } from '@/utils/request'

export interface AdminRatingPageParams {
  teacherName?: string
  keyword?: string
  pageNum?: number
  pageSize?: number
}

export function getReviewList(params: AdminRatingPageParams) {
  return get<any>('/admin/teacher/rating', { params })
}

export function getReviewAuditList(params: AdminRatingPageParams) {
  return get<any>('/admin/teacher/rating', { params })
}

export function deleteReview(id: number) {
  return del(`/admin/teacher/rating/${id}`)
}

/** 批量新增教师 */
export function batchAddTeachers(items: { name: string; courses?: string[] }[]) {
  return post<any>('/admin/teacher/batch', { items })
}

/** 课程申请审核参数 */
export interface CourseApplyPageParams {
  pageNum?: number
  pageSize?: number
}

/** 获取待审核课程申请列表 */
export function getCourseApplyList(params: CourseApplyPageParams) {
  return get<any>('/admin/teacher/course/apply', { params })
}

/** 审批课程申请 */
export function reviewCourseApply(id: number, data: { approved: boolean; rejectReason?: string }) {
  return post(`/admin/teacher/course/apply/${id}/review`, data)
}
