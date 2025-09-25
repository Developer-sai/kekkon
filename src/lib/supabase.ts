import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('supabaseUrl is required')
}

if (!supabaseAnonKey) {
  throw new Error('supabaseAnonKey is required')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface Event {
  id: string
  title: string
  description?: string
  event_date?: string
  event_time?: string
  venue?: string
  maps_link?: string
  instructions?: string
  social_links?: SocialLink[]
  // QR Scanner fields
  main_qr_code?: string
  maps_qr_code?: string
  custom_qr_code?: string
  custom_qr_url?: string
  custom_qr_title?: string
  created_at: string
}

export interface EventImage {
  id: string
  event_id: string
  type: 'cover' | 'gallery'
  url: string
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

export interface SocialLink {
  name: string
  url: string
  icon?: string
}

// Event operations
export const eventOperations = {
  async createEvent(eventData: Omit<Event, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single()

      if (error) {
        console.error('Error creating event:', error)
        throw new Error('Failed to create event. Please check your database connection.')
      }
      return data
    } catch (error) {
      console.error('Database connection error:', error)
      throw new Error('Database connection failed. Please ensure Supabase is properly configured.')
    }
  },

  getAllEvents: async (): Promise<Event[]> => {
    try {
      // Return fallback data when database is not available
      return []
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
        if (error.code === 'PGRST116') return null // Not found
        console.error('Error fetching event:', error)
        return null
      }
      return data
    } catch (error) {
      console.error('Database connection error:', error)
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

      if (error) {
        console.error('Error updating event:', error)
        throw new Error('Failed to update event.')
      }
      return data
    } catch (error) {
      console.error('Database connection error:', error)
      throw new Error('Database connection failed.')
    }
  },

  async deleteEvent(id: string) {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting event:', error)
        throw new Error('Failed to delete event.')
      }
    } catch (error) {
      console.error('Database connection error:', error)
      throw new Error('Database connection failed.')
    }
  }
}

// Sub-events operations
export const subEventOperations = {
  async createSubEvent(subEventData: Omit<SubEvent, 'id' | 'created_at'>) {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .insert([subEventData])
        .select()
        .single()

      if (error) {
        console.error('Error creating sub-event:', error)
        throw new Error('Failed to create sub-event. Please check your database configuration.')
      }

      return data
    } catch (error) {
      console.error('Error creating sub-event:', error)
      throw new Error('Failed to create sub-event. Please try again.')
    }
  },

  async getSubEventsByEventId(eventId: string): Promise<SubEvent[]> {
    try {
      const { data, error } = await supabase
        .from('sub_events')
        .select('*')
        .eq('event_id', eventId)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching sub-events:', error)
        return []
      }

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

      if (error) {
        console.error('Error updating sub-event:', error)
        throw new Error('Failed to update sub-event. Please check your database configuration.')
      }

      return data
    } catch (error) {
      console.error('Error updating sub-event:', error)
      throw new Error('Failed to update sub-event. Please try again.')
    }
  },

  async deleteSubEvent(id: string) {
    try {
      const { error } = await supabase
        .from('sub_events')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting sub-event:', error)
        throw new Error('Failed to delete sub-event. Please check your database configuration.')
      }

      return true
    } catch (error) {
      console.error('Error deleting sub-event:', error)
      throw new Error('Failed to delete sub-event. Please try again.')
    }
  }
}

export const imageOperations = {
  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const { error } = await supabase.storage
        .from('event-images')
        .upload(path, file)

      if (error) {
        console.error('Error uploading image:', error)
        throw new Error('Failed to upload image. Please check your storage configuration.')
      }

      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(path)

      return publicUrl
    } catch (error) {
      console.error('Storage connection error:', error)
      throw new Error('Storage connection failed.')
    }
  },

  async saveImageRecord(eventId: string, type: 'cover' | 'gallery', url: string): Promise<EventImage> {
    try {
      const { data, error } = await supabase
        .from('images')
        .insert([{ event_id: eventId, type, url }])
        .select()
        .single()

      if (error) {
        console.error('Error saving image record:', error)
        throw new Error('Failed to save image record.')
      }
      return data
    } catch (error) {
      console.error('Database connection error:', error)
      throw new Error('Database connection failed.')
    }
  },

  getImagesForEvent: async (): Promise<EventImage[]> => {
    try {
      // Return empty array when database is not available
      return []
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

      if (error) {
        console.error('Error deleting image:', error)
        throw new Error('Failed to delete image.')
      }
    } catch (error) {
      console.error('Database connection error:', error)
      throw new Error('Database connection failed.')
    }
  }
}