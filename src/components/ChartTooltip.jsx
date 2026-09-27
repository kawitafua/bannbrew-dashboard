import { formatCurrency } from '../lib/format'

/**
 * กล่อง tooltip ที่ใช้ร่วมกันทุกกราฟ รับ props จาก Recharts (active, payload, label)
 * ถ้ามีข้อมูลเดียว (เช่นกราฟแท่งแยกสาขา) โชว์แค่ค่า ฿
 * ถ้ามีหลายเส้นซ้อนกัน (เช่นยอดขายรายวัน + ค่าเฉลี่ย 7 วัน) โชว์ชื่อกำกับแต่ละเส้นด้วย
 * เพื่อไม่ให้สับสนว่าตัวเลขไหนเป็นของเส้นไหน
 *
 * valueFormatter: ฟังก์ชันแปลงค่าตัวเลขก่อนแสดง ค่าเริ่มต้นคือ formatCurrency (แสดง ฿)
 * แต่กราฟที่ไม่ใช่ยอดขาย (เช่นจำนวนบิลตามชั่วโมง) ส่ง formatNumber เข้ามาแทนได้
 * เพื่อไม่ให้ตัวเลขจำนวนนับถูกใส่หน่วย ฿ ผิด ๆ
 *
 * โทนสี Earth tone: กล่องพื้นครีมอุ่น ขอบทราย ตัวหนังสือน้ำตาลเข้ม/น้ำตาลอมเทา
 */
export default function ChartTooltip({ active, payload, label, valueFormatter = formatCurrency }) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded-lg border border-[#e3d5bf] bg-[#fdfbf6] px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-[#8a7256]">{label}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} className="text-sm font-semibold text-[#3b2a1a]">
          {payload.length > 1 && (
            <span
              className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
              style={{ backgroundColor: entry.color }}
            />
          )}
          {payload.length > 1 && (
            <span className="mr-1 font-normal text-[#8a7256]">{entry.name}:</span>
          )}
          {valueFormatter(entry.value)}
        </p>
      ))}
    </div>
  )
}
