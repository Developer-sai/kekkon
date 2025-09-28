'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  MessageSquare, 
  Search, 
  Download, 
  Eye, 
  EyeOff, 
  Trash2,
  Calendar,
  User,
  Heart,
  Star,
  Filter
} from "lucide-react"
import { guestbookOperations, Event, GuestbookEntry } from '@/lib/supabase'

interface GuestbookManagerProps {
  event: Event
}

export default function GuestbookManager({ event }: GuestbookManagerProps) {
  const [entries, setEntries] = useState<GuestbookEntry[]>([])
  const [filteredEntries, setFilteredEntries] = useState<GuestbookEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('all')

  useEffect(() => {
    loadEntries()
  }, [event.id])

  useEffect(() => {
    filterEntries()
  }, [entries, searchTerm, statusFilter])

  const loadEntries = async () => {
    try {
      const entriesData = await guestbookOperations.getEntriesByEvent(event.id)
      setEntries(entriesData)
    } catch (error) {
      console.error('Error loading guestbook entries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filterEntries = () => {
    let filtered = entries

    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.message.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => {
        if (statusFilter === 'approved') return entry.is_approved === true
        if (statusFilter === 'pending') return entry.is_approved === false
        return false
      })
    }

    setFilteredEntries(filtered)
  }

  const handleApproveEntry = async (entryId: string) => {
    try {
      await guestbookOperations.updateEntry(entryId, { is_approved: true })
      await loadEntries()
    } catch (error) {
      console.error('Error approving entry:', error)
      alert('Error approving entry. Please try again.')
    }
  }

  const handleRejectEntry = async (entryId: string) => {
    try {
      await guestbookOperations.updateEntry(entryId, { is_approved: false })
      await loadEntries()
    } catch (error) {
      console.error('Error rejecting entry:', error)
      alert('Error rejecting entry. Please try again.')
    }
  }

  const handleHideEntry = async (entryId: string) => {
    try {
      await guestbookOperations.updateEntry(entryId, { is_approved: false })
      await loadEntries()
    } catch (error) {
      console.error('Error hiding entry:', error)
      alert('Error hiding entry. Please try again.')
    }
  }

  const handleDeleteEntry = async (entryId: string) => {
    if (confirm('Are you sure you want to delete this guestbook entry? This action cannot be undone.')) {
      try {
        await guestbookOperations.deleteEntry(entryId)
        await loadEntries()
      } catch (error) {
        console.error('Error deleting entry:', error)
        alert('Error deleting entry. Please try again.')
      }
    }
  }

  const exportEntries = () => {
    const csvContent = [
      ['Name', 'Message', 'Status', 'Date'],
      ...filteredEntries.map(entry => [
        entry.guest_name,
        entry.message.replace(/"/g, '""'), // Escape quotes for CSV
        entry.is_approved ? 'Approved' : 'Pending',
        new Date(entry.created_at).toLocaleDateString()
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${event.title}-guestbook.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'hidden': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <Eye className="h-3 w-3" />
      case 'pending': return <Filter className="h-3 w-3" />
      case 'hidden': return <EyeOff className="h-3 w-3" />
      default: return null
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Guestbook Management
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
            <MessageSquare className="h-5 w-5" />
            Guestbook Management
          </CardTitle>
          <Button onClick={exportEntries} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        <CardDescription>
          Manage guestbook entries for {event.title} • {filteredEntries.length} entries
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or message..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {['all', 'approved', 'pending', 'hidden'].map(status => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className="capitalize"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['approved', 'pending', 'hidden'].map(status => {
            const count = entries.filter(entry => {
              if (status === 'approved') return entry.is_approved === true
              if (status === 'pending') return entry.is_approved === false
              if (status === 'hidden') return entry.is_approved === false // Assuming hidden is same as not approved
              return false
            }).length
            
            return (
              <div key={status} className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm font-medium text-gray-600 capitalize mb-1 flex items-center gap-1">
                  {getStatusIcon(status)}
                  {status}
                </div>
                <div className="text-2xl font-bold">{count}</div>
              </div>
            )
          })}
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-sm font-medium text-blue-600 mb-1">Total</div>
            <div className="text-2xl font-bold text-blue-900">{entries.length}</div>
          </div>
        </div>

        {/* Entries List */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {entries.length === 0 ? 'No guestbook entries yet' : 'No entries match your filters'}
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <h4 className="font-semibold">{entry.guest_name}</h4>
                      </div>
                      <Badge className={getStatusColor(entry.is_approved ? 'approved' : 'pending')}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(entry.is_approved ? 'approved' : 'pending')}
                          {entry.is_approved ? 'approved' : 'pending'}
                        </span>
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-gray-700 whitespace-pre-wrap">{entry.message}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    {!entry.is_approved && (
                      <Button
                        onClick={() => handleApproveEntry(entry.id)}
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {entry.is_approved && (
                      <Button
                        onClick={() => handleHideEntry(entry.id)}
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDeleteEntry(entry.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}