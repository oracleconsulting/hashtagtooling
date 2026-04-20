'use client'

import Link from 'next/link'

interface AdminProductPreviewProps {
  product: {
    id: string
    name: string
    image_url?: string
    category?: string
    created_at?: string
    description?: string
    price?: number
    stock_status?: string
    metadata?: {
      images?: string[]
      head_wood?: string
      handle_wood?: string
    }
  } | null
}

export function AdminProductPreview({ product }: AdminProductPreviewProps) {
  if (!product) return null

  const imageUrl = product.metadata?.images?.[0] || product.image_url
  const date = product.created_at
    ? new Date(product.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : null

  return (
    <div className="mt-3 p-4 bg-zinc-900 border border-zinc-700 rounded-lg flex gap-4">
      {imageUrl ? (
        <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={product.name} className="absolute inset-0 w-full h-full object-cover" />
        </div>
      ) : (
        <div className="w-24 h-24 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
          <span className="text-zinc-600 text-xs">No image</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm truncate">{product.name}</p>
        {product.metadata?.head_wood && (
          <p className="text-zinc-400 text-xs mt-1">
            {product.metadata.head_wood}{product.metadata.handle_wood ? ` / ${product.metadata.handle_wood}` : ''}
          </p>
        )}
        {date && <p className="text-zinc-500 text-xs mt-1">{date}</p>}
        {product.description && (
          <p className="text-zinc-500 text-xs mt-1 line-clamp-2">{product.description}</p>
        )}
        <div className="flex gap-2 mt-2">
          <Link
            href={`/product/${product.id}`}
            target="_blank"
            className="text-brand-orange text-xs hover:underline"
          >
            View on site &rarr;
          </Link>
          <Link
            href={`/admin/products/edit/${product.id}`}
            className="text-zinc-400 text-xs hover:underline"
          >
            Edit &rarr;
          </Link>
        </div>
      </div>
    </div>
  )
}
