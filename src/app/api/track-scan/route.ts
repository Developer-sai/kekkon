import { NextRequest, NextResponse } from 'next/server'
import { analyticsOperations, eventOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { event_id, scan_type } = body
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing required field: event_id' },
        { status: 400 }
      )
    }

    // Validate scan type
    const validScanTypes = ['main', 'maps', 'custom', 'rsvp', 'guestbook', 'gallery']
    const scanType = scan_type || 'main'
    
    if (!validScanTypes.includes(scanType)) {
      return NextResponse.json(
        { error: `Invalid scan_type. Must be one of: ${validScanTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Verify event exists
    const event = await eventOperations.getEventById(event_id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get client information from headers
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const referer = request.headers.get('referer') || null
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'Unknown'

    // Parse user agent for device info
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
    const isTablet = /iPad|Tablet/.test(userAgent)
    const deviceType = isTablet ? 'tablet' : (isMobile ? 'mobile' : 'desktop')

    // Extract browser info
    let browser = 'Unknown'
    if (userAgent.includes('Chrome')) browser = 'Chrome'
    else if (userAgent.includes('Firefox')) browser = 'Firefox'
    else if (userAgent.includes('Safari')) browser = 'Safari'
    else if (userAgent.includes('Edge')) browser = 'Edge'

    // Track the scan event
    const analyticsEntry = await analyticsOperations.trackEvent(
      event_id,
      'qr_scanned',
      {
        scan_type: scanType,
        device_type: deviceType,
        browser,
        user_agent: userAgent,
        referer,
        client_ip: clientIP.split(',')[0].trim(), // Take first IP if multiple
        timestamp: new Date().toISOString(),
        ...body.metadata // Allow additional metadata from client
      }
    )

    // Determine redirect URL based on scan type
    let redirectUrl: string
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
    
    switch (scanType) {
      case 'main':
        redirectUrl = `${baseUrl}/${event.card_id}`
        break
      case 'maps':
        redirectUrl = event.maps_link || `${baseUrl}/${event.card_id}/venue`
        break
      case 'custom':
        redirectUrl = event.custom_qr_url || `${baseUrl}/${event.card_id}`
        break
      case 'rsvp':
        redirectUrl = `${baseUrl}/${event.card_id}/rsvp`
        break
      case 'guestbook':
        redirectUrl = `${baseUrl}/${event.card_id}/guestbook`
        break
      case 'gallery':
        redirectUrl = `${baseUrl}/${event.card_id}/gallery`
        break
      default:
        redirectUrl = `${baseUrl}/${event.card_id}`
    }

    return NextResponse.json({
      success: true,
      analytics_id: analyticsEntry.id,
      redirect_url: redirectUrl,
      scan_type: scanType,
      event_title: event.title,
      tracked_at: analyticsEntry.created_at
    })

  } catch (error) {
    console.error('Error tracking QR scan:', error)
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
    const scan_type = searchParams.get('scan_type')
    const start_date = searchParams.get('start_date')
    const end_date = searchParams.get('end_date')
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    // Get scan analytics
    const scans = await analyticsOperations.getEventAnalytics(event_id)
    
    // Filter by action type and scan type if specified
    const qrScans = scans?.filter(scan => scan.action === 'qr_scanned') || []
    const filteredScans = scan_type 
      ? qrScans.filter(scan => scan.metadata?.scan_type === scan_type)
      : qrScans

    // Calculate statistics
    const stats = {
      total_scans: filteredScans?.length || 0,
      unique_ips: new Set(filteredScans?.map(scan => scan.metadata?.client_ip).filter(Boolean)).size,
      scan_types: filteredScans?.reduce((acc: Record<string, number>, scan) => {
        const type = (scan.metadata as any)?.scan_type || 'main'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
      device_types: filteredScans?.reduce((acc: Record<string, number>, scan) => {
        const type = (scan.metadata as any)?.device_type || 'unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
      browsers: filteredScans?.reduce((acc: Record<string, number>, scan) => {
        const browser = (scan.metadata as any)?.browser || 'unknown'
        acc[browser] = (acc[browser] || 0) + 1
        return acc
      }, {}),
      hourly_distribution: filteredScans?.reduce((acc: Record<string, number>, scan) => {
        const hour = new Date(scan.timestamp).getHours()
        acc[hour] = (acc[hour] || 0) + 1
        return acc
      }, {})
    }

    // Group by date for trends
    const dailyScans = filteredScans?.reduce((acc: Record<string, { date: string; count: number; unique_ips: Set<string> }>, scan) => {
      const date = scan.timestamp.split('T')[0]
      if (!acc[date]) {
        acc[date] = { date, count: 0, unique_ips: new Set() }
      }
      acc[date].count++
      if ((scan.metadata as any)?.client_ip) {
        acc[date].unique_ips.add((scan.metadata as any).client_ip as string)
      }
      return acc
    }, {}) || {}

    // Convert sets to counts
    const dailyStats = Object.values(dailyScans).map((day) => ({
      date: day.date,
      total_scans: day.count,
      unique_visitors: day.unique_ips.size
    }))

    return NextResponse.json({
      success: true,
      stats,
      daily_stats: dailyStats,
      recent_scans: filteredScans?.slice(-10) || [] // Last 10 scans
    })

  } catch (error) {
    console.error('Error fetching scan analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}