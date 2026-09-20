/**
 * 评论管理相关API
 */
import { get, post, del } from '@/utils/request'

export interface AdminCommentPageParams {
  campusName?: string
  postId?: number
  page?: number
  size?: number
}

export function getCommentAuditList(params: AdminCommentPageParams) {
  return get<any>('/admin/post/comments', { params })
}

/**
 * 评论审核详情
 */
export function getCommentAuditDetail(commentId: number) {
  return get<any>(`/admin/comment/audit/${commentId}`)
}

/**
 * 审核评论（后端 CommentAuditDTO 要求 passed: boolean）
 */
export interface CommentAuditParams {
  commentId: number
  passed: boolean
  rejectReason?: string
}

export function auditComment(data: CommentAuditParams) {
  return post('/admin/comment/audit', data)
}

/**
 * 删除评论
 */
export function deleteComment(commentId: number) {
  return del(`/admin/post/comment/${commentId}`)
}
