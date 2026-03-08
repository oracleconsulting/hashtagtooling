'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Upload } from 'lucide-react'

interface BlankUpdate {
  id: string
  update_text: string
  image_url: string | null
  created_at: string
}

interface Adoption {
  id: string
  product_id: string
  customer_name: string
  customer_email: string
  status: string
  adopted_at: string
  notes: string | null
  product?: { name: string; image_url: string }
  blank_updates: BlankUpdate[]
}

const STATUS_OPTIONS = ['adopted', 'in_progress', 'finishing', 'complete', 'shipped']

export default function AdminAdoptionsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [adoptions, setAdoptions] = useState<Adoption[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [newUpdateText, setNewUpdateText] = useState<Record<string, string>>({})
  const [newUpdateFile, setNewUpdateFile] = useState<Record<string, File | null>>({})
  const [uploadingUpdateId, setUploadingUpdateId] = useState<string | null>(null)
  const [sendingEmail, setSendingEmail] = useState<string | null>(null)
  const siteUrl = typeof window !== 'undefined' ? (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin) : 'https://hashtag.guru'

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth')
    if (!auth) {
      router.push('/admin')
      return
    }
    loadAdoptions()
  }, [router])

  const loadAdoptions = async () => {
    try {
      const { data, error } = await supabase
        .from('blank_adoptions')
        .select('*')
        .order('adopted_at', { ascending: false })

      if (error) throw error

      const productIds = [...new Set((data || []).map((a) => a.product_id))]
      const { data: products } = await supabase.from('products').select('id, name, image_url').in('id', productIds)
      const productMap = new Map((products || []).map((p) => [p.id, p]))

      const adoptionIds = (data || []).map((a) => a.id)
      const { data: updates } = await supabase.from('blank_updates').select('*').in('adoption_id', adoptionIds)

      const updatesByAdoption = new Map<string, BlankUpdate[]>()
      ;(updates || []).forEach((u) => {
        const list = updatesByAdoption.get(u.adoption_id) || []
        list.push(u)
        updatesByAdoption.set(u.adoption_id, list)
      })
      updatesByAdoption.forEach((list) => list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()))

      setAdoptions(
        (data || []).map((a) => ({
          ...a,
          product: productMap.get(a.product_id),
          blank_updates: updatesByAdoption.get(a.id) || [],
        }))
      )
    } catch (err) {
      console.error('Error loading adoptions:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (adoption: Adoption, newStatus: string) => {
    setUpdatingStatus(adoption.id)
    try {
      const { error } = await supabase.from('blank_adoptions').update({ status: newStatus }).eq('id', adoption.id)
      if (error) throw error
      if (['complete', 'shipped'].includes(newStatus)) {
        setSendingEmail(adoption.id)
        await fetch('/api/send-adoption-update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName: adoption.customer_name,
            customerEmail: adoption.customer_email,
            productName: adoption.product?.name || 'Your blank',
            updateText: `Your adoption status has been updated to ${newStatus}.`,
            imageUrl: null,
            adoptionPageUrl: `${siteUrl}/adopt/${adoption.product_id}`,
          }),
        }).catch((e) => console.error('Email error:', e))
        setSendingEmail(null)
      }
      loadAdoptions()
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    } finally {
      setUpdatingStatus(null)
    }
  }

  const addUpdate = async (adoption: Adoption) => {
    const text = newUpdateText[adoption.id]?.trim() || 'Update'
    const file = newUpdateFile[adoption.id]
    setUploadingUpdateId(adoption.id)
    try {
      let imageUrl: string | null = null
      if (file) {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `updates/${adoption.id}-${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage.from('blank-updates').upload(path, file, { upsert: true })
        if (uploadErr) throw uploadErr
        const { data: urlData } = supabase.storage.from('blank-updates').getPublicUrl(path)
        imageUrl = urlData.publicUrl
      }
      const { error } = await supabase.from('blank_updates').insert({
        adoption_id: adoption.id,
        update_text: text,
        image_url: imageUrl,
      })
      if (error) throw error
      setNewUpdateText((prev) => ({ ...prev, [adoption.id]: '' }))
      setNewUpdateFile((prev) => ({ ...prev, [adoption.id]: null }))
      loadAdoptions()
    } catch (err) {
      console.error('Error adding update:', err)
      alert('Failed to add update')
    } finally {
      setUploadingUpdateId(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex gap-2 mb-8">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
        </Link>
      </div>

      <h1 className="font-heading text-4xl font-bold text-brand-orange mb-8">Adopt a Blank — Admin</h1>

      <div className="space-y-4">
        {adoptions.map((adoption) => (
          <Card key={adoption.id} className="bg-brand-dark-card border border-brand-dark-border">
            <CardHeader
              className="cursor-pointer"
              onClick={() => setExpandedId(expandedId === adoption.id ? null : adoption.id)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white">{adoption.customer_name}</CardTitle>
                  <p className="text-sm text-zinc-500">{adoption.product?.name || adoption.product_id}</p>
                  <p className="text-xs text-zinc-600">{new Date(adoption.adopted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-2 py-1 rounded text-sm bg-brand-orange/20 text-brand-orange">{adoption.status}</span>
                  {expandedId === adoption.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </div>
            </CardHeader>

            {expandedId === adoption.id && (
              <CardContent className="border-t border-brand-dark-border pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Status</label>
                  <select
                    className="w-full max-w-xs h-10 rounded border border-brand-dark-border bg-brand-dark text-white px-3"
                    value={adoption.status}
                    onChange={(e) => updateStatus(adoption, e.target.value)}
                    disabled={updatingStatus === adoption.id}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {sendingEmail === adoption.id && <span className="ml-2 text-xs text-zinc-500">Sending email...</span>}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-zinc-300">Add Update</label>
                  <div className="flex gap-2 flex-wrap">
                    <Input
                      placeholder="Update text..."
                      value={newUpdateText[adoption.id] || ''}
                      onChange={(e) => setNewUpdateText((prev) => ({ ...prev, [adoption.id]: e.target.value }))}
                      className="flex-1 min-w-[200px] bg-brand-dark border-brand-dark-border text-white"
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id={`img-${adoption.id}`}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        setNewUpdateFile((prev) => ({ ...prev, [adoption.id]: f || null }))
                      }}
                      disabled={uploadingUpdateId === adoption.id}
                    />
                    <label htmlFor={`img-${adoption.id}`}>
                      <span
                        className={`inline-flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium h-9 ${
                          uploadingUpdateId === adoption.id
                            ? 'opacity-50 cursor-not-allowed border-input bg-background'
                            : 'cursor-pointer border-brand-dark-border hover:bg-accent hover:text-accent-foreground'
                        }`}
                      >
                        <Upload className="h-4 w-4 mr-1" /> Photo
                      </span>
                    </label>
                    <Button size="sm" onClick={() => addUpdate(adoption)} disabled={uploadingUpdateId === adoption.id}>
                      {uploadingUpdateId === adoption.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add Update'}
                    </Button>
                  </div>
                  {newUpdateFile[adoption.id] && (
                    <p className="text-xs text-zinc-500 mt-1">{newUpdateFile[adoption.id]?.name} selected</p>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-zinc-400 mb-2">Updates ({adoption.blank_updates.length})</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {adoption.blank_updates.map((u) => (
                      <div key={u.id} className="p-3 rounded bg-brand-dark border border-brand-dark-border text-sm">
                        <p className="text-zinc-500 text-xs">{new Date(u.created_at).toLocaleString()}</p>
                        <p className="text-zinc-300">{u.update_text}</p>
                        {u.image_url && (
                          <a href={u.image_url} target="_blank" rel="noopener noreferrer" className="text-brand-orange text-xs mt-1 inline-block">
                            View image
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Link href={`/adopt/${adoption.product_id}`} target="_blank" className="text-brand-orange text-sm hover:underline">
                    View public page →
                  </Link>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {adoptions.length === 0 && <p className="text-zinc-400">No adoptions yet.</p>}
    </div>
  )
}
