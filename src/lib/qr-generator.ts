import QRCode from 'qrcode'
import { supabase } from './supabase'

export interface QRCodeOptions {
  width?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
}

export const qrGenerator = {
  // Generate QR code as data URL
  async generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }

      // Set canvas size
      canvas.width = defaultOptions.width || 300
      canvas.height = defaultOptions.width || 300

      // Generate QR code
      QRCode.toCanvas(canvas, text, {
        width: defaultOptions.width,
        margin: defaultOptions.margin,
        color: {
          dark: defaultOptions.color?.dark || '#000000',
          light: defaultOptions.color?.light || '#FFFFFF'
        }
      })

      return canvas.toDataURL('image/png')
    } catch (error) {
      console.error('Error generating QR code:', error)
      throw error
    }
  },

  // Generate QR code as buffer
  async generateQRCodeBuffer(text: string, options: QRCodeOptions = {}): Promise<Buffer> {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      ...options
    }

    try {
      const buffer = await QRCode.toBuffer(text, defaultOptions)
      return buffer
    } catch (error) {
      console.error('Error generating QR code buffer:', error)
      throw new Error('Failed to generate QR code buffer')
    }
  },

  // Generate and upload QR code to Supabase storage
  async generateAndUploadQRCode(
    eventId: string, 
    url: string, 
    type: 'main' | 'maps' | 'custom' = 'main'
  ): Promise<string> {
    try {
      // Generate QR code buffer
      const qrBuffer = await this.generateQRCodeBuffer(url)
      
      // Create file path
      const fileName = `${eventId}-${type}-qr.png`
      const filePath = `qr-codes/${fileName}`
      
      // Upload to Supabase storage
      const { error } = await supabase.storage
        .from('event-images')
        .upload(filePath, qrBuffer, {
          contentType: 'image/png',
          upsert: true
        })
      
      if (error) throw error
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath)
      
      return publicUrl
    } catch (error) {
      console.error('Error generating and uploading QR code:', error)
      throw new Error('Failed to generate and upload QR code')
    }
  },

  generateEventQRCodes: async (eventId: string, mapsLink?: string, customUrl?: string, baseUrl: string = 'http://localhost:3000') => {
    try {
      const mainQR = await qrGenerator.generateQRCode(`${baseUrl}/${eventId}`)
      const mapsQR = mapsLink ? await qrGenerator.generateQRCode(mapsLink) : null
      const customQR = customUrl ? await qrGenerator.generateQRCode(customUrl) : null
      
      return {
        main: mainQR,
        maps: mapsQR,
        custom: customQR
      }
    } catch (error) {
      console.error('Error generating event QR codes:', error)
      throw new Error('Failed to generate event QR codes')
    }
  },

  // Download QR code as file
  downloadQRCode: async (text: string, filename: string = 'qr-code.png', options: QRCodeOptions = {}) => {
    try {
      const dataURL = await qrGenerator.generateQRCode(text, options)
      
      // Create download link
      const link = document.createElement('a')
      link.href = dataURL
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error downloading QR code:', error)
      throw error
    }
  },

  // Generate QR code directly to canvas
  generateQRCodeForCanvas: (canvas: HTMLCanvasElement, text: string, options: QRCodeOptions = {}) => {
    const defaultOptions = {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    }
    const mergedOptions = { ...defaultOptions, ...options }
    
    return QRCode.toCanvas(canvas, text, mergedOptions)
  }
}