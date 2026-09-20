import { get, post } from '@/utils/request'
import type { StatisticsTrendPoint } from '@/types'
import dayjs from 'dayjs'

export interface StatisticsDashboardParams {
  schoolIds?: number[]
  startTime?: number
  endTime?: number
  granularity?: string
}

function toLocalDate(ts?: number) {
  return ts ? dayjs(ts).format('YYYY-MM-DD') : undefined
}

function toTrendPoints(list: { date: string; count?: number; totalAmount?: number }[]): StatisticsTrendPoint[] {
  return list.map(item => ({
    label: dayjs(item.date).format('MM-DD'),
    value: Number(item.count ?? item.totalAmount ?? 0),
  }))
}

export async function getStatistics(params: StatisticsDashboardParams = {}) {
  const startDate = toLocalDate(params.startTime)
  const endDate = toLocalDate(params.endTime)
  const campusId = params.schoolIds?.length === 1 ? params.schoolIds[0] : undefined

  const statsParams: any = {}
  if (startDate) statsParams.startDate = startDate
  if (endDate) statsParams.endDate = endDate
  if (campusId) statsParams.campusId = campusId

  const [summaryRes, userStatsRes, contentStatsRes, commentStatsRes] = await Promise.allSettled([
    get<any>('/admin/user/summary', { params: { campusId, activePeriod: 30 } }),
    get<any>('/admin/user/stats', { params: statsParams }),
    get<any>('/admin/content/stats', { params: statsParams }),
    get<any>('/admin/comment/stats', { params: statsParams }),
  ])

  let txRes: any = null
  try {
    txRes = await post<any>('/payment/statistics/query', {
      campusIds: params.schoolIds ?? [],
      startDate: startDate || dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
      endDate: endDate || dayjs().format('YYYY-MM-DD'),
    })
  } catch {}

  const summary = summaryRes.status === 'fulfilled' ? summaryRes.value.data : {}
  const userStats = userStatsRes.status === 'fulfilled' ? userStatsRes.value.data : {}
  const contentStats = contentStatsRes.status === 'fulfilled' ? contentStatsRes.value.data : {}
  const commentStats = commentStatsRes.status === 'fulfilled' ? commentStatsRes.value.data : {}
  const txData = txRes?.data ?? {}

  const userTrend = toTrendPoints(userStats.list || [])
  const postTrend = toTrendPoints(contentStats.post?.list || [])
  const commentTrend = toTrendPoints(commentStats.list || [])
  const txTrend = toTrendPoints((txData.dailyAmounts || []).map((d: any) => ({ date: d.date, count: d.totalAmount })))

  return {
    data: {
      userCount: summary.totalUsers ?? 0,
      postCount: contentStats.post?.total ?? 0,
      commentCount: commentStats.total ?? 0,
      transactionTotal: txData.totalAmount ?? 0,
      shopCount: 0,
      reviewCount: 0,
      pendingCertificationCount: 0,
      pendingShopAuditCount: 0,
      pendingReviewAuditCount: 0,
      pendingCommentAuditCount: 0,
      userModule: {
        totalUsers: summary.totalUsers ?? 0,
        newUsers: userStats.total ?? 0,
        activeUsers: summary.activeUsers ?? 0,
        trend: userTrend,
      },
      postModule: {
        totalPosts: contentStats.post?.total ?? 0,
        newPosts: contentStats.post?.total ?? 0,
        trend: postTrend,
      },
      commentModule: {
        totalComments: commentStats.total ?? 0,
        newComments: commentStats.total ?? 0,
        trend: commentTrend,
      },
      transactionModule: {
        totalAmount: txData.totalAmount ?? 0,
        rangeAmount: txData.totalAmount ?? 0,
        trend: txTrend,
      },
    },
  }
}

export const getUserTrend = (_p: any) => Promise.resolve({ data: [] })
export const getReviewTrend = (_p: any) => Promise.resolve({ data: [] })
export const getShopRanking = (_p: any) => Promise.resolve({ data: [] })
