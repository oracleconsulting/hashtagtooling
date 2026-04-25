/**
 * Compute the ship window for a custom square order.
 *
 * Squares are batched monthly: blanks are procured at end-of-month, then
 * there's a 6–8 week build window from that point.
 *
 *   earliestShip = (last day of order's month) + 6 weeks
 *   latestShip   = (last day of order's month) + 8 weeks
 */
export function computeSquareShipWindow(orderDate: Date | string = new Date()): {
  earliestShip: Date
  latestShip: Date
  formatted: string
  formattedShort: string
  batchMonth: string
} {
  const date = typeof orderDate === 'string' ? new Date(orderDate) : orderDate

  const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)

  const earliestShip = new Date(endOfMonth)
  earliestShip.setDate(earliestShip.getDate() + 7 * 6)

  const latestShip = new Date(endOfMonth)
  latestShip.setDate(latestShip.getDate() + 7 * 8)

  const fmtLong = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })
  const fmtShort = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  const yearOf = (d: Date) => d.getFullYear()

  const formatted =
    yearOf(earliestShip) === yearOf(latestShip)
      ? `${fmtLong(earliestShip)} – ${fmtLong(latestShip)} ${yearOf(latestShip)}`
      : `${fmtLong(earliestShip)} ${yearOf(earliestShip)} – ${fmtLong(latestShip)} ${yearOf(latestShip)}`

  const formattedShort =
    yearOf(earliestShip) === yearOf(latestShip)
      ? `${fmtShort(earliestShip)} – ${fmtShort(latestShip)}`
      : `${fmtShort(earliestShip)} ${yearOf(earliestShip)} – ${fmtShort(latestShip)} ${yearOf(latestShip)}`

  const batchMonth = endOfMonth.toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  })

  return { earliestShip, latestShip, formatted, formattedShort, batchMonth }
}

export function cartContainsCustomSquare(items: Array<{ category?: string; customConfig?: { custom_build?: boolean } }>): boolean {
  return items.some(
    (i) => i.category === 'square' && i.customConfig?.custom_build === true
  )
}
