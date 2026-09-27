import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { formatNumber } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// ใช้สีเดียวกับกราฟแท่งแยกสาขา (Earth tone: น้ำตาลกาแฟ) เพื่อให้ทั้งแดชบอร์ดอ่านเป็นระบบสีเดียวกัน
// ไม่ต้องไล่สีตามชั่วโมงเพราะเป็นตัวชี้วัดเดียว (จำนวนบิล) แค่แยกตามช่วงเวลา
const BAR_COLOR = '#A9642F'

// แท่งข้อมูลมีครบ 24 ชั่วโมงเสมอ แต่ถ้าบังคับให้แสดงป้ายกำกับครบทั้ง 24 ป้าย (interval={0})
// บนจอมือถือแคบ ๆ ป้ายจะชนกันจนอ่านไม่ออก (เช่น "0001020304...") จึงกำหนดตายตัวว่า
// แสดงป้ายทุก 3 ชั่วโมงเท่านั้น ("00", "03", "06", ...) ซึ่งมีระยะห่างพออ่านออกได้ทั้งจอเล็ก/จอใหญ่
// (แท่งของทุกชั่วโมงยังคงถูกวาดครบ 24 แท่ง แค่ไม่ใช่ทุกแท่งที่มีป้ายกำกับ)
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21]

/** แปลงเลขชั่วโมง (0-23) เป็นป้ายแกน X แบบสั้น เช่น 8 -> "08" */
function formatHourTick(hour) {
  return String(hour).padStart(2, '0')
}

/** แปลงเลขชั่วโมงเป็นข้อความเต็มสำหรับ tooltip เช่น 8 -> "08:00 น." */
function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00 น.`
}

/**
 * กราฟแท่งจำนวนบิลแยกตามชั่วโมงของวัน (0-23) พร้อม dropdown เลือกดูทีละสาขา
 * รับ ordersByHour = metrics.ordersByHour จาก getOrderCountByHourGrouped()
 * รูปแบบ { all: [{hour, count}, ...24], byBranch: { [branch]: [{hour, count}, ...24] } }
 * และ branches = metrics.branches (รายชื่อสาขาเรียงยอดขายมาก -> น้อย สำหรับเติม dropdown)
 */
export default function HourlyOrdersChart({ ordersByHour, branches }) {
  const [selectedBranch, setSelectedBranch] = useState('all')

  const data = useMemo(() => {
    if (selectedBranch === 'all') return ordersByHour.all
    return ordersByHour.byBranch[selectedBranch] ?? ordersByHour.all
  }, [ordersByHour, selectedBranch])

  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-[#3b2a1a]">จำนวนบิลตามชั่วโมงของวัน</h2>
        <select
          value={selectedBranch}
          onChange={(event) => setSelectedBranch(event.target.value)}
          className="rounded-lg border border-[#d8c6a3] bg-[#fdfbf6] px-2.5 py-1.5 text-xs font-medium text-[#5c4a34] focus:outline-none focus:ring-2 focus:ring-[#A9642F]/40 sm:text-sm"
        >
          <option value="all">ทุกสาขา</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-2 h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="hour"
              tickFormatter={formatHourTick}
              ticks={HOUR_TICKS}
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
