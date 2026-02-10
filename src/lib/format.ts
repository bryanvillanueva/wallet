export const formatCurrency = (cents: number | null) => {
  if (cents === null || cents === undefined) return 'No registrado'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(cents / 100)
}
