// ============================================================================
// format.js
// -----------------------------------------------------------------------------
// ฟังก์ชันจัดรูปแบบตัวเลขสำหรับ "แสดงผล" เท่านั้น (ไม่มีตรรกะคำนวณ — อยู่ใน metrics.js)
// ============================================================================

const numberFormatter = new Intl.NumberFormat('th-TH', {
  maximumFractionDigits: 0,
})

const decimalCurrencyFormatter = new Intl.NumberFormat('th-TH', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** จำนวนเต็ม มีจุลภาคคั่นหลักพัน เช่น 12345 -> "12,345" */
export function formatNumber(value) {
  return numberFormatter.format(Math.round(value))
}

/** จำนวนเงิน มีจุลภาคคั่นหลักพัน + หน่วย "฿" เช่น 12345.6 -> "฿12,346" */
export function formatCurrency(value) {
  return `฿${numberFormatter.format(Math.round(value))}`
}

/** จำนวนเงิน แบบมีทศนิยม 2 ตำแหน่งเสมอ + หน่วย "฿" เช่น 128.3901 -> "฿128.39" */
export function formatCurrencyDecimal(value) {
  return `฿${decimalCurrencyFormatter.format(value)}`
}

/** ย่อจำนวนเงินให้สั้นสำหรับแกนกราฟ เช่น 1500 -> "฿1.5K", 2000000 -> "฿2.0M" */
export function formatCurrencyCompact(value) {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `฿${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`
  return formatCurrency(value)
}
