'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { 
  Settings, 
  Palette, 
  Eye, 
  Save, 
  RotateCcw,
  Monitor,
  Smartphone,
  ExternalLink
} from "lucide-react"
import { micrositeOperations, Event, MicrositeSettings as MicrositeSettingsType } from '@/lib/supabase'

interface MicrositeSettingsProps {
  event: Event
}

const defaultSettings: Partial<MicrositeSettingsType> = {
  theme_color: '#3b82f6',
  background_style: '#ffffff',
  font_family: 'Inter',
  enable_rsvp: true,
  enable_guestbook: true,
  enable_gallery: true,
  enable_social_links: true,
  enable_maps: true,
  enable_screenshot_blocking: true
}

export default function MicrositeSettings({ event }: MicrositeSettingsProps) {
  const [settings, setSettings] = useState<Partial<MicrositeSettingsType>>(defaultSettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  useEffect(() => {
    loadSettings()
  }, [event.id])

  const loadSettings = async () => {
    try {
      const settingsData = await micrositeOperations.getSettings(event.id)
      if (settingsData) {
        setSettings({ ...defaultSettings, ...settingsData })
      }
    } catch (error) {
      console.error('Error loading microsite settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await micrositeOperations.updateSettings(event.id, settings)
      alert('Microsite settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(defaultSettings)
    }
  }

  const handleColorChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleSwitchChange = (field: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const previewUrl = `${window.location.origin}/${event.card_id}`

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Microsite Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Microsite Settings
              </CardTitle>
              <CardDescription>
                Customize the appearance and functionality of your event microsite
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => window.open(previewUrl, '_blank')}
                variant="outline"
                size="sm"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button onClick={handleReset} variant="outline" size="sm">
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Theme Colors */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Theme Colors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="theme_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="theme_color"
                    type="color"
                    value={settings.theme_color || '#3b82f6'}
                    onChange={(e) => handleColorChange('theme_color', e.target.value)}
                    className="w-16 h-10 p-1 border rounded"
                  />
                  <Input
                    value={settings.theme_color || '#3b82f6'}
                    onChange={(e) => handleColorChange('theme_color', e.target.value)}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Typography</h3>
            <div className="space-y-2">
              <Label htmlFor="font_family">Font Family</Label>
              <select
                id="font_family"
                value={settings.font_family || 'Inter'}
                onChange={(e) => handleInputChange('font_family', e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="Inter">Inter</option>
                <option value="Roboto">Roboto</option>
                <option value="Open Sans">Open Sans</option>
                <option value="Lato">Lato</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Poppins">Poppins</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Merriweather">Merriweather</option>
              </select>
            </div>
          </div>

          {/* Feature Toggles */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'enable_rsvp', label: 'RSVP Form', description: 'Allow guests to RSVP to the event' },
                { key: 'enable_guestbook', label: 'Guestbook', description: 'Enable guest messages and wishes' },
                { key: 'enable_gallery', label: 'Photo Gallery', description: 'Display event images' },
                { key: 'enable_social_links', label: 'Social Links', description: 'Show social media links' },
                { key: 'enable_maps', label: 'Maps', description: 'Display venue location and maps' },
                { key: 'enable_screenshot_blocking', label: 'Screenshot Blocking', description: 'Prevent screenshots of the microsite' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor={key} className="font-medium">{label}</Label>
                    <p className="text-sm text-gray-600">{description}</p>
                  </div>
                  <Switch
                    id={key}
                    checked={settings[key as keyof MicrositeSettingsType] as boolean || false}
                    onCheckedChange={(checked) => handleSwitchChange(key, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant={previewMode === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-4 w-4 mr-2" />
                Desktop
              </Button>
              <Button
                variant={previewMode === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPreviewMode('mobile')}
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Mobile
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`border rounded-lg overflow-hidden ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''}`}>
            <div 
              className="p-6 min-h-96"
              style={{
                backgroundColor: settings.background_style,
                fontFamily: settings.font_family
              }}
            >
              <div className="text-center space-y-4">
                <h1 
                  className="text-3xl font-bold"
                  style={{ color: settings.theme_color }}
                >
                  {event.title}
                </h1>
                <div className="space-y-2">
                  <p><strong>Date:</strong> {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'TBD'}</p>
                  <p><strong>Location:</strong> {event.venue || 'TBD'}</p>
                </div>
                <div className="flex justify-center gap-4 mt-6">
                  {settings.enable_rsvp && (
                    <button 
                      className="px-4 py-2 rounded-md text-white font-medium"
                      style={{ backgroundColor: settings.theme_color }}
                    >
                      RSVP Now
                    </button>
                  )}
                  {settings.enable_guestbook && (
                    <button 
                      className="px-4 py-2 rounded-md border font-medium"
                      style={{ 
                        borderColor: settings.theme_color,
                        color: settings.theme_color 
                      }}
                    >
                      Sign Guestbook
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}