export function formatCurrency(amount) {
  if (amount == null || isNaN(amount)) return '₱0.00'
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatWeight(weightKg, showUnit = true) {
  if (weightKg == null || isNaN(weightKg)) return showUnit ? '0.00 kg' : '0.00'
  const formatted = Number(weightKg).toFixed(2)
  return showUnit ? `${formatted} kg` : formatted
}
