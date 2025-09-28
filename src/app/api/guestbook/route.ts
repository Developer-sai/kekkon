import { NextRequest, NextResponse } from 'next/server'
import { guestbookOperations, analyticsOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { event_id, card_id, guest_name, message } = body
    
    if (!event_id || !card_id || !guest_name || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, card_id, guest_name, message' },
        { status: 400 }
      )
    }

    // Validate message length
    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message must be 1000 characters or less' },
        { status: 400 }
      )
    }

    // Validate guest name length
    if (guest_name.length > 100) {
      return NextResponse.json(
        { error: 'Guest name must be 100 characters or less' },
        { status: 400 }
      )
    }

    // Create guestbook entry
    const entry = await guestbookOperations.createEntry({
      event_id,
      card_id,
      guest_name,
      message,
      guest_email: body.guest_email || null,
      is_approved: true // Auto-approve for now, can be changed to false for moderation
    })

    // Track analytics
    try {
      await analyticsOperations.trackEvent(
        event_id,
        'guestbook_entry_created',
        {
          message_length: message.length,
          has_email: !!body.guest_email
        }
      )
    } catch (analyticsError) {
      console.error('Failed to track guestbook analytics:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        guest_name: entry.guest_name,
        message: entry.message,
        created_at: entry.created_at,
        is_approved: entry.is_approved
      }
    })

  } catch (error) {
    console.error('Error creating guestbook entry:', error)
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
    const approved_only = searchParams.get('approved_only') === 'true'
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    const entries = await guestbookOperations.getEntriesByEvent(event_id)
    
    return NextResponse.json({
      success: true,
      entries: entries || []
    })

  } catch (error) {
    console.error('Error fetching guestbook entries:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { entry_id, action } = body
    
    if (!entry_id || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: entry_id, action' },
        { status: 400 }
      )
    }

    if (!['approve', 'hide', 'delete'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: approve, hide, or delete' },
        { status: 400 }
      )
    }

    let result
    switch (action) {
      case 'approve':
        result = await guestbookOperations.updateEntry(entry_id, { is_approved: true })
        break
      case 'hide':
        result = await guestbookOperations.updateEntry(entry_id, { is_approved: false })
        break
      case 'delete':
        result = await guestbookOperations.deleteEntry(entry_id)
        break
    }

    return NextResponse.json({
      success: true,
      message: `Entry ${action}d successfully`
    })

  } catch (error) {
    console.error('Error updating guestbook entry:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}