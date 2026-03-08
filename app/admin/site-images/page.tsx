'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Upload, Check, ArrowLeft, Loader2, Trash2 } from 'lucide-react'

interface SiteImage {
  id: string
  section_key: string
  image_url: string
  alt_text: string
  updated_at: string
}

const SECTION_CONFIG = [
  {
    key: 'hero_background',
    title: 'Hero Background',
    description: 'Full-width background image behind "THE HASHTAG MALLET" heading. Recommended: 1920x1080px or larger, landscape orientation. A dramatic workshop shot or close-up of wood grain works well here.',
    aspect: 'aspect-[16/9]',
    accept: 'image/jpeg,image/png,image/webp,.heic,.HEIC',
  },
  {
    key: 'hero_video',
    title: 'Hero Background Video',
    description: 'Looping workshop video for homepage hero (MP4, recommended 1920x1080, under 15MB). Falls back to static image on mobile.',
    aspect: 'aspect-[16/9]',
    accept: 'video/mp4',
  },
  {
    key: 'wood_collection',
    title: 'Wood Collection',
    accept: 'image/jpeg,image/png,image/webp,.heic,.HEIC',
    description: 'Displayed next to the "WOOD CHOICE" text section. Should show your exotic wood collection — timber blanks, turning blanks, end grain patterns. Recommended: 800x600px or larger.',
    aspect: 'aspect-[4/3]',
  },
  {
    key: 'brass_transitions',
    title: 'Brass & Copper Transitions',
    accept: 'image/jpeg,image/png,image/webp,.heic,.HEIC',
    description: 'Displayed next to "THE TRANSITION" text section. Should show your transition materials — brass rings, copper dowels, mokume gane pieces on the workbench. Recommended: 800x600px or larger.',
    aspect: 'aspect-[4/3]',
  },
  {
    key: 'mallet_lineup',
    title: 'Mallet Lineup',
    accept: 'image/jpeg,image/png,image/webp,.heic,.HEIC',
    description: 'Displayed next to "TOTALLY UNIQUE AND PERSONAL" text. Should show a row/group of different completed mallets showcasing variety. Recommended: 800x600px or larger.',
    aspect: 'aspect-[4/3]',
  },
]

export default function AdminSiteImagesPage() {
  const router = useRouter()
  const [siteImages, setSiteImages] = useState<SiteImage[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingSection, setUploadingSection] = useState<string | null>(null)
  const [successSection, setSuccessSection] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadImages()
  }, [router])

  const loadImages = async () => {
    try {
      const { data, error } = await supabase
        .from('site_images')
        .select('*')
        .order('section_key')

      if (error) throw error
      setSiteImages(data || [])
    } catch (error) {
      console.error('Error loading site images:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (sectionKey: string, file: File) => {
    setUploadingSection(sectionKey)
    setSuccessSection(null)

    try {
      let processedFile: File = file
      let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const isVideo = sectionKey === 'hero_video' || file.type.startsWith('video/')

      // Convert HEIC/HEIF to JPEG only for images
      if (!isVideo && (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif')) {
        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          })
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          processedFile = new File(
            [blob],
            file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'),
            { type: 'image/jpeg' }
          )
          fileExt = 'jpg'
        } catch (conversionError) {
          console.error('HEIC conversion failed:', conversionError)
          alert(`Could not convert ${file.name}. Try converting to JPG before uploading.`)
          setUploadingSection(null)
          return
        }
      }

      if (isVideo) fileExt = 'mp4'

      // Generate unique filename
      const fileName = `${sectionKey}-${Date.now()}.${fileExt}`
      const filePath = `homepage/${fileName}`

      // Upload to Supabase Storage bucket "site-images"
      const { error: uploadError } = await supabase.storage
        .from('site-images')
        .upload(filePath, processedFile, { upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        alert(`Upload failed: ${uploadError.message}. Make sure you have created a public storage bucket called "site-images" in Supabase Dashboard → Storage.`)
        return
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('site-images')
        .getPublicUrl(filePath)

      if (!urlData?.publicUrl) {
        alert('Failed to get public URL for uploaded image')
        return
      }

      const publicUrl = urlData.publicUrl

      // Check if row exists for this section
      const existing = siteImages.find(img => img.section_key === sectionKey)

      if (existing) {
        // Update existing row
        const { error: updateError } = await supabase
          .from('site_images')
          .update({ image_url: publicUrl })
          .eq('section_key', sectionKey)

        if (updateError) throw updateError
      } else {
        // Insert new row
        const config = SECTION_CONFIG.find(s => s.key === sectionKey)
        const { error: insertError } = await supabase
          .from('site_images')
          .insert({
            section_key: sectionKey,
            image_url: publicUrl,
            alt_text: config?.title || sectionKey,
          })

        if (insertError) throw insertError
      }

      // Reload images
      await loadImages()
      setSuccessSection(sectionKey)
      setTimeout(() => setSuccessSection(null), 3000)
    } catch (error) {
      console.error('Error uploading image:', error)
      alert('Failed to save image. Check console for details.')
    } finally {
      setUploadingSection(null)
    }
  }

  const handleRemove = async (sectionKey: string) => {
    if (!confirm('Remove this image? The section will show as a dark placeholder until a new image is uploaded.')) return

    try {
      const { error } = await supabase
        .from('site_images')
        .update({ image_url: '' })
        .eq('section_key', sectionKey)

      if (error) throw error
      await loadImages()
    } catch (error) {
      console.error('Error removing image:', error)
      alert('Failed to remove image')
    }
  }

  const getImageUrl = (sectionKey: string): string => {
    const img = siteImages.find(i => i.section_key === sectionKey)
    return img?.image_url || ''
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link href="/admin/dashboard" className="text-zinc-400 hover:text-brand-orange text-sm mb-2 inline-flex items-center gap-1 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <Link href="/admin/products" className="text-zinc-400 hover:text-brand-orange text-sm mb-2 ml-2 inline-flex items-center gap-1 transition-colors">
            Products
          </Link>
          <h1 className="font-heading text-4xl font-bold text-brand-orange">Site Images</h1>
          <p className="text-zinc-400 mt-1">Upload and manage homepage section images</p>
        </div>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      <div className="space-y-8">
        {SECTION_CONFIG.map((section) => {
          const currentUrl = getImageUrl(section.key)
          const isUploading = uploadingSection === section.key
          const isSuccess = successSection === section.key

          return (
            <Card key={section.key} className="bg-brand-dark-card border border-brand-dark-border">
              <CardHeader>
                <CardTitle className="text-white">{section.title}</CardTitle>
                <p className="text-zinc-400 text-sm mt-1">{section.description}</p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className={`${section.aspect} bg-brand-dark border border-brand-dark-border rounded-lg overflow-hidden relative`}>
                    {currentUrl ? (
                      <>
                        {section.key === 'hero_video' ? (
                          <video
                            src={currentUrl}
                            muted
                            loop
                            playsInline
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Image
                            src={currentUrl}
                            alt={section.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 50vw"
                          />
                        )}
                        <button
                          onClick={() => handleRemove(section.key)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 hover:bg-red-700 transition-colors"
                          title="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-zinc-500 text-sm italic">No image uploaded</p>
                      </div>
                    )}
                  </div>

                  {/* Upload Area */}
                  <div className="flex flex-col justify-center">
                    <div className="border-2 border-dashed border-brand-dark-border rounded-lg p-8 text-center">
                      <Upload className="mx-auto h-10 w-10 text-zinc-500 mb-4" />
                      <input
                        type="file"
                        accept={section.accept || 'image/jpeg,image/png,image/webp,.heic,.HEIC'}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(section.key, file)
                          e.target.value = ''
                        }}
                        className="hidden"
                        id={`upload-${section.key}`}
                        disabled={isUploading}
                      />
                      <label htmlFor={`upload-${section.key}`} className="cursor-pointer">
                        <Button type="button" disabled={isUploading} className="pointer-events-none">
                          {isUploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : isSuccess ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Uploaded!
                            </>
                          ) : currentUrl ? (
                            'Replace Image'
                          ) : (
                            'Upload Image'
                          )}
                        </Button>
                      </label>
                      <p className="text-xs text-zinc-500 mt-3">
                        {section.key === 'hero_video' ? 'MP4. Max 15MB.' : 'JPG, PNG, or WEBP. Max 5MB.'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Instructions */}
      <Card className="mt-8 bg-brand-dark-card border border-brand-dark-border">
        <CardContent className="p-6">
          <h3 className="text-white font-semibold mb-3">Setup Instructions</h3>
          <div className="text-zinc-400 text-sm space-y-2">
            <p>1. In your Supabase Dashboard, go to <strong className="text-zinc-300">Storage</strong> and create a new bucket called <strong className="text-zinc-300">site-images</strong></p>
            <p>2. Set the bucket to <strong className="text-zinc-300">Public</strong> (so images can be displayed on the website)</p>
            <p>3. Run the SQL migration file <strong className="text-zinc-300">supabase-migration-site-images.sql</strong> in the Supabase SQL Editor</p>
            <p>4. Upload your images using the sections above</p>
            <p>5. Images will appear on the homepage immediately after upload</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
