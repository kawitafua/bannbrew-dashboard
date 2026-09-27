import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// สีเดียวกับกราฟแท่งอื่น ๆ ในส่วนข้อมูลสมาชิก (ดูเหตุผลใน CategoryBarChart.jsx)
const BAR_COLOR = '#A9642F'

/**
 * ย่อ "YYYY-MM" เป็นเดือนไทยแบบย่อ + ปี พ.ศ. 2 หลัก เช่น "2025-04" -> "เม.ย. 68"
 * (โครงเดียวกับ formatDateTick ใน DailySalesChart.jsx แต่ไม่มีวันที่ เพราะข้อมูลนี้รวมรายเดือน)
 */
function formatMonthTick(monthKey) {
  const [year, month] = monthKey.split('-').map(Number)
  const date = new Date(year, month - 1, 1)
  return date.toLocaleDateString('th-TH', { month: 'short', year: '2-digit' })
}

/**
 * กราฟแท่งสมาชิกใหม่รายเดือน รับ data = customerMetrics.signupsByMonth
 * รูปแบบ [{ month: 'YYYY-MM', count }, ...] เรียงจากเดือนเก่าสุด -> ใหม่สุดแล้ว
 * ไม่ใส่ LabelList เพราะมีจุดข้อมูลหลายเดือน (~18 เดือน) ตัวเลขบนหัวแท่งจะรกเกินไป
 * (ต่างจาก CategoryBarChart ที่มีแค่ไม่กี่หมวดหมู่ ใส่ label ได้พอดี)
 */
export default function MemberSignupsChart({ data }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold text-[#3b2a1a]">สมาชิกใหม่รายเดือน</h2>
      <div className="mt-4 h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonthTick}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={{ stroke: '#cbb48f' }}
              tickLine={false}
              interval="preserveStartEnd"
              minTickGap={16}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
              allowDecimals={false}
            />
            <Tooltip
              content={(props) => (
                <ChartTooltip
                  {...props}
                  label={props.label ? formatMonthTick(props.label) : props.label}
                  valueFormatter={formatNumber}
                />
              )}
              cursor={{ fill: '#ede2c9' }}
            />
            <Bar dataKey="count" name="สมาชิกใหม่" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={32} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
