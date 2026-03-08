'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { error } = await supabase.from('contact_messages').insert([
        {
          name: formData.name,
          email: formData.email,
          subject: formData.subject,
          message: formData.message,
        },
      ])
      if (error) throw error
      fetch('/api/send-admin-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_contact',
          data: {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
          },
        }),
      }).catch(() => {})
      setSubmitted(true)
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      console.error('Error submitting contact form:', err)
      alert('Something went wrong. Please try again or email hello@hashtagtooling.com directly.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <Card className="bg-brand-dark-card border border-brand-dark-border">
        <CardContent className="py-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Message sent</h2>
          <p className="text-zinc-400 mb-6">
            Thanks for getting in touch. I&apos;ll respond within 24–48 hours.
          </p>
          <Button variant="outline" onClick={() => setSubmitted(false)}>
            Send another message
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-brand-dark-card border border-brand-dark-border">
      <CardHeader>
        <CardTitle className="text-white">Send a message</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="contact-name" className="block text-sm font-medium mb-2 text-zinc-300">
                Name *
              </label>
              <Input
                id="contact-name"
                required
                className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
              />
            </div>
            <div>
              <label htmlFor="contact-email" className="block text-sm font-medium mb-2 text-zinc-300">
                Email *
              </label>
              <Input
                id="contact-email"
                type="email"
                required
                className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your@email.com"
              />
            </div>
          </div>
          <div>
            <label htmlFor="contact-subject" className="block text-sm font-medium mb-2 text-zinc-300">
              Subject *
            </label>
            <Input
              id="contact-subject"
              required
              className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="e.g. Question about an order"
            />
          </div>
          <div>
            <label htmlFor="contact-message" className="block text-sm font-medium mb-2 text-zinc-300">
              Message *
            </label>
            <Textarea
              id="contact-message"
              required
              className="bg-brand-dark border border-brand-dark-border text-white placeholder:text-zinc-500 text-base"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Your message..."
              rows={5}
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Sending...' : 'Send message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
