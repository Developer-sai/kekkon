import { NextRequest, NextResponse } from 'next/server'
import { analyticsOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { event_id, event_type } = body
    
    if (!event_id || !event_type) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, event_type' },
        { status: 400 }
      )
    }

    // Validate event type
    const validEventTypes = [
      'page_viewed',
      'qr_scanned',
      'rsvp_submitted',
      'guestbook_entry_created',
      'image_viewed',
      'image_downloaded',
      'directions_clicked',
      'social_link_clicked',
      'rsvp_page_viewed',
      'guestbook_page_viewed',
      'gallery_page_viewed'
    ]

    if (!validEventTypes.includes(event_type)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Track the event
    const analyticsEntry = await analyticsOperations.trackEvent(
      event_id,
      event_type,
      body.metadata || {}
    )

    return NextResponse.json({
      success: true,
      analytics_id: analyticsEntry.id,
      tracked_at: analyticsEntry.created_at
    })

  } catch (error) {
    console.error('Error tracking analytics event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const event_id = searchParams.get('event_id')
    const event_type = searchParams.get('event_type')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    // Get analytics data
    const analytics = await analyticsOperations.getEventAnalytics(event_id)

    // Calculate summary statistics
    const summary = {
      total_events: analytics?.length || 0,
      page_views: analytics?.filter(a => a.action === 'page_viewed').length || 0,
      qr_scans: analytics?.filter(a => a.action === 'qr_scanned').length || 0,
      rsvp_submissions: analytics?.filter(a => a.action === 'rsvp_submitted').length || 0,
      guestbook_entries: analytics?.filter(a => a.action === 'guestbook_entry_created').length || 0,
      image_views: analytics?.filter(a => a.action === 'image_viewed').length || 0,
      image_downloads: analytics?.filter(a => a.action === 'image_downloaded').length || 0,
      directions_clicks: analytics?.filter(a => a.action === 'directions_clicked').length || 0,
      social_link_clicks: analytics?.filter(a => a.action === 'social_link_clicked').length || 0
    }

    // Group by date for trends
    interface DailyStats {
      date: string
      page_views: number
      qr_scans: number
      rsvp_submissions: number
      guestbook_entries: number
      total_events: number
    }
    
    const dailyStats = analytics?.reduce((acc: Record<string, DailyStats>, item) => {
      const date = item.timestamp.split('T')[0] // Get date part only
      if (!acc[date]) {
        acc[date] = {
          date,
          page_views: 0,
          qr_scans: 0,
          rsvp_submissions: 0,
          guestbook_entries: 0,
          total_events: 0
        }
      }
      
      acc[date].total_events++
      
      switch (item.action) {
        case 'page_viewed':
          acc[date].page_views++
          break
        case 'qr_scanned':
          acc[date].qr_scans++
          break
        case 'rsvp_submitted':
          acc[date].rsvp_submissions++
          break
        case 'guestbook_entry_created':
          acc[date].guestbook_entries++
          break
      }
      
      return acc
    }, {}) || {}

    return NextResponse.json({
      success: true,
      summary,
      daily_stats: Object.values(dailyStats),
      raw_events: analytics || []
    })

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}