'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatPrice } from '@/lib/utils'

function LabelsInner() {
  const searchParams = useSearchParams()
  const skusParam = searchParams.get('skus') || ''
  const skuList = skusParam.split(',').map((s) => s.trim()).filter(Boolean)
  const [rows, setRows] = useState<
    { sku: string; name: string; dimensions: string | null; price: number; material_species: string | null }[]
  >([])

  useEffect(() => {
    if (skuList.length === 0) return
    ;(async () => {
      const { data } = await supabase
        .from('products')
        .select('sku, name, dimensions, price, material_species')
        .in('sku', skuList)
      setRows((data || []) as typeof rows)
    })()
  }, [skusParam])

  if (skuList.length === 0) {
    return <div className="p-8 bg-white text-black min-h-screen">No SKUs. Add ?skus=VE-001,VE-002</div>
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @page { size: 4in 6in; margin: 0.35in; }
          @media print {
            .sku-label { page-break-after: always; break-after: page; }
            .sku-label:last-child { page-break-after: auto; }
          }
        `,
        }}
      />
      {rows.map((r) => (
        <div
          key={r.sku}
          className="sku-label w-[4in] min-h-[6in] box-border border border-neutral-300 print:border-0 p-4 flex flex-col justify-between mb-4 print:mb-0"
        >
          <div>
            <p className="text-xs tracking-[0.2em] font-bold text-black mb-2">#TOOLING</p>
            <p className="text-3xl font-bold font-mono leading-tight text-black">{r.sku}</p>
            <p className="text-sm mt-3 font-semibold text-neutral-900">{r.material_species || r.name}</p>
            {r.dimensions && <p className="text-sm text-neutral-600 mt-1">{r.dimensions}</p>}
          </div>
          <p className="text-2xl font-semibold text-black">{formatPrice(r.price)}</p>
        </div>
      ))}
      {rows.length === 0 && <p className="text-neutral-600 p-4">Loading…</p>}
    </div>
  )
}

export default function InventoryLabelsPage() {
  return (
    <Suspense fallback={<div className="p-8 bg-white text-black">Loading…</div>}>
      <LabelsInner />
    </Suspense>
  )
}
