import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatNumber } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// ใช้สีเดียวกับกราฟแท่งอื่น ๆ ในแดชบอร์ด (Earth tone: น้ำตาลกาแฟ) เพราะเป็นกราฟแท่งหมวดหมู่
// เดี่ยว (nominal category, ตัวชี้วัดเดียว) เหมือนกัน — ดูเหตุผลเต็มใน BranchSalesChart.jsx
const BAR_COLOR = '#A9642F'

/**
 * ป้ายชื่อหมวดหมู่บนแกน X แบบ custom: ถ้าชื่อยาว (เช่น "มหาวิทยาลัย", "ต่ำกว่า 18")
 * ให้ตัดขึ้นบรรทัดที่ 2 แทนที่จะปล่อยให้ Recharts ซ่อนป้ายทิ้งเพราะพื้นที่ไม่พอ
 * (โครงเดียวกับ BranchTick ใน BranchSalesChart.jsx)
 */
function CategoryTick({ x, y, payload }) {
  const name = payload.value
  const mid = Math.ceil(name.length / 2)
  const lines = name.length > 6 ? [name.slice(0, mid), name.slice(mid)] : [name]

  return (
    <g transform={`translate(${x},${y})`}>
      {lines.map((line, i) => (
        <text
          key={line + i}
          x={0}
          y={0}
          dy={14 + i * 14}
          textAnchor="middle"
          fill="#9c8768"
          fontSize={12}
        >
          {line}
        </text>
      ))}
    </g>
  )
}

/**
 * กราฟแท่งหมวดหมู่แบบใช้ซ้ำได้ทั่วไป: นับจำนวนต่อหมวดหมู่ (ไม่ใช่ยอดเงิน) แสดงเป็นแท่งสีเดียว
 * รับ data = [{ label, count }] มาตรง ๆ (ลำดับตามที่ส่งมา ไม่ได้เรียงเองในนี้ — ให้ฟังก์ชันคำนวณ
 * ใน customerMetrics.js เป็นคนตัดสินใจลำดับ เพราะบางกรณีต้องเรียงตามธรรมชาติ เช่นช่วงอายุ
 * ไม่ใช่เรียงตามจำนวน)
 */
export default function CategoryBarChart({ title, data }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-[#3b2a1a]">{title}</h2>
      <div className="mt-4 h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="label"
              tick={<CategoryTick />}
              height={40}
              interval={0}
              axisLine={{ stroke: '#cbb48f' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatNumber}
              tick={{ fill: '#9c8768', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip valueFormatter={formatNumber} />} cursor={{ fill: '#ede2c9' }} />
            <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList dataKey="count" position="top" formatter={formatNumber} fill="#5c4a34" fontSize={12} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
