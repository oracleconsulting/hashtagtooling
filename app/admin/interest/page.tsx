'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Loader2, Plus, ArrowUp, ArrowDown, Trash2, X, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/lib/image-utils'
import {
  parseQuestions,
  type InterestList,
  type InterestListStatus,
  type InterestQuestion,
  type InterestSignup,
} from '@/lib/interest'

type ListRow = InterestList & { signup_count: number }

const emptyQuestion = (): InterestQuestion => ({
  key: '',
  label: '',
  type: 'single',
  required: false,
  options: [''],
})

const emptyForm = () => ({
  id: '',
  slug: '',
  name: '',
  tagline: '',
  description: '',
  hero_image_url: '',
  gallery_images: [] as string[],
  price_from: '',
  price_to: '',
  expected_launch: '',
  status: 'draft' as InterestListStatus,
  show_count: false,
  questions: [] as InterestQuestion[],
  launched_product_id: '',
})

type FormState = ReturnType<typeof emptyForm>

function listToForm(list: InterestList): FormState {
  return {
    id: list.id,
    slug: list.slug,
    name: list.name,
    tagline: list.tagline || '',
    description: list.description || '',
    hero_image_url: list.hero_image_url || '',
    gallery_images: Array.isArray(list.gallery_images) ? [...list.gallery_images] : [],
    price_from: list.price_from === null || list.price_from === undefined ? '' : String(list.price_from),
    price_to: list.price_to === null || list.price_to === undefined ? '' : String(list.price_to),
    expected_launch: list.expected_launch || '',
    status: list.status,
    show_count: list.show_count,
    questions: parseQuestions(list.questions).map((q) => ({
      ...q,
      options: q.type === 'text' ? [] : [...(q.options || [])],
    })),
    launched_product_id: list.launched_product_id || '',
  }
}

function statusBadge(status: InterestListStatus) {
  const styles: Record<InterestListStatus, string> = {
    draft: 'bg-zinc-800 text-zinc-400',
    open: 'bg-green-900/50 text-green-400',
    closed: 'bg-amber-900/50 text-amber-400',
    launched: 'bg-brand-orange/20 text-brand-orange',
  }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  )
}

function formatAnswer(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ')
  if (value === null || value === undefined) return '—'
  return String(value)
}

export default function AdminInterestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [lists, setLists] = useState<ListRow[]>([])
  const [form, setForm] = useState<FormState>(emptyForm())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)

  const [drawerSlug, setDrawerSlug] = useState<string | null>(null)
  const [drawerList, setDrawerList] = useState<InterestList | null>(null)
  const [signups, setSignups] = useState<InterestSignup[]>([])
  const [drawerLoading, setDrawerLoading] = useState(false)

  const [notifySubject, setNotifySubject] = useState('')
  const [notifyMessage, setNotifyMessage] = useState('')
  const [notifyLink, setNotifyLink] = useState('')
  const [notifying, setNotifying] = useState(false)
  const [uploadingHero, setUploadingHero] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) { router.push('/admin'); return }
    loadLists()
  }, [router])

  const loadLists = async () => {
    try {
      const res = await fetch('/api/interest/lists', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setLists(data.lists || [])
    } catch (err) {
      console.error('Error loading interest lists:', err)
    } finally {
      setLoading(false)
    }
  }

  const openNew = () => {
    setForm(emptyForm())
    setFormError('')
    setPanelOpen(true)
  }

  const openEdit = (list: ListRow) => {
    setForm(listToForm(list))
    setFormError('')
    setPanelOpen(true)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    let processed = file
    let ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    if (ext === 'heic' || ext === 'heif' || file.type === 'image/heic' || file.type === 'image/heif') {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/convert-heic', { method: 'POST', body: fd })
      if (!res.ok) {
        alert('Could not convert that iPhone photo. Export it as JPG first.')
        return null
      }
      processed = new File([await res.blob()], file.name.replace(/\.hei[cf]$/i, '.jpg'), { type: 'image/jpeg' })
      ext = 'jpg'
    }
    try {
      processed = await compressImage(processed)
      ext = 'jpg'
    } catch {
      // upload original
    }
    const path = `interest/${Math.random().toString(36).slice(2)}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('products').upload(path, processed)
    if (error) {
      console.error('Interest image upload error:', error)
      alert('Failed to upload image')
      return null
    }
    return supabase.storage.from('products').getPublicUrl(path).data.publicUrl
  }

  const saveList = async () => {
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        id: form.id || undefined,
        slug: form.slug,
        name: form.name,
        tagline: form.tagline,
        description: form.description,
        hero_image_url: form.hero_image_url,
        gallery_images: form.gallery_images.filter(Boolean),
        price_from: form.price_from === '' ? null : form.price_from,
        price_to: form.price_to === '' ? null : form.price_to,
        expected_launch: form.expected_launch,
        status: form.status,
        show_count: form.show_count,
        questions: form.questions,
        launched_product_id: form.launched_product_id,
      }
      const res = await fetch('/api/interest/lists', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error || 'Failed to save')
        return
      }
      setPanelOpen(false)
      setForm(emptyForm())
      await loadLists()
    } catch {
      setFormError('Connection error')
    } finally {
      setSaving(false)
    }
  }

  const openSignups = async (list: ListRow) => {
    setDrawerSlug(list.slug)
    setDrawerList(list)
    setDrawerLoading(true)
    setSignups([])
    setNotifySubject('')
    setNotifyMessage('')
    setNotifyLink('')
    try {
      const res = await fetch(`/api/interest/${list.slug}/signups`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load signups')
      setSignups(data.signups || [])
      if (data.list) setDrawerList({ ...list, ...data.list })
    } catch (err) {
      console.error('Error loading signups:', err)
    } finally {
      setDrawerLoading(false)
    }
  }

  const questions = parseQuestions(drawerList?.questions)
  const unnotifiedCount = signups.filter((s) => !s.notified).length

  const summaries = useMemo(() => {
    return questions
      .filter((q) => q.type === 'single' || q.type === 'multi')
      .map((q) => {
        const options = q.options || []
        const counts: Record<string, number> = {}
        for (const opt of options) counts[opt] = 0
        let answered = 0
        for (const signup of signups) {
          const raw = signup.answers?.[q.key]
          const values = Array.isArray(raw) ? raw : raw ? [raw] : []
          if (values.length) answered++
          for (const v of values) {
            if (counts[v] !== undefined) counts[v]++
            else counts[v] = 1
          }
        }
        const total = signups.length || 1
        return { question: q, counts, answered, total: signups.length, denom: total }
      })
  }, [questions, signups])

  const exportCsv = () => {
    if (!drawerList || signups.length === 0) return
    const qCols = questions.map((q) => q.key)
    const headers = ['name', 'email', ...qCols, 'notes', 'source', 'marketing_consent', 'created_at', 'notified']
    const rows = signups.map((s) => {
      const cells = [
        s.name || '',
        s.email,
        ...qCols.map((key) => formatAnswer(s.answers?.[key])),
        s.notes || '',
        s.source || '',
        s.marketing_consent ? 'yes' : 'no',
        s.created_at,
        s.notified ? 'yes' : 'no',
      ]
      return cells.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')
    })
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${drawerList.slug}-signups.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const notifyEveryone = async () => {
    if (!drawerSlug) return
    if (!notifySubject.trim() || !notifyMessage.trim()) {
      alert('Subject and message are required')
      return
    }
    if (!confirm(`Send this email to ${unnotifiedCount} ${unnotifiedCount === 1 ? 'person' : 'people'} who have not been notified?`)) {
      return
    }
    setNotifying(true)
    try {
      const res = await fetch('/api/interest/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: drawerSlug,
          subject: notifySubject.trim(),
          message: notifyMessage.trim(),
          link: notifyLink.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data.error || 'Failed to send')
        return
      }
      alert(`Notified ${data.count} ${data.count === 1 ? 'person' : 'people'}`)
      const list = lists.find((l) => l.slug === drawerSlug)
      if (list) await openSignups(list)
    } catch {
      alert('Connection error')
    } finally {
      setNotifying(false)
    }
  }

  const updateQuestion = (index: number, patch: Partial<InterestQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }))
  }

  const moveQuestion = (index: number, dir: -1 | 1) => {
    setForm((prev) => {
      const next = [...prev.questions]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, questions: next }
    })
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
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Interest Lists</h1>
        <div className="flex gap-2">
          <Button size="sm" onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> New list
          </Button>
          <Link href="/admin/dashboard"><Button variant="outline" size="sm">Dashboard</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-orange">{lists.length}</p>
            <p className="text-zinc-400 text-xs">Total lists</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{lists.filter((l) => l.status === 'open').length}</p>
            <p className="text-zinc-400 text-xs">Open</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-white">{lists.reduce((s, l) => s + (l.signup_count || 0), 0)}</p>
            <p className="text-zinc-400 text-xs">Signups</p>
          </CardContent>
        </Card>
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-zinc-400">{lists.filter((l) => l.status === 'draft').length}</p>
            <p className="text-zinc-400 text-xs">Drafts</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-brand-dark-card border border-brand-dark-border mb-10">
        <CardHeader><CardTitle className="text-white">All lists</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          {lists.length === 0 ? (
            <p className="text-zinc-500 text-sm">No interest lists yet. Create one above.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left py-2 pr-3">Name</th>
                  <th className="text-left py-2 pr-3">Slug</th>
                  <th className="text-left py-2 pr-3">Status</th>
                  <th className="text-right py-2 pr-3">Signups</th>
                  <th className="text-left py-2 pr-3">Created</th>
                  <th className="text-right py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {lists.map((list) => (
                  <tr key={list.id} className="border-t border-brand-dark-border/40">
                    <td className="py-3 pr-3 text-white font-medium">{list.name}</td>
                    <td className="py-3 pr-3 font-mono text-zinc-400 text-xs">{list.slug}</td>
                    <td className="py-3 pr-3">{statusBadge(list.status)}</td>
                    <td className="py-3 pr-3 text-right text-brand-orange font-medium">{list.signup_count}</td>
                    <td className="py-3 pr-3 text-zinc-500">{new Date(list.created_at).toLocaleDateString('en-GB')}</td>
                    <td className="py-3 text-right whitespace-nowrap">
                      <Button size="sm" variant="outline" className="mr-2" onClick={() => openEdit(list)}>Edit</Button>
                      <Button size="sm" onClick={() => openSignups(list)}>View signups</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      {panelOpen && (
        <Card className="bg-brand-dark-card border border-brand-dark-border mb-10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">{form.id ? 'Edit list' : 'New list'}</CardTitle>
            <button onClick={() => setPanelOpen(false)} className="text-zinc-500 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Name *</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Slug *</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  placeholder="bottle-opener"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Tagline</label>
              <Input
                className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                value={form.tagline}
                onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <textarea
                rows={5}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-md border border-brand-dark-border bg-brand-dark text-white px-3 py-2 text-sm placeholder:text-zinc-500"
                placeholder="Paragraphs separated by a blank line"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Hero image</label>
              {form.hero_image_url && (
                <div className="mb-3 relative w-full max-w-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.hero_image_url} alt="" className="w-full rounded-lg border border-brand-dark-border object-cover" />
                  <button
                    onClick={() => setForm((f) => ({ ...f, hero_image_url: '' }))}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-brand-dark-border text-sm text-zinc-300 hover:border-brand-orange hover:text-white cursor-pointer">
                {uploadingHero ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingHero ? 'Uploading…' : 'Upload photo'}
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  disabled={uploadingHero}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setUploadingHero(true)
                    const url = await uploadImage(file)
                    setUploadingHero(false)
                    if (url) setForm((f) => ({ ...f, hero_image_url: url }))
                  }}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Gallery images</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {form.gallery_images.filter(Boolean).map((url, i) => (
                  <div key={url} className="relative w-20 h-20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full rounded object-cover border border-brand-dark-border" />
                    <button
                      onClick={() => setForm((f) => ({ ...f, gallery_images: f.gallery_images.filter((u) => u !== url) }))}
                      className="absolute -top-1.5 -right-1.5 p-0.5 rounded-full bg-black/70 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-brand-dark-border text-sm text-zinc-300 hover:border-brand-orange hover:text-white cursor-pointer">
                {uploadingGallery ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingGallery ? 'Uploading…' : 'Add gallery photo'}
                <input
                  type="file"
                  accept="image/*,.heic,.heif"
                  className="hidden"
                  disabled={uploadingGallery}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    e.target.value = ''
                    if (!file) return
                    setUploadingGallery(true)
                    const url = await uploadImage(file)
                    setUploadingGallery(false)
                    if (url) setForm((f) => ({ ...f, gallery_images: [...f.gallery_images.filter(Boolean), url] }))
                  }}
                />
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Price from</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.price_from}
                  onChange={(e) => setForm((f) => ({ ...f, price_from: e.target.value }))}
                  placeholder="45"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Price to</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.price_to}
                  onChange={(e) => setForm((f) => ({ ...f, price_to: e.target.value }))}
                  placeholder="65"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Expected launch</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.expected_launch}
                  onChange={(e) => setForm((f) => ({ ...f, expected_launch: e.target.value }))}
                  placeholder="Spring 2026"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Status</label>
                <select
                  className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark text-white px-3"
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as InterestListStatus }))}
                >
                  <option value="draft">draft</option>
                  <option value="open">open</option>
                  <option value="closed">closed</option>
                  <option value="launched">launched</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1">Launched product ID</label>
                <Input
                  className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                  value={form.launched_product_id}
                  onChange={(e) => setForm((f) => ({ ...f, launched_product_id: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 mt-6 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_count}
                  onChange={(e) => setForm((f) => ({ ...f, show_count: e.target.checked }))}
                  className="accent-brand-orange"
                />
                <span className="text-sm text-zinc-300">Show signup count on public page</span>
              </label>
            </div>

            <div className="border-t border-brand-dark-border pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">Questions</h3>
                <Button size="sm" variant="outline" onClick={() => setForm((f) => ({ ...f, questions: [...f.questions, emptyQuestion()] }))}>
                  Add question
                </Button>
              </div>
              {form.questions.length === 0 && (
                <p className="text-zinc-500 text-sm">No questions — email-only signup.</p>
              )}
              <div className="space-y-4">
                {form.questions.map((q, i) => (
                  <div key={i} className="bg-brand-dark border border-brand-dark-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-zinc-400 text-xs uppercase tracking-wider">Question {i + 1}</p>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => moveQuestion(i, -1)} disabled={i === 0}>
                          <ArrowUp className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => moveQuestion(i, 1)} disabled={i === form.questions.length - 1}>
                          <ArrowDown className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setForm((f) => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Key</label>
                        <Input
                          className="bg-brand-dark-card border-brand-dark-border text-white placeholder:text-zinc-500"
                          value={q.key}
                          onChange={(e) => updateQuestion(i, { key: e.target.value })}
                          placeholder="preferred-wood"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Label</label>
                        <Input
                          className="bg-brand-dark-card border-brand-dark-border text-white placeholder:text-zinc-500"
                          value={q.label}
                          onChange={(e) => updateQuestion(i, { label: e.target.value })}
                          placeholder="Which wood?"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-zinc-500 mb-1">Type</label>
                        <select
                          className="w-full h-10 rounded-md border border-brand-dark-border bg-brand-dark-card text-white px-3"
                          value={q.type}
                          onChange={(e) => updateQuestion(i, {
                            type: e.target.value as InterestQuestion['type'],
                            options: e.target.value === 'text' ? [] : (q.options?.length ? q.options : ['']),
                          })}
                        >
                          <option value="single">single</option>
                          <option value="multi">multi</option>
                          <option value="text">text</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={q.required === true}
                        onChange={(e) => updateQuestion(i, { required: e.target.checked })}
                        className="accent-brand-orange"
                      />
                      <span className="text-sm text-zinc-300">Required</span>
                    </label>
                    {q.type !== 'text' && (
                      <div>
                        <label className="block text-xs text-zinc-500 mb-2">Options</label>
                        <div className="space-y-2">
                          {(q.options || []).map((opt, oi) => (
                            <div key={oi} className="flex gap-2">
                              <Input
                                className="bg-brand-dark-card border-brand-dark-border text-white placeholder:text-zinc-500"
                                value={opt}
                                onChange={(e) => {
                                  const options = [...(q.options || [])]
                                  options[oi] = e.target.value
                                  updateQuestion(i, { options })
                                }}
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuestion(i, { options: (q.options || []).filter((_, idx) => idx !== oi) })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuestion(i, { options: [...(q.options || []), ''] })}
                          >
                            Add option
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {formError && <p className="text-red-400 text-sm">{formError}</p>}
            <Button onClick={saveList} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save list'}
            </Button>
          </CardContent>
        </Card>
      )}

      {drawerSlug && (
        <div className="fixed inset-0 z-50 bg-black/70 flex justify-end" onClick={() => setDrawerSlug(null)}>
          <div
            className="w-full max-w-5xl h-full bg-brand-dark border-l border-brand-dark-border overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="font-heading text-2xl font-bold text-white">{drawerList?.name || drawerSlug}</h2>
                <p className="text-zinc-500 text-sm">{signups.length} signup{signups.length === 1 ? '' : 's'}</p>
              </div>
              <button onClick={() => setDrawerSlug(null)} className="text-zinc-500 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            {drawerLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
              </div>
            ) : (
              <>
                {summaries.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-brand-orange font-semibold uppercase tracking-wider text-sm mb-3">Answer summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {summaries.map(({ question, counts, answered, total }) => (
                        <Card key={question.key} className="bg-brand-dark-card border border-brand-orange/30">
                          <CardContent className="p-4">
                            <p className="text-white font-medium mb-1">{question.label}</p>
                            <p className="text-zinc-500 text-xs mb-3">{answered} of {total} answered</p>
                            <ul className="space-y-2">
                              {Object.entries(counts).map(([opt, n]) => {
                                const pct = total > 0 ? Math.round((n / total) * 100) : 0
                                return (
                                  <li key={opt}>
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-zinc-300">{opt}</span>
                                      <span className="text-brand-orange font-medium">{n} · {pct}%</span>
                                    </div>
                                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                      <div className="h-full bg-brand-orange" style={{ width: `${pct}%` }} />
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-6">
                  <Button size="sm" variant="outline" onClick={exportCsv} disabled={signups.length === 0}>
                    Export CSV
                  </Button>
                </div>

                <Card className="bg-brand-dark-card border border-brand-dark-border mb-8">
                  <CardHeader><CardTitle className="text-white text-base">Notify everyone</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-zinc-500 text-sm">{unnotifiedCount} not yet notified</p>
                    <Input
                      className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                      value={notifySubject}
                      onChange={(e) => setNotifySubject(e.target.value)}
                      placeholder="Subject"
                    />
                    <textarea
                      rows={4}
                      value={notifyMessage}
                      onChange={(e) => setNotifyMessage(e.target.value)}
                      placeholder="Message"
                      className="w-full rounded-md border border-brand-dark-border bg-brand-dark text-white px-3 py-2 text-sm placeholder:text-zinc-500"
                    />
                    <Input
                      className="bg-brand-dark border-brand-dark-border text-white placeholder:text-zinc-500"
                      value={notifyLink}
                      onChange={(e) => setNotifyLink(e.target.value)}
                      placeholder="Optional link"
                    />
                    <Button onClick={notifyEveryone} disabled={notifying || unnotifiedCount === 0}>
                      {notifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : 'Notify everyone'}
                    </Button>
                  </CardContent>
                </Card>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-zinc-500 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="text-left py-2 pr-3">Name</th>
                        <th className="text-left py-2 pr-3">Email</th>
                        {questions.map((q) => (
                          <th key={q.key} className="text-left py-2 pr-3">{q.label}</th>
                        ))}
                        <th className="text-left py-2 pr-3">Notes</th>
                        <th className="text-left py-2 pr-3">Source</th>
                        <th className="text-left py-2 pr-3">Marketing</th>
                        <th className="text-left py-2 pr-3">Signed up</th>
                        <th className="text-left py-2">Notified</th>
                      </tr>
                    </thead>
                    <tbody>
                      {signups.map((s) => (
                        <tr key={s.id} className="border-t border-brand-dark-border/40">
                          <td className="py-2 pr-3 text-white">{s.name || '—'}</td>
                          <td className="py-2 pr-3 text-zinc-300">{s.email}</td>
                          {questions.map((q) => (
                            <td key={q.key} className="py-2 pr-3 text-zinc-300">{formatAnswer(s.answers?.[q.key])}</td>
                          ))}
                          <td className="py-2 pr-3 text-zinc-400">{s.notes || '—'}</td>
                          <td className="py-2 pr-3 text-zinc-500">{s.source}</td>
                          <td className="py-2 pr-3 text-zinc-400">{s.marketing_consent ? 'yes' : 'no'}</td>
                          <td className="py-2 pr-3 text-zinc-500 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString('en-GB')}</td>
                          <td className="py-2 text-zinc-400">{s.notified ? 'yes' : 'no'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {signups.length === 0 && (
                    <p className="text-zinc-500 text-sm mt-4">No signups yet.</p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
