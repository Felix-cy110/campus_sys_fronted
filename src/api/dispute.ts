import { get } from '@/utils/request'

export function getAdminDisputeList(params: { status?: number; pageNum?: number; pageSize?: number }) {
  return get<any>('/dispute/admin/list', { params })
}
