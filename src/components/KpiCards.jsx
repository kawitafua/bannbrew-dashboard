import { formatCurrency, formatCurrencyDecimal, formatNumber } from '../lib/format'

/**
 * การ์ด KPI หนึ่งใบ: label (สีน้ำตาลอมเทา) ด้านบน + value (ตัวหนา ตัวใหญ่ สีน้ำตาลเข้ม) ด้านล่าง
 * ใช้ figure แบบ proportional (ไม่ tabular-nums) เพราะเป็นตัวเลขเดี่ยวขนาดใหญ่
 * ขนาดตัวอักษร/ระยะห่างลดลงบนจอมือถือ (2 คอลัมน์แคบกว่า) แล้วขยายขึ้นตามจอที่กว้างขึ้น
 * เพื่อไม่ให้ตัวเลขยาว ๆ อย่าง "฿4,466,821" ล้นการ์ดตอนอยู่ 2 คอลัมน์บนมือถือ
 *
 * โทนสี Earth tone: การ์ดพื้นครีมอุ่น (#fdfbf6) ขอบทราย (#e3d5bf) ตัวหนังสือหลักสีกาแฟเข้ม
 * (#3b2a1a) และ label สีน้ำตาลอมเทา (#8a7256) แทนโทนเทาเย็น (slate) เดิม
 */
function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-3 shadow-sm sm:p-5">
      <p className="text-xs font-medium tracking-wide text-[#8a7256] sm:text-sm">{label}</p>
      <p className="mt-1.5 text-xl font-bold tracking-tight text-[#3b2a1a] sm:mt-2 sm:text-2xl lg:text-3xl">
        {value}
      </p>
    </div>
  )
}

/**
 * แถวการ์ด KPI 4 ใบ ตามที่โจทย์กำหนด:
 * ยอดขายรวม, จำนวนบิล, ยอดเฉลี่ยต่อบิล, จำนวนลูกค้าสมาชิกที่ไม่ซ้ำ
 *
 * เรียง 2 คอลัมน์ตั้งแต่จอมือถือ (grid-cols-2) แล้วขยายเป็น 4 คอลัมน์บนจอใหญ่ (lg:grid-cols-4)
 * แทนที่จะเรียง 1 คอลัมน์ยาวเป็นแถวตกบนมือถือแบบเดิม
 */
export default function KpiCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard label="ยอดขายรวม" value={formatCurrency(metrics.totalSales)} />
      <KpiCard label="จำนวนบิล" value={`${formatNumber(metrics.orderCount)} บิล`} />
      <KpiCard label="ยอดเฉลี่ยต่อบิล" value={formatCurrencyDecimal(metrics.averageOrderValue)} />
      <KpiCard
        label="ลูกค้าสมาชิก (ไม่ซ้ำ)"
        value={`${formatNumber(metrics.memberCount)} คน`}
      />
    </div>
  )
}
