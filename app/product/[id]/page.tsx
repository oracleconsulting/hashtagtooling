import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatPrice } from '@/lib/utils'
import Link from 'next/link'

// This would come from Supabase in production
const PLACEHOLDER_PRODUCTS = [
  {
    id: '1',
    name: 'Walnut Carving Mallet',
    description: 'Beautifully turned carving mallet in black walnut with brass transition',
    price: 89.99,
    category: 'mallets',
    image_url: 'https://placehold.co/600x400/3D2817/white?text=Walnut+Mallet',
    stock_status: 'in_stock',
    long_description: 'This carving mallet features a turned head crafted from premium black walnut, known for its density and beautiful dark grain. The brass transition collar adds both visual appeal and structural integrity. Perfect for detailed carving work where control and precision are essential.',
    specifications: {
      'Head Diameter': '3.5 inches',
      'Overall Length': '11 inches',
      'Weight': '14 oz',
      'Head Wood': 'Black Walnut',
      'Handle Wood': 'Black Walnut',
      'Transition': 'Brass',
      'Finish': 'Danish Oil'
    }
  },
  {
    id: '2',
    name: 'Maple Detailing Mallet',
    description: 'Precision turned detailing mallet in hard maple with copper accent',
    price: 79.99,
    category: 'mallets',
    image_url: 'https://placehold.co/600x400/E8D5B7/333?text=Maple+Mallet',
    stock_status: 'in_stock',
    long_description: 'Hard maple provides the perfect balance of hardness and weight for detail work. The lighter color showcases the wood grain beautifully, while the copper transition adds warmth and character.',
    specifications: {
      'Head Diameter': '3 inches',
      'Overall Length': '10 inches',
      'Weight': '12 oz',
      'Head Wood': 'Hard Maple',
      'Handle Wood': 'Hard Maple',
      'Transition': 'Copper',
      'Finish': 'Danish Oil'
    }
  },
]

interface ProductPageProps {
  params: {
    id: string
  }
}

export default function ProductPage({ params }: ProductPageProps) {
  // In production, fetch from Supabase
  const product = PLACEHOLDER_PRODUCTS.find(p => p.id === params.id)

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Link href="/shop" className="text-zinc-600 hover:text-zinc-900 mb-6 inline-block">
        ← Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div>
          <div className="relative aspect-square bg-zinc-100 rounded-lg overflow-hidden mb-4">
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-3xl font-bold mb-6">{formatPrice(product.price)}</p>
          
          <div className="mb-6">
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
              product.stock_status === 'in_stock' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {product.stock_status === 'in_stock' ? 'In Stock' : 'Made to Order'}
            </span>
          </div>

          <p className="text-zinc-600 mb-8 leading-relaxed">
            {product.long_description}
          </p>

          <Button size="lg" className="w-full mb-8">
            Add to Cart
          </Button>

          {/* Specifications */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Specifications</h3>
              <dl className="space-y-3">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <dt className="text-zinc-600">{key}:</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Custom Option */}
          <div className="mt-6 bg-zinc-50 rounded-lg p-6">
            <h3 className="font-semibold mb-2">Want this in different woods?</h3>
            <p className="text-sm text-zinc-600 mb-4">
              Customize this design with your choice of wood species and transition material.
            </p>
            <Link href="/custom-mallet">
              <Button variant="outline" className="w-full">
                Build Custom Version
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

