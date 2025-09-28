import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabaseAnonKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions
export interface SocialLink {
  name: string
  url: string
  icon?: string
}

export interface Event {
  id: string
  card_id: string // Unique identifier for microsite URL
  title: string
  description?: string
  host_names?: string[] // Array of host names
  event_date?: string
  event_time?: string
  venue?: string
  maps_link?: string
  instructions?: string
  social_links?: SocialLink[]
  
  // QR Code fields
  main_qr_code?: string
  maps_qr_code?: string
  custom_qr_code?: string
  custom_qr_url?: string
  custom_qr_title?: string
  
  // Microsite configuration
  microsite_mode: 'forever' | 'disposable'
  expires_at?: string
  is_active: boolean
  
  // Privacy and security
  screenshot_blocking: boolean
  is_public: boolean
  
  // Metadata
  created_at: string
  updated_at: string
  created_by?: string
  
  // Analytics counters
  total_scans: number
  total_visits: number
  total_rsvps: number
}

export interface EventImage {
  id: string
  event_id: string
  type: 'cover' | 'gallery'
  url: string
  filename?: string
  file_size?: number
  mime_type?: string
  order_index: number
  created_at: string
}

export interface SubEvent {
  id: string
  event_id: string
  title: string
  description?: string
  event_date?: string
  event_time?: string
  venue?: string
  maps_link?: string
  instructions?: string
  order_index: number
  created_at: string
}

export interface Analytics {
  id: string
  event_id: string
  card_id: string
  action: string
  metadata?: Record<string, unknown>
  timestamp: string
}

export interface RSVP {
  id: string
  event_id: string
  card_id: string
  guest_name: string
  guest_email?: string
  guest_phone?: string
  attendance_status: 'attending' | 'not_attending' | 'maybe'
  number_of_guests: number
  dietary_requirements?: string
  special_requests?: string
  sub_event_rsvps?: Array<{
    sub_event_id: string
    attending: boolean
  }>
  session_id?: string
  ip_address?: string
  created_at: string
  updated_at: string
}

export interface GuestbookEntry {
  id: string
  event_id: string
  card_id: string
  guest_name: string
  guest_email?: string
  message: string
  is_approved: boolean
  session_id?: string
  ip_address?: string
  created_at: string
}

export interface MicrositeSettings {
  id: string
  event_id: string
  theme_color: string
  background_style: string
  font_family: string
  enable_rsvp: boolean
  enable_guestbook: boolean
  enable_gallery: boolean
  enable_social_links: boolean
  enable_maps: boolean
  require_password: boolean
  password_hash?: string
  enable_screenshot_blocking: boolean
  meta_title?: string
  meta_description?: string
  og_image_url?: string
  created_at: string
  updated_at: string
}

// Analytics operations
export const analyticsOperations = {
  async trackEvent(eventId: string, action: string, metadata?: Record<string, unknown>) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .insert([{
          event_id: eventId,
          action,
          metadata,
          timestamp: new Date().toISOString()
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error tracking analytics:', error)
      throw error
    }
  },

  async getEventAnalytics(eventId: string): Promise<Analytics[]> {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('*')
        .eq('event_id', eventId)
        .order('timestamp', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching analytics:', error)
      return []
    }
  },

  async getAnalyticsSummary(eventId: string) {
    try {
      const { data, error } = await supabase
        .from('analytics')
        .select('action')
        .eq('event_id', eventId)

      if (error) throw error

      const summary = (data || []).reduce((acc: Record<string, number>, item) => {
        acc[item.action] = (acc[item.action] || 0) + 1
        return acc
      }, {})

      return summary
    } catch (error) {
      console.error('Error fetching analytics summary:', error)
      return {}
    }
  }
}

// RSVP operations
export const rsvpOperations = {
  async createRSVP(rsvpData: Omit<RSVP, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .insert([rsvpData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating RSVP:', error)
      throw error
    }
  },

  async getRSVPsByEvent(eventId: string): Promise<RSVP[]> {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching RSVPs:', error)
      return []
    }
  },

  async updateRSVP(id: string, updates: Partial<RSVP>) {
    try {
      const { data, error } = await supabase
        .from('rsvps')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating RSVP:', error)
      throw error
    }
  },

  async deleteRSVP(id: string) {
    try {
      const { error } = await supabase
        .from('rsvps')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting RSVP:', error)
      throw error
    }
  }
}

// Guestbook operations
export const guestbookOperations = {
  async createEntry(entryData: Omit<GuestbookEntry, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .insert([entryData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating guestbook entry:', error)
      throw error
    }
  },

  async getEntriesByEvent(eventId: string): Promise<GuestbookEntry[]> {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .select('*')
        .eq('event_id', eventId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching guestbook entries:', error)
      return []
    }
  },

  async updateEntry(id: string, updates: Partial<GuestbookEntry>) {
    try {
      const { data, error } = await supabase
        .from('guestbook')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating guestbook entry:', error)
      throw error
    }
  },

  async deleteEntry(id: string) {
    try {
      const { error } = await supabase
        .from('guestbook')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting guestbook entry:', error)
      throw error
    }
  }
}

// Microsite settings operations
export const micrositeOperations = {
  async getSettings(eventId: string): Promise<MicrositeSettings | null> {
    try {
      const { data, error } = await supabase
        .from('microsite_settings')
        .select('*')
        .eq('event_id', eventId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No settings found
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching microsite settings:', error)
      return null
    }
  },

  async updateSettings(eventId: string, settings: Partial<MicrositeSettings>) {
    try {
      const { data, error } = await supabase
        .from('microsite_settings')
        .upsert([{ event_id: eventId, ...settings }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating microsite settings:', error)
      throw error
    }
  }
}

// Event operations
export const eventOperations = {
  async createEvent(eventData: Omit<Event, 'id' | 'created_at' | 'updated_at' | 'total_scans' | 'total_visits' | 'total_rsvps'>) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  getAllEvents: async (): Promise<Event[]> => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching events:', error)
      return []
    }
  },

  async getEventById(id: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No rows returned
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching event:', error)
      return null
    }
  },

  async getEventByCardId(cardId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // No rows returned
        }
        throw error
      }
      return data
    } catch (error) {
      console.error('Error fetching event by card_id:', error)
      return null
    }
  },

  async updateEvent(id: string, updates: Partial<Event>) {
    try {
      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating event:', error)
      throw error
    }
  },

  async deleteEvent(id: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting event:', error)
      throw error
    }
  },

  async generateUniqueCardId(): Promise<string> {
    const generateId = () => Math.random().toString(36).substring(2, 10)
    
    let cardId = generateId()
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const existing = await this.getEventByCardId(cardId)
      if (!existing) {
        return cardId
      }
      cardId = generateId()
      attempts++
    }

    // Fallback with timestamp
    return `${generateId()}-${Date.now().toString(36)}`
  }
}

// Sub-event operations
export const subEventOperations = {
  async createSubEvent(subEventData: Omit<SubEvent, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .insert([subEventData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating sub-event:', error)
      throw error
    }
  },

  async getSubEventsByEventId(eventId: string): Promise<SubEvent[]> {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sub-events:', error)
      return []
    }
  },

  async updateSubEvent(id: string, updates: Partial<SubEvent>) {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating sub-event:', error)
      throw error
    }
  },

  async deleteSubEvent(id: string) {
    try {
      const { error } = await supabase
        .from('sub_events')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting sub-event:', error)
      throw error
    }
  }
}

// Image operations
export const imageOperations = {
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const { error } = await supabase.storage
        .from('event-images')
        .upload(path, file)

      if (error) throw error

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(path)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  },

  async saveImageRecord(eventId: string, type: 'cover' | 'gallery', url: string, filename?: string, fileSize?: number, mimeType?: string): Promise<EventImage> {
    try {
      const { data, error } = await supabase
        .from('images')
        .insert([{
          event_id: eventId,
          type,
          url,
          filename,
          file_size: fileSize,
          mime_type: mimeType,
          order_index: 0
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving image record:', error)
      throw error
    }
  },

  async getImagesForEvent(eventId: string): Promise<EventImage[]> {
    try {
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching images:', error)
      return []
    }
  },

  async deleteImage(imageId: string) {
    try {
      const { error } = await supabase
        .from('images')
        .delete()
        .eq('id', imageId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting image:', error)
      throw error
    }
  }
}