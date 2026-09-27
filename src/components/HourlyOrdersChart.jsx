import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// ใช้สีเดียวกับกราฟแท่งแยกสาขา (Earth tone: น้ำตาลกาแฟ) เพื่อให้ทั้งแดชบอร์ดอ่านเป็นระบบสีเดียวกัน
// ไม่ต้องไล่สีตามชั่วโมงเพราะเป็นตัวชี้วัดเดียว (จำนวนบิล) แค่แยกตามช่วงเวลา
const BAR_COLOR = '#A9642F'

/**
 * คำนวณชั่วโมงที่จะแสดงป้ายกำกับบนแกน X แบบไดนามิก ไม่ใช้เลขชั่วโมงตายตัวเหมือนเดิมอีกต่อไป
 * เพราะตอนนี้ data อาจถูกตัดขอบเขตมาจากตัวกรอง "ช่วงเวลา" ใน FilterBar (เช่นเลือกดูแค่ 09:00-17:00)
 * ไม่ใช่ 0-23 เต็มวันเสมอไปแล้ว — ถ้ายังใช้ป้ายตายตัว [0, 3, 6, ...] ตอนกรองแคบลง ป้ายที่ตั้งไว้
 * อาจไม่ตรงกับชั่วโมงที่เหลืออยู่ใน data เลยสักอัน ทำให้แกน X ไม่มีป้ายขึ้นเลย
 * เลือกระยะห่างระหว่างป้ายให้ไม่เกิน ~8 ป้ายเสมอ (กันป้ายชนกันบนจอแคบ) ไม่ว่าช่วงที่เลือกจะกว้าง
 * แค่ไหน และใส่ชั่วโมงสุดท้ายของช่วงเสมอ กันแกนตัดจบไปดื้อ ๆ โดยไม่มีป้ายท้ายสุด
 */
function computeHourTicks(data) {
  if (!data.length) return []
  const minHour = data[0].hour
  const maxHour = data[data.length - 1].hour
  const span = maxHour - minHour
  const step = span <= 8 ? 1 : span <= 16 ? 2 : 3

  const ticks = []
  for (let h = minHour; h < maxHour; h += step) ticks.push(h)
  ticks.push(maxHour)
  return ticks
}

/** แปลงเลขชั่วโมง (0-23) เป็นป้ายแกน X แบบสั้น เช่น 8 -> "08" */
function formatHourTick(hour) {
  return String(hour).padStart(2, '0')
}

/** แปลงเลขชั่วโมงเป็นข้อความเต็มสำหรับ tooltip เช่น 8 -> "08:00 น." */
function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00 น.`
}

/**
 * กราฟแท่งจำนวนบิลแยกตามชั่วโมงของวัน (0-23)
 * รับ data = metrics.ordersByHour จาก computeMetrics() รูปแบบ [{hour, count}, ...]
 * ข้อมูลนี้คำนวณจากแถวที่ผ่านตัวกรองสาขา/ช่วงวันที่/ช่วงเวลาส่วนกลาง (FilterBar) มาแล้ว
 * จึงไม่ต้องมี dropdown เลือกสาขาซ้ำในการ์ดนี้อีก — ใช้ตัวกรองที่ด้านบนของแดชบอร์ดแทน
 * (data อาจไม่ครบ 24 ชั่วโมงเสมอไปแล้ว ถ้าผู้ใช้เลือกช่วงเวลาแคบลงในตัวกรอง)
 */
export default function HourlyOrdersChart({ data }) {
  const hourTicks = computeHourTicks(data)

  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-[#3b2a1a]">จำนวนบิลตามชั่วโมงของวัน</h2>
      <div className="mt-2 h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourTick}
              ticks={hourTicks}
              tick={{ fill: '#9c8768', fontSize: 11 }}
              axisLine={{ stroke: '#cbb48f' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={40}
              allowDecimals={false}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  label={props.label !== undefined ? formatHourLabel(props.label) : props.label}
                  valueFormatter={formatNumber}
                />
              )}
              cursor={{ fill: '#ede2c9' }}
            />
            <Bar dataKey="count" name="จำนวนบิล" fill={BAR_COLOR} radius={[3, 3, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
