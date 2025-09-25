# Kekkon API Documentation

## Overview

Kekkon uses Supabase as its backend service, providing a PostgreSQL database with real-time capabilities and file storage. The application includes comprehensive CRUD operations for events, sub-events, and image management.

## Database Schema

### Tables

#### Events Table
```sql
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
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Sub-Events Table
```sql
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
```

#### Images Table
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('cover','gallery')),
  url TEXT NOT NULL
);
```

### Storage Bucket
- **Bucket Name**: `event-images`
- **Access**: Public read, authenticated write
- **Purpose**: Store event cover images and gallery images

## TypeScript Interfaces

### Event Interface
```typescript
interface Event {
  id: string
  title: string
  description?: string
  event_date?: string
  event_time?: string
  venue?: string
  maps_link?: string
  instructions?: string
  social_links?: SocialLink[]
  created_at: string
}
```

### SubEvent Interface
```typescript
interface SubEvent {
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
```

### EventImage Interface
```typescript
interface EventImage {
  id: string
  event_id: string
  type: 'cover' | 'gallery'
  url: string
}
```

### SocialLink Interface
```typescript
interface SocialLink {
  name: string
  url: string
  icon?: string
}
```

## API Operations

### Event Operations

#### Create Event
```typescript
eventOperations.createEvent(eventData: Omit<Event, 'id' | 'created_at'>)
```
- **Purpose**: Creates a new event
- **Returns**: Created event object
- **Throws**: Error if database connection fails or validation fails

#### Get All Events
```typescript
eventOperations.getAllEvents(): Promise<Event[]>
```
- **Purpose**: Retrieves all events
- **Returns**: Array of events (empty array if database unavailable)
- **Error Handling**: Returns empty array on failure

#### Get Event by ID
```typescript
eventOperations.getEventById(id: string): Promise<Event | null>
```
- **Purpose**: Retrieves a specific event by ID
- **Returns**: Event object or null if not found
- **Error Handling**: Returns null on error or not found

#### Update Event
```typescript
eventOperations.updateEvent(id: string, updates: Partial<Event>)
```
- **Purpose**: Updates an existing event
- **Returns**: Updated event object
- **Throws**: Error if update fails

#### Delete Event
```typescript
eventOperations.deleteEvent(id: string)
```
- **Purpose**: Deletes an event and all related data
- **Returns**: void
- **Throws**: Error if deletion fails

### Sub-Event Operations

#### Create Sub-Event
```typescript
subEventOperations.createSubEvent(subEventData: Omit<SubEvent, 'id' | 'created_at'>)
```
- **Purpose**: Creates a new sub-event within an event
- **Returns**: Created sub-event object
- **Throws**: Error if creation fails

#### Get Sub-Events by Event ID
```typescript
subEventOperations.getSubEventsByEventId(eventId: string): Promise<SubEvent[]>
```
- **Purpose**: Retrieves all sub-events for a specific event
- **Returns**: Array of sub-events ordered by order_index
- **Error Handling**: Returns empty array on failure

#### Update Sub-Event
```typescript
subEventOperations.updateSubEvent(id: string, updates: Partial<SubEvent>)
```
- **Purpose**: Updates an existing sub-event
- **Returns**: Updated sub-event object
- **Throws**: Error if update fails

#### Delete Sub-Event
```typescript
subEventOperations.deleteSubEvent(id: string)
```
- **Purpose**: Deletes a sub-event
- **Returns**: boolean (true on success)
- **Throws**: Error if deletion fails

### Image Operations

#### Upload Image
```typescript
imageOperations.uploadImage(file: File, path: string): Promise<string>
```
- **Purpose**: Uploads an image file to Supabase storage
- **Returns**: Public URL of uploaded image
- **Throws**: Error if upload fails

#### Save Image Record
```typescript
imageOperations.saveImageRecord(eventId: string, type: 'cover' | 'gallery', url: string): Promise<EventImage>
```
- **Purpose**: Saves image metadata to database
- **Returns**: Created image record
- **Throws**: Error if save fails

#### Get Images for Event
```typescript
imageOperations.getImagesForEvent(): Promise<EventImage[]>
```
- **Purpose**: Retrieves all images for events
- **Returns**: Array of image records (empty array if unavailable)
- **Error Handling**: Returns empty array on failure

#### Delete Image
```typescript
imageOperations.deleteImage(imageId: string)
```
- **Purpose**: Deletes an image record from database
- **Returns**: void
- **Throws**: Error if deletion fails

## REST API Endpoints

### GET /api/events/[id]
- **Purpose**: Fetch a specific event by ID
- **Parameters**: 
  - `id` (string): Event UUID
- **Response**: 
  - `200`: Event object
  - `404`: Event not found
  - `500`: Internal server error

## Error Handling

All operations include comprehensive error handling:

1. **Database Connection Errors**: Graceful fallbacks with empty arrays or null returns
2. **Validation Errors**: Descriptive error messages for invalid data
3. **Not Found Errors**: Proper 404 responses for missing resources
4. **Storage Errors**: Clear error messages for file upload failures

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Public read access for events and images
- Authenticated access required for write operations

### Storage Policies
- Public read access for event images
- Authenticated users can upload images
- Users can delete their own uploads

## Performance Optimizations

### Database Indexes
```sql
CREATE INDEX idx_sub_events_event_id ON sub_events(event_id);
CREATE INDEX idx_sub_events_order ON sub_events(event_id, order_index);
```

### Query Optimizations
- Sub-events are automatically ordered by `order_index`
- Cascade deletes ensure data consistency
- Efficient foreign key relationships

## Usage Examples

### Creating a Complete Event
```typescript
// 1. Create the main event
const event = await eventOperations.createEvent({
  title: "Wedding Celebration",
  description: "Join us for our special day",
  event_date: "2024-06-15",
  event_time: "16:00",
  venue: "Grand Hotel",
  maps_link: "https://maps.google.com/...",
  social_links: [
    { name: "Instagram", url: "https://instagram.com/..." }
  ]
});

// 2. Upload and save cover image
const coverUrl = await imageOperations.uploadImage(coverFile, `cover/${event.id}-cover.jpg`);
await imageOperations.saveImageRecord(event.id, 'cover', coverUrl);

// 3. Create sub-events
await subEventOperations.createSubEvent({
  event_id: event.id,
  title: "Ceremony",
  event_time: "16:00",
  venue: "Church Hall",
  order_index: 0
});

await subEventOperations.createSubEvent({
  event_id: event.id,
  title: "Reception",
  event_time: "18:00",
  venue: "Grand Ballroom",
  order_index: 1
});
```

This API provides a complete solution for managing wedding events with support for multiple sub-events, image galleries, and social media integration.