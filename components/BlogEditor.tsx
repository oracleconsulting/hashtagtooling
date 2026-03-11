'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, EyeOff, Upload, Bold, Italic, Heading2, Heading3, Link2, List } from 'lucide-react'

// ---------------------------------------------------------------------------
// Minimal markdown → HTML renderer (no external dependency)
// ---------------------------------------------------------------------------
function renderMarkdown(md: string): string {
  if (!md) return ''
  let html = md
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // Headings
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-xl font-heading font-semibold text-white mt-6 mb-2">$1</h3>')
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-2xl font-heading font-bold text-white mt-8 mb-3">$1</h2>')
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-3xl font-heading font-bold text-white mt-8 mb-4">$1</h1>')

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-brand-orange underline hover:opacity-80">$1</a>')

  // Images
  html = html.replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="rounded-lg my-4 max-w-full" />')

  // Unordered lists — group consecutive - lines
  html = html.replace(/(^- .+$(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li class="ml-4 list-disc">${line.replace(/^- /, '')}</li>`).join('\n')
    return `<ul class="my-4 space-y-1 text-zinc-300">\n${items}\n</ul>\n`
  })

  // Ordered lists
  html = html.replace(/(^\d+\. .+$(\n|$))+/gm, (block) => {
    const items = block.trim().split('\n').map(line => `<li class="ml-4 list-decimal">${line.replace(/^\d+\. /, '')}</li>`).join('\n')
    return `<ol class="my-4 space-y-1 text-zinc-300">\n${items}\n</ol>\n`
  })

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr class="border-brand-dark-border my-8" />')

  // Blockquote
  html = html.replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-brand-orange pl-4 italic text-zinc-400 my-4">$1</blockquote>')

  // Paragraphs: lines that aren't already HTML tags
  const lines = html.split('\n')
  const result: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      result.push('')
    } else if (/^<(h[1-6]|ul|ol|li|blockquote|hr|img)/.test(trimmed)) {
      result.push(trimmed)
    } else {
      result.push(`<p class="text-zinc-300 leading-relaxed mb-4">${trimmed}</p>`)
    }
  }
  return result.join('\n')
}

// ---------------------------------------------------------------------------
// Slug generator
// ---------------------------------------------------------------------------
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PostFormData {
  id?: string
  title: string
  slug: string
  excerpt: string
  content: string
  featured_image_url: string
  published: boolean
  published_at: string
  meta_title: string
  meta_description: string
}

interface BlogEditorProps {
  initialData?: PostFormData
  mode: 'new' | 'edit'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function BlogEditor({ initialData, mode }: BlogEditorProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(mode === 'edit')

  const [form, setForm] = useState<PostFormData>(
    initialData || {
      title: '',
      slug: '',
      excerpt: '',
      content: '',
      featured_image_url: '',
      published: false,
      published_at: '',
      meta_title: '',
      meta_description: '',
    }
  )

  const update = (field: keyof PostFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleTitleChange = (value: string) => {
    update('title', value)
    if (!slugManuallyEdited) {
      update('slug', generateSlug(value))
    }
  }

  // ---------------------------------------------------------------------------
  // Toolbar helpers — insert markdown syntax into textarea
  // ---------------------------------------------------------------------------
  const insertMarkdown = useCallback((prefix: string, suffix: string = '') => {
    const ta = document.getElementById('md-editor') as HTMLTextAreaElement | null
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const selected = form.content.substring(start, end)
    const newContent =
      form.content.substring(0, start) +
      prefix + (selected || 'text') + suffix +
      form.content.substring(end)
    update('content', newContent)
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(start + prefix.length, start + prefix.length + (selected || 'text').length)
    }, 0)
  }, [form.content])

  // ---------------------------------------------------------------------------
  // Featured image upload
  // ---------------------------------------------------------------------------
  const uploadFeaturedImage = async (file: File) => {
    setUploadingImage(true)
    try {
      let processedFile = file
      let fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      if (fileExt === 'heic' || fileExt === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
        let converted = false

        try {
          const heic2any = (await import('heic2any')).default
          const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.85 })
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
          processedFile = new File([blob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
          fileExt = 'jpg'
          converted = true
        } catch (heicError) {
          console.warn('heic2any failed, trying canvas fallback:', heicError)
        }

        if (!converted) {
          try {
            const bitmap = await createImageBitmap(file)
            const canvas = document.createElement('canvas')
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(bitmap, 0, 0)
            const jpegBlob = await new Promise<Blob>((resolve, reject) => {
              canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
                'image/jpeg',
                0.85
              )
            })
            processedFile = new File([jpegBlob], file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg'), { type: 'image/jpeg' })
            fileExt = 'jpg'
            converted = true
            bitmap.close()
          } catch (canvasError) {
            console.error('Canvas HEIC fallback also failed:', canvasError)
          }
        }

        if (!converted) {
          alert(`Could not convert ${file.name}. Try using the Files app on your iPhone to convert to JPG first, or take a screenshot of the photo.`)
          setUploadingImage(false)
          return
        }
      }
      const filePath = `featured/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('blog-images').upload(filePath, processedFile, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from('blog-images').getPublicUrl(filePath)
      update('featured_image_url', data.publicUrl)
    } catch (err) {
      console.error('Image upload error:', err)
      alert('Failed to upload image. Make sure the blog-images storage bucket exists in Supabase.')
    } finally {
      setUploadingImage(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------
  const save = async (publishNow?: boolean) => {
    if (!form.title.trim()) { alert('Title is required'); return }
    if (!form.slug.trim()) { alert('Slug is required'); return }
    setSaving(true)

    const shouldPublish = publishNow !== undefined ? publishNow : form.published
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      excerpt: form.excerpt.trim() || null,
      content: form.content,
      featured_image_url: form.featured_image_url.trim() || null,
      published: shouldPublish,
      published_at: shouldPublish ? (form.published_at || new Date().toISOString()) : null,
      meta_title: form.meta_title.trim() || null,
      meta_description: form.meta_description.trim() || (form.excerpt.trim().slice(0, 160) || null),
    }

    try {
      if (mode === 'edit' && form.id) {
        const { error } = await supabase.from('blog_posts').update(payload).eq('id', form.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('blog_posts').insert(payload)
        if (error) throw error
      }
      router.push('/admin/blog')
    } catch (err: unknown) {
      console.error('Save error:', err)
      const message = err instanceof Error ? err.message : 'Failed to save post'
      alert(message.includes('duplicate') ? 'A post with this slug already exists. Please change the slug.' : message)
    } finally {
      setSaving(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="container mx-auto px-4 py-12 max-w-5xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">
          {mode === 'new' ? 'New Post' : 'Edit Post'}
        </h1>
        <Link href="/admin/blog">
          <Button variant="outline" size="sm">← All Posts</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor column */}
        <div className="lg:col-span-2 space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Title *</label>
            <Input
              value={form.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Your post title"
              className="bg-brand-dark border-brand-dark-border text-white text-lg"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Slug *</label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-500 text-sm shrink-0">hashtag.guru/blog/</span>
              <Input
                value={form.slug}
                onChange={(e) => {
                  setSlugManuallyEdited(true)
                  update('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-'))
                }}
                placeholder="post-url-slug"
                className="bg-brand-dark border-brand-dark-border text-white font-mono"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1.5">Excerpt</label>
            <Textarea
              value={form.excerpt}
              onChange={(e) => update('excerpt', e.target.value)}
              placeholder="Short summary shown on blog listing and used as meta description if not overridden"
              rows={2}
              className="bg-brand-dark border-brand-dark-border text-white resize-none"
            />
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-zinc-300">Content (Markdown)</label>
              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-brand-orange transition-colors"
              >
                {previewMode ? <><EyeOff className="h-3.5 w-3.5" /> Edit</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
              </button>
            </div>

            {/* Toolbar */}
            {!previewMode && (
              <div className="flex gap-1 mb-1 p-1.5 bg-zinc-800 border border-brand-dark-border rounded-t-md border-b-0">
                {[
                  { icon: <Heading2 className="h-4 w-4" />, title: 'Heading 2', action: () => insertMarkdown('## ') },
                  { icon: <Heading3 className="h-4 w-4" />, title: 'Heading 3', action: () => insertMarkdown('### ') },
                  { icon: <Bold className="h-4 w-4" />, title: 'Bold', action: () => insertMarkdown('**', '**') },
                  { icon: <Italic className="h-4 w-4" />, title: 'Italic', action: () => insertMarkdown('*', '*') },
                  { icon: <Link2 className="h-4 w-4" />, title: 'Link', action: () => insertMarkdown('[', '](https://)') },
                  { icon: <List className="h-4 w-4" />, title: 'List item', action: () => insertMarkdown('- ') },
                ].map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    title={btn.title}
                    onClick={btn.action}
                    className="p-1.5 rounded text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                  >
                    {btn.icon}
                  </button>
                ))}
                <span className="ml-auto text-xs text-zinc-500 self-center pr-1">Markdown</span>
              </div>
            )}

            {previewMode ? (
              <div
                className="min-h-[400px] p-4 bg-brand-dark border border-brand-dark-border rounded-md prose-invert"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
              />
            ) : (
              <textarea
                id="md-editor"
                value={form.content}
                onChange={(e) => update('content', e.target.value)}
                placeholder={`Write your post in Markdown...\n\n## A heading\n\nSome paragraph text.\n\n- A list item\n- Another item`}
                rows={20}
                className="w-full min-h-[400px] p-4 bg-brand-dark border border-brand-dark-border rounded-b-md text-white font-mono text-sm resize-y focus:outline-none focus:ring-1 focus:ring-brand-orange"
              />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">

          {/* Publish controls */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Publish</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.published}
                  onChange={(e) => update('published', e.target.checked)}
                  className="accent-brand-orange"
                />
                <span className="text-sm text-zinc-300">Published</span>
              </label>
              {form.published && (
                <div>
                  <label className="block text-xs text-zinc-500 mb-1">Published date</label>
                  <input
                    type="date"
                    value={form.published_at ? form.published_at.slice(0, 10) : new Date().toISOString().slice(0, 10)}
                    onChange={(e) => update('published_at', new Date(e.target.value).toISOString())}
                    className="w-full px-2 py-1.5 bg-brand-dark border border-brand-dark-border text-white text-sm rounded"
                  />
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <Button onClick={() => save()} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save'}
              </Button>
              {!form.published && (
                <Button onClick={() => { update('published', true); save(true) }} disabled={saving} variant="outline" className="w-full text-green-400 border-green-800 hover:bg-green-900/20">
                  Save & Publish
                </Button>
              )}
            </div>
          </div>

          {/* Featured image */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">Featured Image</h3>
            {form.featured_image_url && (
              <div className="mb-3 rounded overflow-hidden aspect-video bg-brand-dark">
                <img src={form.featured_image_url} alt="Featured" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Input
                value={form.featured_image_url}
                onChange={(e) => update('featured_image_url', e.target.value)}
                placeholder="Image URL"
                className="bg-brand-dark border-brand-dark-border text-white text-sm"
              />
              <div className="relative">
                <input
                  type="file"
                  id="blog-image-upload"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.HEIC,.heif,.HEIF"
                  className="hidden"
                  onChange={(e) => { if (e.target.files?.[0]) uploadFeaturedImage(e.target.files[0]) }}
                />
                <label
                  htmlFor="blog-image-upload"
                  className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-dashed border-zinc-600 rounded text-sm text-zinc-400 hover:text-white hover:border-zinc-400 cursor-pointer transition-colors"
                >
                  {uploadingImage ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</>
                  ) : (
                    <><Upload className="h-4 w-4" /> Upload image</>
                  )}
                </label>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-white font-medium mb-3">SEO</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Meta title <span className="text-zinc-600">(uses post title if empty)</span></label>
                <Input
                  value={form.meta_title}
                  onChange={(e) => update('meta_title', e.target.value)}
                  placeholder={form.title || 'Post title'}
                  className="bg-brand-dark border-brand-dark-border text-white text-sm"
                />
                <p className="text-xs text-zinc-600 mt-0.5">{(form.meta_title || form.title).length}/60</p>
              </div>
              <div>
                <label className="block text-xs text-zinc-500 mb-1">Meta description <span className="text-zinc-600">(uses excerpt if empty)</span></label>
                <Textarea
                  value={form.meta_description}
                  onChange={(e) => update('meta_description', e.target.value)}
                  placeholder={form.excerpt || 'Short description for search engines'}
                  rows={3}
                  className="bg-brand-dark border-brand-dark-border text-white text-sm resize-none"
                />
                <p className="text-xs text-zinc-600 mt-0.5">{(form.meta_description || form.excerpt).length}/160</p>
              </div>
            </div>
          </div>

          {/* Markdown cheat sheet */}
          <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
            <h3 className="text-zinc-400 text-xs font-medium mb-2 uppercase tracking-wider">Markdown Reference</h3>
            <pre className="text-xs text-zinc-500 leading-relaxed font-mono whitespace-pre-wrap">{`# Heading 1
## Heading 2
### Heading 3

**bold**  *italic*

[link text](https://url)
![alt](image-url)

- Bullet item
1. Numbered item

> Blockquote

---  (horizontal rule)`}</pre>
          </div>
        </div>
      </div>
    </div>
  )
}
