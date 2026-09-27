import { formatNumber } from '../lib/format'

/**
 * การ์ด KPI หนึ่งใบ — โครงเดียวกับ KpiCard ใน KpiCards.jsx (label สีน้ำตาลอมเทาด้านบน
 * + value ตัวหนาสีน้ำตาลเข้มด้านล่าง) เพื่อให้ส่วนข้อมูลสมาชิกกับส่วนยอดขายดูเป็นระบบเดียวกัน
 */
function KpiCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-3 shadow-sm sm:p-5">
      <p className="text-xs text-[#8a7256] sm:text-sm">{label}</p>
      <p className="mt-1.5 text-xl font-semibold text-[#3b2a1a] sm:mt-2 sm:text-2xl lg:text-3xl">
        {value}
      </p>
    </div>
  )
}

/**
 * แถวการ์ด KPI 4 ใบสำหรับข้อมูลสมาชิก (จาก customers.csv):
 * จำนวนสมาชิกทั้งหมด, จำนวนที่เคยซื้อจริง, อัตราที่เคยซื้อ (%), บัญชีใช้เบอร์ร่วมกัน
 * รับ metrics = customerMetrics จาก computeCustomerMetrics()
 */
export default function CustomerKpiCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      <KpiCard label="จำนวนสมาชิกทั้งหมด" value={`${formatNumber(metrics.totalMembers)} คน`} />
      <KpiCard
        label="สมาชิกที่เคยซื้อจริง"
        value={`${formatNumber(metrics.activeMemberCount)} คน`}
      />
      <KpiCard
        label="อัตราสมาชิกที่เคยซื้อ"
        value={`${metrics.activeMemberRate.toFixed(1)}%`}
      />
      <KpiCard
        label="บัญชีใช้เบอร์ร่วมกัน"
        value={`${formatNumber(metrics.sharedPhoneCount)} คน`}
      />
    </div>
  )
}
