'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Commission {
  id: string
  created_at: string
  name: string
  email: string
  project_description: string
  budget: string
  timeline: string
  preferred_custom_build: string
  status: string
}

const STATUS_OPTIONS = [
  'pending',
  'contacted',
  'in_progress',
  'completed',
] as const

export default function AdminCommissionsPage() {
  const router = useRouter()
  const [commissions, setCommissions] = useState<Commission[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadCommissions()
  }, [router])

  const loadCommissions = async () => {
    try {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCommissions(data || [])
    } catch (error) {
      console.error('Error loading commissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (commissionId: string, status: string) => {
    setUpdatingId(commissionId)
    try {
      const { error } = await supabase
        .from('commissions')
        .update({ status })
        .eq('id', commissionId)

      if (error) throw error
      setCommissions((prev) =>
        prev.map((c) =>
          c.id === commissionId ? { ...c, status } : c
        )
      )
    } catch (error) {
      console.error('Error updating commission status:', error)
      alert('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  const logout = () => {
    sessionStorage.removeItem('admin_auth')
    router.push('/admin')
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })

  const truncate = (str: string, len: number) =>
    str.length <= len ? str : str.slice(0, len) + '…'

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-zinc-400">Loading...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">
          Commissions
        </h1>
        <div className="flex gap-4">
          <Link href="/admin/products">
            <Button size="lg" variant="outline">
              Back to Products
            </Button>
          </Link>
          <Button variant="outline" onClick={logout}>
            Logout
          </Button>
        </div>
      </div>

      {commissions.length === 0 ? (
        <Card className="bg-brand-dark-card border border-brand-dark-border">
          <CardContent className="p-12 text-center">
            <p className="text-zinc-400">No commission requests yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {commissions.map((c) => (
            <Card
              key={c.id}
              className="bg-brand-dark-card border border-brand-dark-border overflow-hidden"
            >
              <CardContent className="p-0">
                <button
                  type="button"
                  className="w-full text-left p-4 hover:bg-white/5 transition-colors"
                  onClick={() =>
                    setExpandedId((id) => (id === c.id ? null : c.id))
                  }
                >
                  <div className="flex items-start gap-3">
                    <span className="text-zinc-400 mt-0.5">
                      {expandedId === c.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-zinc-400 text-sm mb-1">
                        {formatDate(c.created_at)}
                      </p>
                      <p className="text-white font-semibold">{c.name}</p>
                      <p className="text-zinc-400 text-sm truncate">
                        {c.email}
                      </p>
                      <p className="text-zinc-400 text-sm mt-2 line-clamp-2">
                        {truncate(c.project_description, 120)}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {c.budget && (
                          <span className="text-xs text-zinc-500">
                            Budget: {c.budget}
                          </span>
                        )}
                        {c.timeline && (
                          <span className="text-xs text-zinc-500">
                            Timeline: {c.timeline}
                          </span>
                        )}
                      </div>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <select
                        value={c.status}
                        onChange={(e) =>
                          updateStatus(c.id, e.target.value)
                        }
                        disabled={updatingId === c.id}
                        className="bg-brand-dark border border-brand-dark-border text-white rounded px-2 py-1 text-sm"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </button>

                {expandedId === c.id && (
                  <div className="border-t border-brand-dark-border p-4 bg-brand-dark/50 space-y-4">
                    <div>
                      <p className="text-white font-semibold mb-1">
                        Project description
                      </p>
                      <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                        {c.project_description}
                      </p>
                    </div>
                    {c.preferred_custom_build && (
                      <div>
                        <p className="text-white font-semibold mb-1">
                          Preferred custom build
                        </p>
                        <p className="text-zinc-400 text-sm whitespace-pre-wrap">
                          {c.preferred_custom_build}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
