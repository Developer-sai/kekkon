'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  Eye, 
  QrCode, 
  Users, 
  Calendar,
  TrendingUp,
  Download
} from "lucide-react"
import { analyticsOperations, rsvpOperations, Event } from '@/lib/supabase'

interface EventAnalyticsProps {
  event: Event
}

interface AnalyticsSummary {
  totalViews: number
  totalScans: number
  totalRSVPs: number
  recentActivity: Array<{
    action: string
    count: number
    timestamp: string
  }>
}

export default function EventAnalytics({ event }: EventAnalyticsProps) {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rsvps, setRsvps] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
    loadRSVPs()
  }, [event.id])

  const loadAnalytics = async () => {
    try {
      const analyticsData = await analyticsOperations.getEventAnalytics(event.id)
      const summary = await analyticsOperations.getAnalyticsSummary(event.id)
      
      setAnalytics({
        totalViews: summary.page_visit || 0,
        totalScans: summary.qr_scan || 0,
        totalRSVPs: summary.rsvp_submit || 0,
        recentActivity: Object.entries(summary).map(([action, count]) => ({
          action,
          count: count as number,
          timestamp: new Date().toISOString()
        }))
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadRSVPs = async () => {
    try {
      const rsvpData = await rsvpOperations.getRSVPsByEvent(event.id)
      setRsvps(rsvpData)
    } catch (error) {
      console.error('Error loading RSVPs:', error)
    }
  }

  const exportAnalytics = () => {
    if (!analytics) return

    const csvContent = [
      ['Metric', 'Value'],
      ['Total Views', analytics.totalViews],
      ['Total Scans', analytics.totalScans],
      ['Total RSVPs', analytics.totalRSVPs],
      ['Event Title', event.title],
      ['Created Date', new Date(event.created_at).toLocaleDateString()],
      ...analytics.recentActivity.map(activity => [activity.action, activity.count])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.title}-analytics.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics
          </CardTitle>
          <Button onClick={exportAnalytics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        <CardDescription>
          Performance metrics for {event.title}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">Page Views</span>
            </div>
            <div className="text-2xl font-bold text-blue-900">
              {analytics?.totalViews || event.total_visits || 0}
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">QR Scans</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              {analytics?.totalScans || event.total_scans || 0}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">RSVPs</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {analytics?.totalRSVPs || event.total_rsvps || 0}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Activity Breakdown
            </h4>
            <div className="space-y-2">
              {analytics.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm capitalize">
                    {activity.action.replace('_', ' ')}
                  </span>
                  <Badge variant="secondary">{activity.count}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* RSVP Summary */}
        {rsvps.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              RSVP Summary
            </h4>
            <div className="space-y-2">
              {['attending', 'not_attending', 'maybe'].map(status => {
                const count = rsvps.filter(rsvp => rsvp.attendance_status === status).length
                const totalGuests = rsvps
                  .filter(rsvp => rsvp.attendance_status === status)
                  .reduce((sum, rsvp) => sum + (rsvp.number_of_guests || 1), 0)
                
                return (
                  <div key={status} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <span className="text-sm capitalize">
                      {status.replace('_', ' ')}
                    </span>
                    <div className="flex gap-2">
                      <Badge variant="outline">{count} responses</Badge>
                      <Badge variant="secondary">{totalGuests} guests</Badge>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Event Status */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Event Status</span>
            <Badge variant={event.is_active ? "default" : "secondary"}>
              {event.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-gray-600">Microsite Mode</span>
            <Badge variant="outline" className="capitalize">
              {event.microsite_mode}
            </Badge>
          </div>
          {event.expires_at && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Expires</span>
              <span className="text-sm">
                {new Date(event.expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}