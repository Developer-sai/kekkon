import { NextRequest, NextResponse } from 'next/server'
import { rsvpOperations, analyticsOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { event_id, guest_name, guest_email, attendance_status } = body
    
    if (!event_id || !guest_name || !guest_email || !attendance_status) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, guest_name, guest_email, attendance_status' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(guest_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Validate attendance status
    if (!['attending', 'not_attending', 'maybe'].includes(attendance_status)) {
      return NextResponse.json(
        { error: 'Invalid attendance status. Must be: attending, not_attending, or maybe' },
        { status: 400 }
      )
    }

    // Create RSVP
    const rsvp = await rsvpOperations.createRSVP({
      event_id,
      card_id: body.card_id || event_id, // Use card_id if provided, fallback to event_id
      guest_name,
      guest_email,
      guest_phone: body.guest_phone || null,
      attendance_status,
      number_of_guests: body.number_of_guests || 1,
      dietary_requirements: body.dietary_requirements || null,
      special_requests: body.special_requests || null,
      updated_at: new Date().toISOString()
    })

    // Track analytics
    try {
      await analyticsOperations.trackEvent(
      event_id,
      'rsvp_submitted',
      {
        attendance_status,
        guest_count: body.guest_count || 1,
        has_dietary_restrictions: !!body.dietary_restrictions,
        has_special_requests: !!body.special_requests,
        timestamp: new Date().toISOString()
      }
    )
    } catch (analyticsError) {
      console.error('Failed to track RSVP analytics:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({
      success: true,
      rsvp: {
        id: rsvp.id,
        guest_name: rsvp.guest_name,
        attendance_status: rsvp.attendance_status,
        created_at: rsvp.created_at
      }
    })

  } catch (error) {
    console.error('Error creating RSVP:', error)
    
    // Handle duplicate RSVP error
    if (error instanceof Error && error.message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'An RSVP with this email already exists for this event' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('event_id')
    
    if (!eventId) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    const rsvps = await rsvpOperations.getRSVPsByEvent(eventId)
    
    return NextResponse.json({
      success: true,
      data: rsvps
    })
  } catch (error) {
    console.error('Error fetching RSVPs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch RSVPs' },
      { status: 500 }
    )
  }
}