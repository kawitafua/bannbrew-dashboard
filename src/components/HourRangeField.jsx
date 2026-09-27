const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i)

/** แสดงชั่วโมงเป็นรูปแบบ "HH:00" เช่น 9 -> "09:00" */
function formatHourLabel(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

/**
 * ช่องเลือกช่วงเวลา (ชั่วโมงเริ่มต้น–สิ้นสุด ของวัน 00-23) ตัวกรองนี้มีผลกับ "ทุกการ์ด/กราฟ"
 * เหมือนตัวกรองสาขา/ช่วงวันที่ (ดู FilterBar.jsx) เพราะ App.jsx กรองแถวข้อมูลด้วยชั่วโมงนี้
 * ก่อนคำนวณ metrics ทั้งหมดเช่นกัน ไม่ได้จำกัดผลแค่กราฟ "จำนวนบิลตามชั่วโมงของวัน" เท่านั้น
 *
 * ค่าว่าง ('') ของ startHour/endHour = ไม่จำกัดด้านนั้น (เหมือนช่องวันที่)
 * รับ/ส่งค่าเป็นเลขชั่วโมง 0-23 ตรง ๆ ไม่ต้องแปลงรูปแบบเหมือน ThaiDateField
 */
export default function HourRangeField({ startHour, endHour, onStartHourChange, onEndHourChange }) {
  const selectClass =
    'rounded-lg border border-[#d8c6a3] bg-white px-1.5 py-1.5 text-sm text-[#3b2a1a] focus:outline-none focus:ring-2 focus:ring-[#A9642F]/40'

  return (
    <div className="flex flex-col gap-1 text-xs font-medium text-[#8a7256]">
      ช่วงเวลา (ชั่วโมง)
      <div className="flex items-center gap-1">
        <select
          aria-label="ช่วงเวลา: ชั่วโมงเริ่มต้น"
          value={startHour}
          onChange={(event) => onStartHourChange(event.target.value)}
          className={selectClass}
        >
          <option value="">เริ่มต้น</option>
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {formatHourLabel(h)}
            </option>
          ))}
        </select>
        <span className="text-[#9c8768]">–</span>
        <select
          aria-label="ช่วงเวลา: ชั่วโมงสิ้นสุด"
          value={endHour}
          onChange={(event) => onEndHourChange(event.target.value)}
          className={selectClass}
        >
          <option value="">สิ้นสุด</option>
          {HOUR_OPTIONS.map((h) => (
            <option key={h} value={h}>
              {formatHourLabel(h)}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
