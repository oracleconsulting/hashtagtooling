'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface LabelRow {
  sku: string
  dimensions: string | null
  drawer_number: string | null
  grade: string | null
  material_name: string
}

function LabelsInner() {
  const searchParams = useSearchParams()
  const skusParam = searchParams.get('skus') || ''
  const skuList = skusParam.split(',').map((s) => s.trim()).filter(Boolean)
  const [rows, setRows] = useState<LabelRow[]>([])

  useEffect(() => {
    if (skuList.length === 0) return
    ;(async () => {
      const { data } = await supabase
        .from('workshop_stock')
        .select('sku, dimensions, drawer_number, grade, materials(name)')
        .in('sku', skuList)
      const mapped = (data || []).map((r: Record<string, unknown>) => ({
        sku: r.sku as string,
        dimensions: r.dimensions as string | null,
        drawer_number: r.drawer_number as string | null,
        grade: r.grade as string | null,
        material_name: ((r.materials as Record<string, unknown>)?.name as string) || 'Unknown',
      }))
      setRows(mapped)
    })()
  }, [skusParam])

  if (skuList.length === 0) {
    return <div className="p-8 bg-white text-black min-h-screen">No SKUs. Add ?skus=PME-001,PME-002</div>
  }

  return (
    <div className="min-h-screen bg-white text-black p-4 print:p-0">
      <style
        dangerouslySetInnerHTML={{
          __html: `
          @page { size: 4in 6in; margin: 0.35in; }
          @media print {
            .ws-label { page-break-after: always; break-after: page; }
            .ws-label:last-child { page-break-after: auto; }
          }
        `,
        }}
      />
      {rows.map((r) => (
        <div
          key={r.sku}
          className="ws-label w-[4in] min-h-[6in] box-border border border-neutral-300 print:border-0 p-4 flex flex-col justify-between mb-4 print:mb-0"
        >
          <div>
            <p className="text-xs tracking-[0.2em] font-bold text-black mb-2">#TOOLING — RAW STOCK</p>
            <p className="text-3xl font-bold font-mono leading-tight text-black">{r.sku}</p>
            <p className="text-sm mt-3 font-semibold text-neutral-900">{r.material_name}</p>
            {r.dimensions && <p className="text-sm text-neutral-600 mt-1">{r.dimensions}</p>}
          </div>
          <div className="flex justify-between items-end">
            {r.drawer_number && <p className="text-lg font-mono font-semibold text-black">{r.drawer_number}</p>}
            {r.grade && <p className="text-lg font-bold text-black">Grade {r.grade}</p>}
          </div>
        </div>
      ))}
      {rows.length === 0 && <p className="text-neutral-600 p-4">Loading…</p>}
    </div>
  )
}

export default function WorkshopStockLabelsPage() {
  return (
    <Suspense fallback={<div className="p-8 bg-white text-black">Loading…</div>}>
      <LabelsInner />
    </Suspense>
  )
}
