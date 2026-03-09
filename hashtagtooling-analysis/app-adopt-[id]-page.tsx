'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { Loader2, ArrowLeft } from 'lucide-react'

interface Product {
  id: string
  name: string
  image_url: string
  description?: string
}

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
  status: string
  adopted_at: string
  products: Product | null
  blank_updates: BlankUpdate[]
}

const STATUS_LABELS: Record<string, string> = {
  adopted: 'Adopted',
  in_progress: 'In Progress',
  finishing: 'Finishing',
  complete: 'Complete',
  shipped: 'Shipped',
}

export default function AdoptJourneyPage() {
  const params = useParams()
  const productId = params.id as string
  const [adoption, setAdoption] = useState<Adoption | null>(null)
  const [loading, setLoading] = useState(true)
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  useEffect(() => {
    if (productId) loadAdoption()
  }, [productId])

  const loadAdoption = async () => {
    try {
      const { data: adoptionData, error: adoptionError } = await supabase
        .from('blank_adoptions')
        .select('*')
        .eq('product_id', productId)
        .order('adopted_at', { ascending: false })
        .limit(1)
        .single()

      if (adoptionError || !adoptionData) {
        setAdoption(null)
        setLoading(false)
        return
      }

      const { data: productData } = await supabase.from('products').select('id, name, image_url, description').eq('id', productId).single()

      const { data: updates } = await supabase
        .from('blank_updates')
        .select('*')
        .eq('adoption_id', adoptionData.id)
        .order('created_at', { ascending: true })

      setAdoption({
        ...adoptionData,
        products: productData || null,
        blank_updates: updates || [],
      })
    } catch (err) {
      console.error('Error loading adoption:', err)
      setAdoption(null)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  if (!adoption) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h1 className="font-heading text-2xl font-bold text-brand-orange mb-4">Adoption Not Found</h1>
        <p className="text-zinc-400 mb-6">This adoption may not exist or the link may be incorrect.</p>
        <Link href="/adopt">
          <Button>Back to Adopt a Blank</Button>
        </Link>
      </div>
    )
  }

  const product = adoption.products

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link href="/adopt" className="inline-flex items-center gap-2 text-zinc-400 hover:text-brand-orange mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Adopt a Blank
        </Link>

        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {(['adopted', 'in_progress', 'finishing', 'complete', 'shipped'] as const).map((s) => (
              <span
                key={s}
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  adoption.status === s ? 'bg-brand-orange text-brand-dark' : 'bg-brand-dark-border text-zinc-400'
                }`}
              >
                {STATUS_LABELS[s]}
              </span>
            ))}
          </div>
          <h1 className="font-heading text-3xl font-bold text-white mb-2">{product?.name || 'Adopted Blank'}</h1>
          <p className="text-zinc-500 text-sm">Adopted {new Date(adoption.adopted_at).toLocaleDateString()}</p>
        </div>

        {product?.image_url && (
          <div className="aspect-square max-w-md rounded-lg overflow-hidden border border-brand-dark-border mb-8">
            <Image src={product.image_url} alt={product.name} width={400} height={400} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-brand-orange/50" />
          <div className="space-y-8 pl-10">
            {adoption.blank_updates.map((update) => (
              <div key={update.id} className="relative">
                <div className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-brand-orange" />
                <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg p-4">
                  <p className="text-xs text-zinc-500 mb-2">{new Date(update.created_at).toLocaleDateString()}</p>
                  <p className="text-zinc-300 whitespace-pre-wrap">{update.update_text}</p>
                  {update.image_url && (
                    <button
                      type="button"
                      onClick={() => setLightboxImage(update.image_url!)}
                      className="mt-3 block rounded-lg overflow-hidden border border-brand-dark-border hover:border-brand-orange transition-colors"
                    >
                      <Image src={update.image_url} alt="Update" width={400} height={300} className="w-full h-auto object-cover" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {adoption.blank_updates.length === 0 && (
          <p className="text-zinc-500 text-center py-8">No updates yet. Check back soon!</p>
        )}

        <div className="mt-12 pt-8 border-t border-brand-dark-border text-center">
          <p className="text-zinc-400 mb-4">Want to adopt your own blank?</p>
          <Link href="/adopt">
            <Button>Adopt a Blank</Button>
          </Link>
        </div>
      </div>

      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Escape' && setLightboxImage(null)}
          aria-label="Close lightbox"
        >
          <Image src={lightboxImage} alt="Update" width={800} height={600} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
