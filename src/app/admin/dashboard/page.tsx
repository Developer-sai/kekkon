'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Heart, 
  Plus, 
  Calendar, 
  MapPin, 
  Camera, 
  ExternalLink,
  Download,
  Trash2,
  LogOut,
  QrCode,
  BarChart3,
  Users,
  MessageSquare,
  Settings
} from "lucide-react"
import Link from "next/link"
import { eventOperations, imageOperations, subEventOperations, Event, SocialLink, SubEvent } from '@/lib/supabase'
import { qrGenerator } from '@/lib/qr-generator'
import EventAnalytics from '@/components/admin/EventAnalytics'
import RSVPManager from '@/components/admin/RSVPManager'
import GuestbookManager from '@/components/admin/GuestbookManager'
import MicrositeSettings from '@/components/admin/MicrositeSettings'

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [activeTab, setActiveTab] = useState('events')
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    venue: '',
    maps_link: '',
    instructions: '',
    social_links: [{ name: '', url: '' }] as SocialLink[],
    // Custom QR Scanner fields
    custom_qr_url: '',
    custom_qr_title: '',
    // Required properties
    card_id: '',
    microsite_mode: 'forever' as 'forever' | 'disposable',
    is_active: true,
    screenshot_blocking: false,
    is_public: true
  })
  
  // Sub-events state
  const [subEvents, setSubEvents] = useState<Omit<SubEvent, 'id' | 'event_id' | 'created_at'>[]>([])
  const [previewData, setPreviewData] = useState<{
    title: string
    description: string
    date: string
    time: string
    venue: string
    coverImage?: string
  } | null>(null)

  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [galleryImages, setGalleryImages] = useState<File[]>([])

  // Update preview data when form changes
  useEffect(() => {
    setPreviewData({
      title: formData.title,
      description: formData.description,
      date: formData.event_date,
      time: formData.event_time,
      venue: formData.venue,
      coverImage: coverImage ? URL.createObjectURL(coverImage) : undefined
    })
  }, [formData.title, formData.description, formData.event_date, formData.event_time, formData.venue, coverImage])

  useEffect(() => {
    // Check authentication
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (!isLoggedIn) {
      router.push('/admin')
      return
    }
    setIsAuthenticated(true)
    loadEvents()
  }, [router])

  const loadEvents = async () => {
    try {
      const eventsData = await eventOperations.getAllEvents()
      setEvents(eventsData || [])
    } catch (error) {
      console.error('Error loading events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in')
    router.push('/admin')
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSocialLinkChange = (index: number, field: 'name' | 'url', value: string) => {
    const newSocialLinks = [...formData.social_links]
    newSocialLinks[index] = { ...newSocialLinks[index], [field]: value }
    setFormData(prev => ({ ...prev, social_links: newSocialLinks }))
  }

  const addSocialLink = () => {
    if (formData.social_links.length < 5) {
      setFormData(prev => ({
        ...prev,
        social_links: [...prev.social_links, { name: '', url: '' }]
      }))
    }
  }

  const removeSocialLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      social_links: prev.social_links.filter((_, i) => i !== index)
    }))
  }

  // Sub-event handlers
  const handleSubEventChange = (index: number, field: keyof SubEvent, value: string) => {
    const newSubEvents = [...subEvents]
    newSubEvents[index] = { ...newSubEvents[index], [field]: value }
    setSubEvents(newSubEvents)
  }

  const addSubEvent = () => {
    if (subEvents.length < 5) {
      setSubEvents(prev => [...prev, {
        id: '',
        event_id: '',
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        venue: '',
        maps_link: '',
        instructions: '',
        order_index: prev.length,
        created_at: ''
      }])
    }
  }

  const removeSubEvent = (index: number) => {
    setSubEvents(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    try {
      // Create event
      const eventData = {
        ...formData,
        social_links: formData.social_links.filter(link => link.name && link.url)
      }
      
      const newEvent = await eventOperations.createEvent(eventData)

      // Upload cover image if provided
      if (coverImage) {
        const coverPath = `cover/${newEvent.id}-${Date.now()}.${coverImage.name.split('.').pop()}`
        const coverUrl = await imageOperations.uploadImage(coverImage, coverPath)
        await imageOperations.saveImageRecord(newEvent.id, 'cover', coverUrl)
      }

      // Upload gallery images if provided
      for (let i = 0; i < galleryImages.length; i++) {
        const image = galleryImages[i]
        const galleryPath = `gallery/${newEvent.id}-${i}-${Date.now()}.${image.name.split('.').pop()}`
        const galleryUrl = await imageOperations.uploadImage(image, galleryPath)
        await imageOperations.saveImageRecord(newEvent.id, 'gallery', galleryUrl)
      }

      // Generate QR codes
      const baseUrl = window.location.origin
      const qrCodes = await qrGenerator.generateEventQRCodes(
        newEvent.id, 
        formData.maps_link || undefined, 
        formData.custom_qr_url || undefined, 
        baseUrl
      )

      // Update event with QR codes
      await eventOperations.updateEvent(newEvent.id, {
        main_qr_code: qrCodes.main,
        maps_qr_code: qrCodes.maps || undefined,
        custom_qr_code: qrCodes.custom || undefined,
        custom_qr_url: formData.custom_qr_url || undefined,
        custom_qr_title: formData.custom_qr_title || undefined
      })

      // Create sub-events if any
      for (let i = 0; i < subEvents.length; i++) {
        const subEvent = subEvents[i]
        if (subEvent.title.trim()) {
          await subEventOperations.createSubEvent({
            ...subEvent,
            event_id: newEvent.id,
            order_index: i
          })
        }
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        event_date: '',
        event_time: '',
        venue: '',
        maps_link: '',
        instructions: '',
        social_links: [{ name: '', url: '' }],
        custom_qr_url: '',
        custom_qr_title: '',
        card_id: '',
        microsite_mode: 'forever' as 'forever' | 'disposable',
        is_active: true,
        screenshot_blocking: false,
        is_public: true
      })
      setCoverImage(null)
      setGalleryImages([])
      setSubEvents([])
      setShowCreateForm(false)

      // Reload events
      await loadEvents()
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Error creating event. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteEvent = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event?')) {
      try {
        await eventOperations.deleteEvent(eventId)
        await loadEvents()
      } catch (error) {
        console.error('Error deleting event:', error)
        alert('Error deleting event. Please try again.')
      }
    }
  }

  const downloadQRCode = async (eventId: string, type: 'main' | 'maps' | 'custom' = 'main') => {
    try {
      const baseUrl = window.location.origin
      let url = `${baseUrl}/${eventId}`
      
      if (type === 'maps') {
        const event = events.find(e => e.id === eventId)
        url = event?.maps_link || url
      } else if (type === 'custom') {
        const event = events.find(e => e.id === eventId)
        url = event?.custom_qr_url || url
      }

      const qrDataUrl = await qrGenerator.generateQRCode(url)
      
      // Create download link
      const link = document.createElement('a')
      link.href = qrDataUrl
      link.download = `${eventId}-${type}-qr.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      alert('Error downloading QR code. Please try again.')
    }
  }

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Heart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Kekkon Admin</h1>
                <p className="text-sm text-gray-600">Event Management Dashboard</p>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="rsvp" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              RSVPs
            </TabsTrigger>
            <TabsTrigger value="guestbook" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Guestbook
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            {/* Create Event Button */}
            {!showCreateForm && (
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Your Events</h2>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Event
                </Button>
              </div>
            )}

            {/* Create Event Form */}
            {showCreateForm && (
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Form Section */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  Create New Event
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Fill in the details to create your digital invitation
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateEvent} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Event Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                        placeholder="e.g., Sarah & John's Wedding"
                        required
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="venue">Venue</Label>
                      <Input
                        id="venue"
                        value={formData.venue}
                        onChange={(e) => handleInputChange('venue', e.target.value)}
                        placeholder="e.g., Grand Ballroom"
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      placeholder="Event description..."
                      rows={3}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="event_date">Event Date</Label>
                      <Input
                        id="event_date"
                        type="date"
                        value={formData.event_date}
                        onChange={(e) => handleInputChange('event_date', e.target.value)}
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="event_time">Event Time</Label>
                      <Input
                        id="event_time"
                        type="time"
                        value={formData.event_time}
                        onChange={(e) => handleInputChange('event_time', e.target.value)}
                        className="border-2 focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maps_link">Google Maps Link</Label>
                    <Input
                      id="maps_link"
                      value={formData.maps_link}
                      onChange={(e) => handleInputChange('maps_link', e.target.value)}
                      placeholder="https://maps.google.com/..."
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="instructions">Instructions / Dress Code</Label>
                    <Textarea
                      id="instructions"
                      value={formData.instructions}
                      onChange={(e) => handleInputChange('instructions', e.target.value)}
                      placeholder="Special instructions, dress code, etc."
                      rows={2}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  {/* Custom QR Scanner Section */}
                  <div className="space-y-4 p-4 border-2 border-purple-200 rounded-lg bg-purple-50/50">
                    <h3 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
                      <QrCode className="h-5 w-5" />
                      Custom QR Scanner (Optional)
                    </h3>
                    <p className="text-sm text-purple-600">
                      Add a custom QR code that links to any URL of your choice (e.g., gift registry, photo album, etc.)
                    </p>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="custom_qr_title">Custom QR Title</Label>
                        <Input
                          id="custom_qr_title"
                          value={formData.custom_qr_title}
                          onChange={(e) => handleInputChange('custom_qr_title', e.target.value)}
                          placeholder="e.g., Gift Registry, Photo Album"
                          className="border-2 focus:border-purple-500"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="custom_qr_url">Custom QR URL</Label>
                        <Input
                          id="custom_qr_url"
                          value={formData.custom_qr_url}
                          onChange={(e) => handleInputChange('custom_qr_url', e.target.value)}
                          placeholder="https://example.com/your-link"
                          className="border-2 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover Image */}
                   <div className="space-y-2">
                     <Label htmlFor="cover_image">Cover Image</Label>
                     <Input
                       id="cover_image"
                       type="file"
                       accept="image/*"
                       onChange={(e) => {
                         const file = e.target.files?.[0] || null
                         setCoverImage(file)
                         if (file) {
                           const reader = new FileReader()
                           reader.onload = (e) => {
                             setPreviewData(prev => prev ? ({
                               ...prev,
                               coverImage: e.target?.result as string
                             }) : null)
                           }
                           reader.readAsDataURL(file)
                         } else {
                           setPreviewData(prev => prev ? ({
                             ...prev,
                             coverImage: undefined
                           }) : null)
                         }
                       }}
                       className="border-2 focus:border-purple-500"
                     />
                   </div>

                  {/* Gallery Images */}
                  <div className="space-y-2">
                    <Label htmlFor="gallery_images">Gallery Images (up to 5)</Label>
                    <Input
                      id="gallery_images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(0, 5)
                        setGalleryImages(files)
                      }}
                      className="border-2 focus:border-purple-500"
                    />
                  </div>

                  {/* Social Links */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Social Links (up to 5)</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addSocialLink}
                        disabled={formData.social_links.length >= 5}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Link
                      </Button>
                    </div>
                    
                    {formData.social_links.map((link, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Link name (e.g., Instagram, RSVP)"
                          value={link.name}
                          onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                          className="border-2 focus:border-purple-500"
                        />
                        <div className="flex gap-2">
                          <Input
                            placeholder="URL"
                            value={link.url}
                            onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                            className="border-2 focus:border-purple-500"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeSocialLink(index)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sub-Events Section */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label>Sub-Events (up to 5)</Label>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addSubEvent}
                        disabled={subEvents.length >= 5}
                        className="border-purple-300 text-purple-600 hover:bg-purple-50"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Sub-Event
                      </Button>
                    </div>
                    
                    {subEvents.map((subEvent, index) => (
                      <Card key={index} className="border-2 border-purple-200">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex justify-between items-center">
                            <h4 className="font-semibold text-purple-700">Sub-Event {index + 1}</h4>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeSubEvent(index)}
                              className="border-red-300 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Sub-event title (e.g., Reception)"
                              value={subEvent.title}
                              onChange={(e) => handleSubEventChange(index, 'title', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                            <Input
                              placeholder="Venue"
                              value={subEvent.venue || ''}
                              onChange={(e) => handleSubEventChange(index, 'venue', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                          </div>
                          
                          <Textarea
                            placeholder="Description"
                            value={subEvent.description || ''}
                            onChange={(e) => handleSubEventChange(index, 'description', e.target.value)}
                            rows={2}
                            className="border-2 focus:border-purple-500"
                          />
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              type="date"
                              value={subEvent.event_date || ''}
                              onChange={(e) => handleSubEventChange(index, 'event_date', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                            <Input
                              type="time"
                              value={subEvent.event_time || ''}
                              onChange={(e) => handleSubEventChange(index, 'event_time', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                          </div>
                          
                          <div className="grid md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Google Maps Link"
                              value={subEvent.maps_link || ''}
                              onChange={(e) => handleSubEventChange(index, 'maps_link', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                            <Input
                              placeholder="Instructions"
                              value={subEvent.instructions || ''}
                              onChange={(e) => handleSubEventChange(index, 'instructions', e.target.value)}
                              className="border-2 focus:border-purple-500"
                            />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-4">
                    <Button 
                      type="submit" 
                      disabled={isCreating}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg"
                    >
                      {isCreating ? 'Creating...' : 'Create Event'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => setShowCreateForm(false)}
                      className="border-gray-300 hover:bg-gray-50"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Live Preview Section */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Camera className="h-6 w-6" />
                  Live Preview
                </CardTitle>
                <CardDescription className="text-blue-100">
                  See how your invitation will look
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {previewData && (previewData.title || previewData.description) ? (
                  <div className="space-y-6">
                    {/* Preview Cover */}
                    {previewData.coverImage && (
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100">
                        <Image 
                          src={previewData.coverImage} 
                          alt="Cover preview" 
                          className="object-contain w-full h-full"
                          width={400}
                          height={225}
                          style={{ objectFit: 'contain' }}
                        />
                      </div>
                    )}
                    
                    {/* Preview Content */}
                    <div className="space-y-4">
                      {previewData.title && (
                        <h3 className="text-2xl font-bold text-gray-900 text-center">
                          {previewData.title}
                        </h3>
                      )}
                      
                      {previewData.description && (
                        <p className="text-gray-600 text-center">
                          {previewData.description}
                        </p>
                      )}
                      
                      {(previewData.date || previewData.time) && (
                        <div className="flex items-center justify-center gap-4 text-sm text-gray-500">
                          {previewData.date && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(previewData.date).toLocaleDateString()}
                            </div>
                          )}
                          {previewData.time && (
                            <div className="flex items-center gap-1">
                              <span>🕐</span>
                              {previewData.time}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {previewData.venue && (
                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4" />
                          {previewData.venue}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Start filling the form to see a live preview</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

            {/* Events List */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Event History</h2>
          
          {isLoading ? (
            <div className="text-center py-8">Loading events...</div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
                <p className="text-gray-600 mb-4">Create your first event to get started</p>
                <Button 
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {event.event_date && (
                            <Badge variant="outline">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(event.event_date).toLocaleDateString()}
                            </Badge>
                          )}
                          {event.venue && (
                            <Badge variant="outline">
                              <MapPin className="h-3 w-3 mr-1" />
                              {event.venue}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Created: {new Date(event.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Link href={`/${event.id}`} target="_blank">
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event)
                            setActiveTab('analytics')
                          }}
                        >
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Manage
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => downloadQRCode(event.id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          QR Code
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteEvent(event.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {event.description && (
                      <p className="text-gray-600 mb-4">{event.description}</p>
                    )}
                    
                    <div className="flex gap-4 text-sm text-gray-500">
                      <span>Microsite: /{event.id}</span>
                      {event.maps_link && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto"
                          onClick={() => downloadQRCode(event.id, 'maps')}
                        >
                          Maps QR
                        </Button>
                      )}
                      {event.custom_qr_url && (
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0 h-auto"
                          onClick={() => downloadQRCode(event.id, 'custom')}
                        >
                          {event.custom_qr_title || 'Custom'} QR
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
             {selectedEvent ? (
               <EventAnalytics event={selectedEvent} />
             ) : (
               <Card>
                 <CardContent className="text-center py-8">
                   <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Event</h3>
                   <p className="text-gray-600">Choose an event from the Events tab to view analytics</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

           <TabsContent value="rsvp">
             {selectedEvent ? (
               <RSVPManager event={selectedEvent} />
             ) : (
               <Card>
                 <CardContent className="text-center py-8">
                   <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Event</h3>
                   <p className="text-gray-600">Choose an event from the Events tab to manage RSVPs</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

           <TabsContent value="guestbook">
             {selectedEvent ? (
               <GuestbookManager event={selectedEvent} />
             ) : (
               <Card>
                 <CardContent className="text-center py-8">
                   <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Event</h3>
                   <p className="text-gray-600">Choose an event from the Events tab to manage guestbook entries</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>

           <TabsContent value="settings">
             {selectedEvent ? (
               <MicrositeSettings event={selectedEvent} />
             ) : (
               <Card>
                 <CardContent className="text-center py-8">
                   <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                   <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Event</h3>
                   <p className="text-gray-600">Choose an event from the Events tab to manage settings</p>
                 </CardContent>
               </Card>
             )}
           </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}