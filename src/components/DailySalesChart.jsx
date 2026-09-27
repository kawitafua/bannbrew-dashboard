import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCurrencyCompact } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// เส้นทั้งสองเป็น "ยอดขาย" ตัวชี้วัดเดียวกัน แค่คนละระดับการปรับเรียบ (smoothing)
// จึงใช้สีเดียวกัน (Earth tone: คาราเมล/น้ำตาลกาแฟ) ต่างกันแค่ความเข้ม แทนที่จะใช้ 2 สีต่างกัน:
//  - เส้นรายวัน (แกว่งถี่) ใช้โทนอ่อน เป็นเส้นพื้นหลัง/บริบท (de-emphasis)
//  - เส้นค่าเฉลี่ย 7 วัน (เรียบ อ่านง่าย) ใช้สีเข้มเต็มโทน เป็นเส้นหลักที่ทับอยู่ด้านบน
// ทั้งคู่ผ่านการตรวจด้วย dataviz palette validator แบบ --ordinal แล้ว (โทนอ่อนคอนทราสต์
// กับพื้นครีม #f5f0e6 ที่ 2.72:1 ผ่านเกณฑ์ >= 2:1 ของ ordinal ramp, ไล่ระดับความสว่างทางเดียว,
// hue spread แค่ 9° = อ่านเป็นสีเดียวกันจริง ๆ)
const DAILY_COLOR = '#C2864A' // โทนอ่อน (caramel) — สำหรับเส้นจาง
const AVERAGE_COLOR = '#A9642F' // โทนเข้ม (terracotta/burnt sienna) — เส้นเด่น
const SURFACE_COLOR = '#fdfbf6'

/**
 * ย่อวันที่ "YYYY-MM-DD" เป็นวันที่ไทยแบบย่อบนแกน X เช่น "2025-04-01" -> "1 เม.ย. 68"
 * (locale th-TH คำนวณปี พ.ศ. แบบย่อ 2 หลักให้อัตโนมัติ ไม่ต้อง +543 เอง)
 */
function formatDateTick(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })
}

/** legend กำหนดเอง: ใช้ตัวหนังสือโทนกลาง (ไม่ใช้สีของเส้นแต่งตัวหนังสือ) + จุดสีบอกเส้น */
function renderLegend({ payload }) {
  return (
    <ul className="mb-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#8a7256]">
      {payload.map((entry) => (
        <li key={entry.value} className="flex items-center gap-1.5">
          <span
            className="h-0.5 w-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  )
}

/**
 * กราฟเส้นยอดขายรายวัน รับ data = metrics.dailySales จาก getDailySalesWithMovingAverage()
 * รูปแบบ [{ date: 'YYYY-MM-DD', total: number, movingAverage: number }, ...]
 */
export default function DailySalesChart({ data }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-[#3b2a1a]">ยอดขายรายวัน</h2>
      {/* กราฟนี้ขึ้นเต็มความกว้างหน้าจอ (ดู App.jsx) เลยเพิ่มความสูงจาก h-64/h-80 เดิม
          ให้สัดส่วนพอดีกับความกว้างที่มากขึ้น อ่านแนวโน้มและจุดพีคได้ง่ายขึ้น */}
      <div className="mt-2 h-72 w-full sm:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateTick}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={{ stroke: '#cbb48f' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatCurrencyCompact}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={64}
            />
            {/* Recharts ไม่รัน labelFormatter ให้เมื่อใช้ content แบบ custom เอง
                จึงต้องแปลงวันที่ให้อ่านง่ายเป็นภาษาไทยก่อนส่งเข้า ChartTooltip ตรงนี้แทน */}
            <Tooltip
              content={(props) => (
                <ChartTooltip {...props} label={props.label ? formatDateTick(props.label) : props.label} />
              )}
            />
            <Legend content={renderLegend} verticalAlign="top" align="left" />
            {/* เส้นรายวัน: วาดก่อน (อยู่ล่าง) โทนอ่อน ไม่มีจุด ลดความรก */}
            <Line
              type="monotone"
              dataKey="total"
              name="ยอดขายรายวัน"
              stroke={DAILY_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: DAILY_COLOR, stroke: SURFACE_COLOR, strokeWidth: 2 }}
            />
            {/* เส้นค่าเฉลี่ย 7 วัน: วาดทีหลัง (ทับด้านบน) สีเข้ม เห็นแนวโน้มชัด */}
            <Line
              type="monotone"
              dataKey="movingAverage"
              name="ค่าเฉลี่ย 7 วัน"
              stroke={AVERAGE_COLOR}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5, fill: AVERAGE_COLOR, stroke: SURFACE_COLOR, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
