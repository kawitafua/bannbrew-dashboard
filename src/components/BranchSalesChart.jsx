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
import { formatCurrencyCompact } from '../lib/format'
import ChartTooltip from './ChartTooltip'

// สาขาเป็นหมวดหมู่ที่ไม่มีลำดับตามธรรมชาติ (nominal) และมีตัวชี้วัดเดียว (ยอดขาย)
// จึงใช้สีเดียวกันทุกแท่ง แทนการไล่สีหรือสุ่มสีต่อแท่ง — ใช้สีเดียวกับเส้นค่าเฉลี่ย 7 วัน
// ในกราฟข้าง ๆ (โทนน้ำตาลกาแฟ) เพื่อให้ทั้งแดชบอร์ดอ่านเป็นระบบสีเดียวกัน
const BAR_COLOR = '#A9642F'

/**
 * ป้ายชื่อสาขาบนแกน X แบบ custom: ถ้าชื่อยาว (เช่น "มหาวิทยาลัย") ให้ตัดขึ้นบรรทัดที่ 2
 * แทนที่จะปล่อยให้ Recharts ซ่อนป้ายทิ้งเพราะพื้นที่ไม่พอบนจอมือถือแคบ ๆ
 */
function BranchTick({ x, y, payload }) {
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
 * กราฟแท่งยอดขายแยกสาขา รับ data = metrics.salesByBranch จาก getSalesByBranch()
 * รูปแบบ [{ branch: string, total: number }, ...] ซึ่งเรียงจากมาก -> น้อยมาแล้ว
 */
export default function BranchSalesChart({ data }) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-4 shadow-sm sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight text-[#3b2a1a]">ยอดขายแยกสาขา</h2>
      <div className="mt-4 h-64 w-full sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 24, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e6dcc8" strokeDasharray="0" />
            <XAxis
              dataKey="branch"
              tick={<BranchTick />}
              height={40}
              // บังคับให้แสดงทุกป้ายชื่อสาขา (Recharts ปกติจะประเมินความกว้างจากชื่อสาขา
              // แบบบรรทัดเดียวแล้วซ่อนบางป้ายทิ้งถ้าคิดว่าจะชนกัน ทั้งที่จริงเราตัดขึ้น
              // บรรทัดที่ 2 ให้แคบลงแล้วใน BranchTick จึงไม่ชนกันจริง)
              interval={0}
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
            <Tooltip content={<ChartTooltip />} cursor={{ fill: '#ede2c9' }} />
            <Bar dataKey="total" fill={BAR_COLOR} radius={[4, 4, 0, 0]} maxBarSize={48}>
              <LabelList
                dataKey="total"
                position="top"
                formatter={formatCurrencyCompact}
                fill="#5c4a34"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
