-- Create events table (main events)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE,
  event_time TEXT,
  venue TEXT,
  maps_link TEXT,
  instructions TEXT,
  social_links JSONB,
  -- QR Scanner fields
  main_qr_code TEXT, -- QR code for main event page
  maps_qr_code TEXT, -- QR code for Google Maps location
  custom_qr_code TEXT, -- QR code for custom URL/content
  custom_qr_url TEXT, -- Custom URL for the custom QR scanner
  custom_qr_title TEXT, -- Title for the custom QR scanner
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create sub_events table (sub-events within main events)
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
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create images table
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover','gallery')),
  url TEXT NOT NULL
);

-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) VALUES ('event-images', 'event-images', true);

-- Set up storage policies for event images bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'event-images');
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'event-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');
CREATE POLICY "Users can delete own uploads" ON storage.objects FOR DELETE USING (bucket_id = 'event-images' AND auth.role() = 'authenticated');

-- Enable RLS on tables
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Create policies for events table (allow all operations for now)
CREATE POLICY "Allow all operations on events" ON events FOR ALL USING (true);

-- Create policies for sub_events table (allow all operations for now)
CREATE POLICY "Allow all operations on sub_events" ON sub_events FOR ALL USING (true);

-- Create policies for images table (allow all operations for now)
CREATE POLICY "Allow all operations on images" ON images FOR ALL USING (true);

-- Create index for better performance on sub_events queries
CREATE INDEX idx_sub_events_event_id ON sub_events(event_id);
CREATE INDEX idx_sub_events_order ON sub_events(event_id, order_index);