-- Enhanced Kekkon Database Schema
-- This schema supports all PRD requirements including analytics, RSVP, guestbook, and microsite management

-- Create events table with enhanced fields for PRD requirements
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT UNIQUE NOT NULL, -- Unique identifier for microsite URL
  title TEXT NOT NULL,
  description TEXT,
  host_names TEXT[], -- Array of host names
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  maps_link TEXT,
  instructions TEXT,
  social_links JSONB DEFAULT '[]'::jsonb, -- Array of social links
  
  -- QR Code fields
  main_qr_code TEXT, -- Base64 encoded QR code for main event
  maps_qr_code TEXT, -- QR code for venue/maps
  custom_qr_code TEXT, -- Custom QR code
  custom_qr_url TEXT, -- Custom QR URL
  custom_qr_title TEXT, -- Custom QR title
  
  -- Microsite management
  microsite_mode TEXT CHECK (microsite_mode IN ('forever', 'disposable')) DEFAULT 'disposable',
  expires_at TIMESTAMP, -- Auto-expiry for disposable mode
  is_active BOOLEAN DEFAULT true,
  
  -- Privacy and security
  screenshot_blocking BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false, -- For search engine indexing control
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by TEXT, -- Admin/host identifier
  
  -- Analytics summary (denormalized for performance)
  total_scans INTEGER DEFAULT 0,
  total_visits INTEGER DEFAULT 0,
  total_rsvps INTEGER DEFAULT 0
);

-- Create sub_events table for multiple event schedules (max 3 per PRD)
CREATE TABLE sub_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  maps_link TEXT,
  instructions TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create images table for cover and gallery images
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover', 'gallery')) NOT NULL,
  url TEXT NOT NULL,
  filename TEXT,
  file_size INTEGER,
  mime_type TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create analytics table for detailed tracking
CREATE TABLE analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  
  -- Event tracking
  event_type TEXT NOT NULL CHECK (event_type IN ('qr_scan', 'page_visit', 'rsvp_submit', 'link_click', 'image_view', 'maps_click')),
  
  -- User/session tracking
  session_id TEXT,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  
  -- Additional metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Flexible field for additional data
  
  -- Geolocation (optional)
  country TEXT,
  city TEXT,
  
  -- Timestamp
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create RSVP table
CREATE TABLE rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  
  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  guest_phone TEXT,
  
  -- RSVP details
  attendance_status TEXT CHECK (attendance_status IN ('attending', 'not_attending', 'maybe')) NOT NULL,
  number_of_guests INTEGER DEFAULT 1,
  dietary_requirements TEXT,
  special_requests TEXT,
  
  -- Sub-event specific RSVPs
  sub_event_rsvps JSONB DEFAULT '[]'::jsonb, -- Array of sub-event attendance
  
  -- Metadata
  session_id TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create guestbook table for guest messages
CREATE TABLE guestbook (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL,
  
  -- Guest information
  guest_name TEXT NOT NULL,
  guest_email TEXT,
  
  -- Message content
  message TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true, -- For moderation
  
  -- Metadata
  session_id TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create admin_sessions table for admin authentication tracking
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create microsite_settings table for advanced configuration
CREATE TABLE microsite_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE UNIQUE,
  
  -- Theme and styling
  theme_color TEXT DEFAULT '#8B5CF6', -- Purple default
  background_style TEXT DEFAULT 'gradient',
  font_family TEXT DEFAULT 'Inter',
  
  -- Feature toggles
  enable_rsvp BOOLEAN DEFAULT true,
  enable_guestbook BOOLEAN DEFAULT true,
  enable_gallery BOOLEAN DEFAULT true,
  enable_social_links BOOLEAN DEFAULT true,
  enable_maps BOOLEAN DEFAULT true,
  
  -- Privacy settings
  require_password BOOLEAN DEFAULT false,
  password_hash TEXT,
  enable_screenshot_blocking BOOLEAN DEFAULT true,
  
  -- SEO settings
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX idx_events_card_id ON events(card_id);
CREATE INDEX idx_events_created_at ON events(created_at DESC);
CREATE INDEX idx_events_expires_at ON events(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_sub_events_event_id ON sub_events(event_id);
CREATE INDEX idx_sub_events_order ON sub_events(event_id, order_index);
CREATE INDEX idx_images_event_id ON images(event_id);
CREATE INDEX idx_images_type ON images(event_id, type);
CREATE INDEX idx_analytics_event_id ON analytics(event_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);
CREATE INDEX idx_rsvps_event_id ON rsvps(event_id);
CREATE INDEX idx_rsvps_card_id ON rsvps(card_id);
CREATE INDEX idx_guestbook_event_id ON guestbook(event_id);
CREATE INDEX idx_guestbook_created_at ON guestbook(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE guestbook ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE microsite_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public read access (guest microsites)
CREATE POLICY "Public read access for active events" ON events 
  FOR SELECT USING (is_active = true AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Public read access for sub_events" ON sub_events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = sub_events.event_id 
      AND events.is_active = true 
      AND (events.expires_at IS NULL OR events.expires_at > NOW())
    )
  );

CREATE POLICY "Public read access for images" ON images 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = images.event_id 
      AND events.is_active = true 
      AND (events.expires_at IS NULL OR events.expires_at > NOW())
    )
  );

CREATE POLICY "Public read access for guestbook" ON guestbook 
  FOR SELECT USING (
    is_approved = true AND
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = guestbook.event_id 
      AND events.is_active = true 
      AND (events.expires_at IS NULL OR events.expires_at > NOW())
    )
  );

CREATE POLICY "Public read access for microsite_settings" ON microsite_settings 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events 
      WHERE events.id = microsite_settings.event_id 
      AND events.is_active = true 
      AND (events.expires_at IS NULL OR events.expires_at > NOW())
    )
  );

-- Create RLS policies for public write access (RSVP, guestbook, analytics)
CREATE POLICY "Public insert for rsvps" ON rsvps FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update for rsvps" ON rsvps FOR UPDATE USING (true);

CREATE POLICY "Public insert for guestbook" ON guestbook FOR INSERT WITH CHECK (true);

CREATE POLICY "Public insert for analytics" ON analytics FOR INSERT WITH CHECK (true);

-- Create RLS policies for admin access (all operations)
CREATE POLICY "Admin full access for events" ON events FOR ALL USING (true);
CREATE POLICY "Admin full access for sub_events" ON sub_events FOR ALL USING (true);
CREATE POLICY "Admin full access for images" ON images FOR ALL USING (true);
CREATE POLICY "Admin full access for analytics" ON analytics FOR ALL USING (true);
CREATE POLICY "Admin full access for rsvps" ON rsvps FOR ALL USING (true);
CREATE POLICY "Admin full access for guestbook" ON guestbook FOR ALL USING (true);
CREATE POLICY "Admin full access for admin_sessions" ON admin_sessions FOR ALL USING (true);
CREATE POLICY "Admin full access for microsite_settings" ON microsite_settings FOR ALL USING (true);

-- Storage policies for event images
CREATE POLICY "Public read access for event images" ON storage.objects 
  FOR SELECT USING (bucket_id = 'event-images');

CREATE POLICY "Admin upload access for event images" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'event-images');

CREATE POLICY "Admin update access for event images" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'event-images');

CREATE POLICY "Admin delete access for event images" ON storage.objects 
  FOR DELETE USING (bucket_id = 'event-images');

-- Create functions for automatic cleanup of expired events
CREATE OR REPLACE FUNCTION cleanup_expired_events()
RETURNS void AS $$
BEGIN
  -- Delete expired disposable events
  DELETE FROM events 
  WHERE microsite_mode = 'disposable' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to update analytics counters
CREATE OR REPLACE FUNCTION update_event_analytics()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.event_type = 'qr_scan' THEN
    UPDATE events 
    SET total_scans = total_scans + 1 
    WHERE id = NEW.event_id;
  ELSIF NEW.event_type = 'page_visit' THEN
    UPDATE events 
    SET total_visits = total_visits + 1 
    WHERE id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to update RSVP counter
CREATE OR REPLACE FUNCTION update_rsvp_counter()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE events 
    SET total_rsvps = total_rsvps + 1 
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE events 
    SET total_rsvps = total_rsvps - 1 
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_event_analytics
  AFTER INSERT ON analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_event_analytics();

CREATE TRIGGER trigger_update_rsvp_counter
  AFTER INSERT OR DELETE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_rsvp_counter();

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_rsvps_updated_at
  BEFORE UPDATE ON rsvps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_microsite_settings_updated_at
  BEFORE UPDATE ON microsite_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default microsite settings for existing events (if any)
INSERT INTO microsite_settings (event_id)
SELECT id FROM events
WHERE id NOT IN (SELECT event_id FROM microsite_settings WHERE event_id IS NOT NULL)
ON CONFLICT (event_id) DO NOTHING;

-- Create a scheduled job to cleanup expired events (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-expired-events', '0 2 * * *', 'SELECT cleanup_expired_events();');

COMMENT ON TABLE events IS 'Main events table with enhanced fields for PRD requirements';
COMMENT ON TABLE sub_events IS 'Sub-events within main events (max 3 per PRD)';
COMMENT ON TABLE images IS 'Event images including cover and gallery (max 3 cover, 5 gallery per PRD)';
COMMENT ON TABLE analytics IS 'Detailed analytics tracking for QR scans, visits, and interactions';
COMMENT ON TABLE rsvps IS 'RSVP responses from guests';
COMMENT ON TABLE guestbook IS 'Guest messages and well-wishes';
COMMENT ON TABLE admin_sessions IS 'Admin authentication session tracking';
COMMENT ON TABLE microsite_settings IS 'Advanced microsite configuration and theming';
