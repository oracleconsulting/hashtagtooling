'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { Check } from 'lucide-react'

export default function CommissionsPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project_description: '',
    budget: '',
    timeline: '',
    preferred_custom_build: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase
        .from('commissions')
        .insert([{
          ...formData,
          status: 'pending'
        }])

      if (error) throw error

      setSubmitted(true)
      setFormData({
        name: '',
        email: '',
        project_description: '',
        budget: '',
        timeline: '',
        preferred_custom_build: '',
      })
    } catch (error) {
      console.error('Error submitting commission:', error)
      alert('There was an error submitting your request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-12">
            <CardContent>
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
              <p className="text-zinc-600 mb-6">
                Your commission request has been received. I'll review it and get back to you within 2-3 business days.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                Submit Another Request
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Commission Work</h1>
        <p className="text-zinc-600 mb-8">
          Have a unique project in mind? Fill out this form to join the commission waiting list. 
          I'll review your request and reach out to discuss details, pricing, and timeline.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Commission Request Form</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Your Name *
                  </label>
                  <Input
                    id="name"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email Address *
                  </label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="project_description" className="block text-sm font-medium mb-2">
                  Project Description *
                </label>
                <Textarea
                  id="project_description"
                  required
                  value={formData.project_description}
                  onChange={(e) => setFormData({ ...formData, project_description: e.target.value })}
                  placeholder="Describe your custom tool request in detail. Include dimensions, materials, and any specific requirements..."
                  rows={6}
                />
              </div>

              <div>
                <label htmlFor="preferred_custom_build" className="block text-sm font-medium mb-2">
                  Preferred Custom Build
                </label>
                <Textarea
                  id="preferred_custom_build"
                  value={formData.preferred_custom_build}
                  onChange={(e) => setFormData({ ...formData, preferred_custom_build: e.target.value })}
                  placeholder="Do you have preferences for wood types, metals, dimensions, or design elements?"
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium mb-2">
                    Budget Range
                  </label>
                  <Input
                    id="budget"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="£100 - £200"
                  />
                </div>

                <div>
                  <label htmlFor="timeline" className="block text-sm font-medium mb-2">
                    Timeline / Deadline
                  </label>
                  <Input
                    id="timeline"
                    value={formData.timeline}
                    onChange={(e) => setFormData({ ...formData, timeline: e.target.value })}
                    placeholder="No rush / By Christmas"
                  />
                </div>
              </div>

              <div className="bg-zinc-50 rounded-lg p-4 text-sm text-zinc-600">
                <p className="font-medium text-zinc-900 mb-2">What happens next?</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>I'll review your request within 2-3 business days</li>
                  <li>We'll discuss the project details, feasibility, and pricing</li>
                  <li>Once confirmed, your project joins the queue</li>
                  <li>Lead times vary based on complexity (typically 4-8 weeks)</li>
                </ul>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Submitting...' : 'Submit Commission Request'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}



