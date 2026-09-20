import { get, post, put, del } from '@/utils/request'
import type { PageResponse, PageParams, School } from '@/types'

export interface SchoolListParams extends PageParams {
  keyword?: string
  province?: string
  city?: string
  status?: number
}

export function getSchoolList(params: SchoolListParams) {
  return get<PageResponse<School>>('/campus/page', { params })
}

export function getSchoolDetail(id: number) {
  return get<School>(`/campus/${id}`)
}

export interface AddSchoolParams {
  name: string
  code: string
  shortName?: string
  province: string
  city: string
  logoUrl?: string
  status?: number
  sortOrder?: number
}

export function addSchool(data: AddSchoolParams) {
  return post('/campus', data)
}

export function updateSchool(id: number, data: Partial<AddSchoolParams>) {
  return put(`/campus/${id}`, data)
}

export function deleteSchool(id: number) {
  return del(`/campus/${id}`)
}

export function getAllSchools() {
  return get<School[]>('/campus/list')
}
