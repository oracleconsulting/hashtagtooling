export type InterestBuildIntent = {
  metalId: string
  metalName: string
  handleId: string
  handleName: string
  total: number
  deposit: number
  balance: number
}

export function generateInviteToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function isInviteToken(token: string): boolean {
  return /^[a-f0-9]{48}$/.test(token)
}

export function interestInviteUrl(token: string, siteUrl = 'https://hashtag.guru'): string {
  try {
    return `${new URL(siteUrl).origin}/build/${token}`
  } catch {
    return `https://hashtag.guru/build/${token}`
  }
}

export function parseBuildIntent(raw: unknown): InterestBuildIntent | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const obj = raw as Record<string, unknown>
  const metalId = typeof obj.metalId === 'string' ? obj.metalId : ''
  const metalName = typeof obj.metalName === 'string' ? obj.metalName : ''
  const handleId = typeof obj.handleId === 'string' ? obj.handleId : ''
  const handleName = typeof obj.handleName === 'string' ? obj.handleName : ''
  const total = Number(obj.total)
  const deposit = Number(obj.deposit)
  const balance = Number(obj.balance)
  if (!metalId || !metalName || !handleId || !handleName) return null
  if (![total, deposit, balance].every(Number.isFinite)) return null
  return { metalId, metalName, handleId, handleName, total, deposit, balance }
}

export function formatBuildIntent(intent: InterestBuildIntent | null | undefined): string {
  if (!intent) return ''
  return `${intent.metalName} / ${intent.handleName} · £${intent.total.toFixed(2)}`
}
