'use client'

import { useEffect, useState, Fragment } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@supabase/supabase-js'
import { Loader2 } from 'lucide-react'

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

interface Voucher {
  id: string
  code: string
  amount_gbp: number
  remaining_balance: number
  purchased_by_email: string
  purchased_by_name: string | null
  recipient_email: string
  recipient_name: string | null
  payment_method: string
  created_at: string
  expires_at: string
  redemptions: Array<{ order_id: string; amount: number; redeemed_at: string }>
}

export default function AdminGiftVouchersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [vouchers, setVouchers] = useState<Voucher[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = sessionStorage.getItem('admin_auth')
    if (!isAuthenticated) {
      router.push('/admin')
      return
    }
    loadVouchers()
  }, [router])

  const loadVouchers = async () => {
    setLoading(true)
    const supabase = getServiceSupabase()
    const { data } = await supabase
      .from('gift_vouchers')
      .select('*')
      .order('created_at', { ascending: false })
    setVouchers(data || [])
    setLoading(false)
  }

  const totalIssued = vouchers.reduce((s, v) => s + Number(v.amount_gbp), 0)
  const totalOutstanding = vouchers.reduce((s, v) => s + Number(v.remaining_balance), 0)
  const totalRedeemed = totalIssued - totalOutstanding
  const expired = vouchers.filter((v) => new Date(v.expires_at) < new Date())
  const active = vouchers.filter((v) => new Date(v.expires_at) >= new Date() && Number(v.remaining_balance) > 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h1 className="font-heading text-4xl font-bold text-brand-orange">Gift Vouchers</h1>
        <div className="flex gap-2">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="sm">← Dashboard</Button>
          </Link>
          <Link href="/gift-vouchers" target="_blank">
            <Button variant="outline" size="sm">View Purchase Page</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Issued', value: `£${totalIssued.toFixed(2)}`, sub: `${vouchers.length} vouchers` },
          { label: 'Outstanding Balance', value: `£${totalOutstanding.toFixed(2)}`, sub: `${active.length} active` },
          { label: 'Total Redeemed', value: `£${totalRedeemed.toFixed(2)}` },
          { label: 'Expired', value: expired.length.toString(), sub: 'vouchers' },
        ].map((s) => (
          <Card key={s.label} className="bg-brand-dark-card border border-brand-dark-border">
            <CardContent className="p-4">
              <p className="text-2xl font-bold text-brand-orange">{s.value}</p>
              <p className="text-zinc-400 text-sm mt-0.5">{s.label}</p>
              {s.sub && <p className="text-zinc-600 text-xs">{s.sub}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-brand-dark-card border border-brand-dark-border">
        <CardHeader>
          <CardTitle className="text-white">All Vouchers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {vouchers.length === 0 ? (
            <p className="text-zinc-400 p-6 text-center">No gift vouchers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-brand-dark-border">
                    <th className="text-left p-4 text-zinc-400 font-medium">Code</th>
                    <th className="text-left p-4 text-zinc-400 font-medium hidden md:table-cell">Recipient</th>
                    <th className="text-right p-4 text-zinc-400 font-medium">Value</th>
                    <th className="text-right p-4 text-zinc-400 font-medium">Remaining</th>
                    <th className="text-center p-4 text-zinc-400 font-medium">Status</th>
                    <th className="text-left p-4 text-zinc-400 font-medium hidden lg:table-cell">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map((v) => {
                    const isExpired = new Date(v.expires_at) < new Date()
                    const isFullyRedeemed = Number(v.remaining_balance) <= 0
                    const status = isExpired ? 'expired' : isFullyRedeemed ? 'used' : 'active'
                    const isOpen = expanded === v.id

                    return (
                      <Fragment key={v.id}>
                        <tr
                          className="border-b border-brand-dark-border last:border-0 hover:bg-zinc-800/30 cursor-pointer transition-colors"
                          onClick={() => setExpanded(isOpen ? null : v.id)}
                        >
                          <td className="p-4">
                            <span className="font-mono text-white font-medium">{v.code}</span>
                            <p className="text-zinc-600 text-xs mt-0.5">{v.payment_method}</p>
                          </td>
                          <td className="p-4 hidden md:table-cell">
                            <p className="text-white">{v.recipient_name || '—'}</p>
                            <p className="text-zinc-500 text-xs">{v.recipient_email}</p>
                          </td>
                          <td className="p-4 text-right text-white">£{Number(v.amount_gbp).toFixed(2)}</td>
                          <td className="p-4 text-right">
                            <span className={Number(v.remaining_balance) > 0 ? 'text-white' : 'text-zinc-600'}>
                              £{Number(v.remaining_balance).toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              status === 'active' ? 'bg-green-900/40 text-green-400' :
                              status === 'expired' ? 'bg-zinc-800 text-zinc-500' :
                              'bg-zinc-800 text-zinc-400'
                            }`}>
                              {status}
                            </span>
                          </td>
                          <td className="p-4 hidden lg:table-cell text-zinc-400 text-xs">
                            {new Date(v.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </td>
                        </tr>

                        {isOpen && (
                          <tr className="border-b border-brand-dark-border bg-zinc-900/50">
                            <td colSpan={6} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <p className="text-zinc-500 mb-1">Purchased by</p>
                                  <p className="text-white">{v.purchased_by_name || '—'} ({v.purchased_by_email})</p>
                                  <p className="text-zinc-500 mt-2 mb-1">Purchased on</p>
                                  <p className="text-white">{new Date(v.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                                <div>
                                  <p className="text-zinc-500 mb-1">Redemption history</p>
                                  {v.redemptions && v.redemptions.length > 0 ? (
                                    <div className="space-y-1">
                                      {v.redemptions.map((r, i) => (
                                        <p key={i} className="text-white">
                                          £{Number(r.amount).toFixed(2)} — {new Date(r.redeemed_at).toLocaleDateString('en-GB')}
                                          <span className="text-zinc-600 ml-1 font-mono">({r.order_id?.slice(0, 8)})</span>
                                        </p>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-zinc-600">Not yet redeemed</p>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-zinc-600 text-xs mt-4">
        Click any row to expand redemption history. Vouchers expire 12 months from purchase (UK legal requirement).
      </p>
    </div>
  )
}
