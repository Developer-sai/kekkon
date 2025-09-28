'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { 
  Users, 
  Search, 
  Download, 
  Mail, 
  Phone, 
  Calendar,
  MapPin,
  Utensils,
  MessageSquare,
  Trash2
} from "lucide-react"
import { rsvpOperations, Event, RSVP } from '@/lib/supabase'

interface RSVPManagerProps {
  event: Event
}

export default function RSVPManager({ event }: RSVPManagerProps) {
  const [rsvps, setRsvps] = useState<RSVP[]>([])
  const [filteredRsvps, setFilteredRsvps] = useState<RSVP[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'attending' | 'not_attending' | 'maybe'>('all')

  useEffect(() => {
    loadRSVPs()
  }, [event.id])

  useEffect(() => {
    filterRSVPs()
  }, [rsvps, searchTerm, statusFilter])

  const loadRSVPs = async () => {
    try {
      const rsvpData = await rsvpOperations.getRSVPsByEvent(event.id)
      setRsvps(rsvpData)
    } catch (error) {
      console.error('Error loading RSVPs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterRSVPs = () => {
    let filtered = rsvps

    if (searchTerm) {
      filtered = filtered.filter(rsvp => 
        rsvp.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rsvp.guest_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rsvp.guest_phone?.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(rsvp => rsvp.attendance_status === statusFilter)
    }

    setFilteredRsvps(filtered)
  }

  const handleDeleteRSVP = async (rsvpId: string) => {
    if (confirm('Are you sure you want to delete this RSVP?')) {
      try {
        await rsvpOperations.deleteRSVP(rsvpId)
        await loadRSVPs()
      } catch (error) {
        console.error('Error deleting RSVP:', error)
        alert('Error deleting RSVP. Please try again.')
      }
    }
  }

  const exportRSVPs = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Status', 'Guests', 'Dietary Requirements', 'Special Requests', 'Date'],
      ...filteredRsvps.map(rsvp => [
        rsvp.guest_name,
        rsvp.guest_email || '',
        rsvp.guest_phone || '',
        rsvp.attendance_status,
        rsvp.number_of_guests,
        rsvp.dietary_requirements || '',
        rsvp.special_requests || '',
        new Date(rsvp.created_at).toLocaleDateString()
      ])
    ].map((row: (string | number)[]) => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.title}-rsvps.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attending': return 'bg-green-100 text-green-800'
      case 'not_attending': return 'bg-red-100 text-red-800'
      case 'maybe': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTotalGuests = () => {
    return filteredRsvps.reduce((total, rsvp) => total + rsvp.number_of_guests, 0)
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            RSVP Management
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            RSVP Management
          </CardTitle>
          <Button onClick={exportRSVPs} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <CardDescription>
          Manage RSVPs for {event.title} • {filteredRsvps.length} responses • {getTotalGuests()} total guests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'attending', 'not_attending', 'maybe'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="capitalize"
              >
                {status === 'all' ? 'All' : status.replace('_', ' ')}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['attending', 'not_attending', 'maybe'].map(status => {
            const count = rsvps.filter(rsvp => rsvp.attendance_status === status).length
            const guests = rsvps
              .filter(rsvp => rsvp.attendance_status === status)
              .reduce((sum, rsvp) => sum + rsvp.number_of_guests, 0)
            
            return (
              <div key={status} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                  {status.replace('_', ' ')}
                </div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-500">{guests} guests</div>
              </div>
            )
          })}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-blue-900">{rsvps.length}</div>
            <div className="text-sm text-blue-600">{getTotalGuests()} guests</div>
          </div>
        </div>

        {/* RSVP List */}
        <div className="space-y-4">
          {filteredRsvps.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {rsvps.length === 0 ? 'No RSVPs yet' : 'No RSVPs match your filters'}
            </div>
          ) : (
            filteredRsvps.map((rsvp) => (
              <div key={rsvp.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-semibold">{rsvp.guest_name}</h4>
                      <Badge className={getStatusColor(rsvp.attendance_status)}>
                        {rsvp.attendance_status.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {rsvp.number_of_guests} {rsvp.number_of_guests === 1 ? 'guest' : 'guests'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {rsvp.guest_email && (
                        <div className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {rsvp.guest_email}
                        </div>
                      )}
                      {rsvp.guest_phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {rsvp.guest_phone}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(rsvp.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDeleteRSVP(rsvp.id)}
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {(rsvp.dietary_requirements || rsvp.special_requests) && (
                  <div className="space-y-2 pt-2 border-t">
                    {rsvp.dietary_requirements && (
                      <div className="flex items-start gap-2">
                        <Utensils className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">Dietary Requirements:</span>
                          <p className="text-sm text-gray-600">{rsvp.dietary_requirements}</p>
                        </div>
                      </div>
                    )}
                    {rsvp.special_requests && (
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium">Special Requests:</span>
                          <p className="text-sm text-gray-600">{rsvp.special_requests}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {rsvp.sub_event_rsvps && rsvp.sub_event_rsvps.length > 0 && (
                  <div className="pt-2 border-t">
                    <span className="text-sm font-medium">Sub-event Attendance:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {rsvp.sub_event_rsvps.map((subRsvp, index) => (
                        <Badge 
                          key={index} 
                          variant={subRsvp.attending ? "default" : "secondary"}
                          className="text-xs"
                        >
                          Event {index + 1}: {subRsvp.attending ? 'Yes' : 'No'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}