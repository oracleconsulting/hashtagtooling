'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Check } from 'lucide-react'

interface Message {
  id: string
  name: string
  email: string
  subject?: string
  message: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'unread' | 'all'>('unread')

  const load = async () => {
    setLoading(true)
    let query = supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (filter === 'unread') query = query.eq('read', false)
    const { data } = await query
    setMessages((data ?? []) as Message[])
    setLoading(false)
  }

  useEffect(() => {
    if (!sessionStorage.getItem('admin_auth')) {
      router.push('/admin')
      return
    }
    void load()
  }, [filter])

  const markRead = async (id: string) => {
    await supabase.from('contact_messages').update({ read: true }).eq('id', id)
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Messages</h1>
        <div className="flex items-center gap-3">
          <div className="flex bg-zinc-900 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 rounded-md ${filter === 'unread' ? 'bg-brand-orange text-black' : 'text-zinc-400'}`}
            >
              Unread
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-md ${filter === 'all' ? 'bg-brand-orange text-black' : 'text-zinc-400'}`}
            >
              All
            </button>
          </div>
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-brand-orange mx-auto mt-12" />
      ) : messages.length === 0 ? (
        <p className="text-zinc-500 text-center mt-12">No {filter === 'unread' ? 'unread ' : ''}messages.</p>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => (
            <Card
              key={m.id}
              className={`bg-brand-dark-card border ${m.read ? 'border-brand-dark-border' : 'border-brand-orange/30'}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base text-white">{m.name}</CardTitle>
                    <p className="text-xs text-zinc-400 mt-0.5">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">{new Date(m.created_at).toLocaleString('en-GB')}</span>
                    {!m.read && (
                      <Button size="sm" variant="outline" onClick={() => void markRead(m.id)}>
                        <Check className="h-3 w-3 mr-1" /> Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {m.subject && <p className="font-medium text-zinc-200 mb-2">{m.subject}</p>}
                <p className="text-zinc-300 text-sm whitespace-pre-wrap">{m.message}</p>
                <a
                  href={`mailto:${m.email}?subject=Re: ${m.subject ?? 'your enquiry'}`}
                  className="text-brand-orange text-xs mt-3 inline-block underline"
                >
                  Reply via email →
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
