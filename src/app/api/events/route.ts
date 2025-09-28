import { NextRequest, NextResponse } from 'next/server'
import { eventOperations, analyticsOperations } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const card_id = searchParams.get('card_id')
    const include_analytics = searchParams.get('include_analytics') === 'true'
    
    if (card_id) {
      // Get specific event by card_id
      const event = await eventOperations.getEventByCardId(card_id)
      
      if (!event) {
        return NextResponse.json(
          { error: 'Event not found' },
          { status: 404 }
        )
      }

      let analytics = null
      if (include_analytics) {
        try {
          analytics = await analyticsOperations.getEventAnalytics(event.id)
        } catch (analyticsError) {
          console.error('Failed to fetch analytics:', analyticsError)
          // Continue without analytics if there's an error
        }
      }

      return NextResponse.json({
        success: true,
        event,
        analytics
      })
    } else {
      // Get all events (admin only - should add auth check)
      const events = await eventOperations.getAllEvents()
      
      return NextResponse.json({
        success: true,
        events: events || []
      })
    }

  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { title, description } = body
    
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Missing required fields: title, description' },
        { status: 400 }
      )
    }

    // Validate optional date fields
    if (body.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(body.event_date)) {
      return NextResponse.json(
        { error: 'Invalid event_date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (body.event_time && !/^\d{2}:\d{2}$/.test(body.event_time)) {
      return NextResponse.json(
        { error: 'Invalid event_time format. Use HH:MM' },
        { status: 400 }
      )
    }

    // Validate social links format
    if (body.social_links && !Array.isArray(body.social_links)) {
      return NextResponse.json(
        { error: 'social_links must be an array' },
        { status: 400 }
      )
    }

    // Create event
    const eventData = {
      title: body.title,
      description: body.description,
      event_date: body.event_date || null,
      event_time: body.event_time || null,
      venue: body.venue || null,
      maps_link: body.maps_link || null,
      instructions: body.instructions || null,
      social_links: body.social_links || [],
      custom_qr_url: body.custom_qr_url || null,
      custom_qr_title: body.custom_qr_title || null,
      card_id: body.card_id || '',
      microsite_mode: body.microsite_mode || 'public',
      is_active: body.is_active !== undefined ? body.is_active : true,
      screenshot_blocking: body.screenshot_blocking !== undefined ? body.screenshot_blocking : false,
      is_public: body.is_public !== undefined ? body.is_public : true
    }

    const newEvent = await eventOperations.createEvent(eventData)

    // Track event creation
    try {
      await analyticsOperations.trackEvent(
        newEvent.id,
        'event_created',
        {
          has_date: !!body.event_date,
          has_venue: !!body.venue,
          has_maps_link: !!body.maps_link,
          social_links_count: body.social_links?.length || 0,
          has_custom_qr: !!body.custom_qr_url
        }
      )
    } catch (analyticsError) {
      console.error('Failed to track event creation:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({
      success: true,
      event: {
        id: newEvent.id,
        card_id: newEvent.card_id,
        title: newEvent.title,
        description: newEvent.description,
        created_at: newEvent.created_at
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { event_id, ...updateData } = body
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id' },
        { status: 400 }
      )
    }

    // Validate event exists
    const existingEvent = await eventOperations.getEventById(event_id)
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Validate date formats if provided
    if (updateData.event_date && !/^\d{4}-\d{2}-\d{2}$/.test(updateData.event_date)) {
      return NextResponse.json(
        { error: 'Invalid event_date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    if (updateData.event_time && !/^\d{2}:\d{2}$/.test(updateData.event_time)) {
      return NextResponse.json(
        { error: 'Invalid event_time format. Use HH:MM' },
        { status: 400 }
      )
    }

    // Update event
    const updatedEvent = await eventOperations.updateEvent(event_id, updateData)

    // Track event update
    try {
      await analyticsOperations.trackEvent(
        event_id,
        'event_updated',
        {
          updated_fields: Object.keys(updateData)
        }
      )
    } catch (analyticsError) {
      console.error('Failed to track event update:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({
      success: true,
      event: updatedEvent
    })

  } catch (error) {
    console.error('Error updating event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const event_id = searchParams.get('event_id')
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    // Validate event exists
    const existingEvent = await eventOperations.getEventById(event_id)
    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Track event deletion before deleting
    try {
      await analyticsOperations.trackEvent(
      event_id,
      'event_deleted',
      {
        event_title: existingEvent.title,
        deleted_at: new Date().toISOString()
      }
    )
    } catch (analyticsError) {
      console.error('Failed to track event deletion:', analyticsError)
      // Continue with deletion even if analytics fails
    }

    // Delete event
    await eventOperations.deleteEvent(event_id)

    return NextResponse.json({
      success: true,
      message: 'Event deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting event:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}