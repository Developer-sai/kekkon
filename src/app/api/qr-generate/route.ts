import { NextRequest, NextResponse } from 'next/server'
import { qrGenerator } from '@/lib/qr-generator'
import { eventOperations, analyticsOperations } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const { event_id, qr_type } = body
    
    if (!event_id || !qr_type) {
      return NextResponse.json(
        { error: 'Missing required fields: event_id, qr_type' },
        { status: 400 }
      )
    }

    // Validate QR type
    const validQRTypes = ['main', 'maps', 'custom', 'rsvp', 'guestbook', 'gallery']
    if (!validQRTypes.includes(qr_type)) {
      return NextResponse.json(
        { error: `Invalid qr_type. Must be one of: ${validQRTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Get event data to validate it exists
    const event = await eventOperations.getEventById(event_id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Get base URL from request or use default
    const baseUrl = body.base_url || `${request.nextUrl.protocol}//${request.nextUrl.host}`
    
    let qrCodeUrl: string
    let targetUrl: string

    switch (qr_type) {
      case 'main':
        targetUrl = `${baseUrl}/${event.card_id}`
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        })
        break

      case 'maps':
        if (!event.maps_link) {
          return NextResponse.json(
            { error: 'Event does not have a maps link configured' },
            { status: 400 }
          )
        }
        targetUrl = event.maps_link
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#1f2937',
            light: '#FFFFFF'
          }
        })
        break

      case 'custom':
        const customUrl = body.custom_url || event.custom_qr_url
        if (!customUrl) {
          return NextResponse.json(
            { error: 'Custom URL is required for custom QR type' },
            { status: 400 }
          )
        }
        targetUrl = customUrl
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#7c3aed',
            light: '#FFFFFF'
          }
        })
        break

      case 'rsvp':
        targetUrl = `${baseUrl}/${event.card_id}/rsvp`
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#dc2626',
            light: '#FFFFFF'
          }
        })
        break

      case 'guestbook':
        targetUrl = `${baseUrl}/${event.card_id}/guestbook`
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#059669',
            light: '#FFFFFF'
          }
        })
        break

      case 'gallery':
        targetUrl = `${baseUrl}/${event.card_id}/gallery`
        qrCodeUrl = await qrGenerator.generateQRCode(targetUrl, {
          width: 256,
          margin: 2,
          color: {
            dark: '#7c2d12',
            light: '#FFFFFF'
          }
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid QR type' },
          { status: 400 }
        )
    }

    // Track QR generation
    try {
      await analyticsOperations.trackEvent(
        event_id,
        'qr_generated',
        {
          qr_type,
          target_url: targetUrl
        }
      )
    } catch (analyticsError) {
      console.error('Failed to track QR generation:', analyticsError)
      // Don't fail the request if analytics tracking fails
    }

    return NextResponse.json({
      success: true,
      qr_code_url: qrCodeUrl,
      target_url: targetUrl,
      qr_type,
      event_id
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
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
    
    if (!event_id) {
      return NextResponse.json(
        { error: 'Missing event_id parameter' },
        { status: 400 }
      )
    }

    // Get event with existing QR codes
    const event = await eventOperations.getEventById(event_id)
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      qr_codes: {
        main: event.main_qr_code,
        maps: event.maps_qr_code,
        custom: event.custom_qr_code
      },
      event_id: event.id,
      card_id: event.card_id
    })

  } catch (error) {
    console.error('Error fetching QR codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}