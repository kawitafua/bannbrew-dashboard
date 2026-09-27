import { useEffect, useState } from 'react'

// เดือนแบบย่อภาษาไทย ใช้ชุดเดียวกับป้ายกำกับแกน X ของกราฟยอดขายรายวัน เพื่อให้ทั้งแดชบอร์ด
// ใช้รูปแบบเดือนเดียวกัน
const THAI_MONTHS_ABBR = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

/** ปี พ.ศ. ปัจจุบัน ใช้เป็นค่า fallback เวลายังไม่มีขอบเขตวันที่จริงจากข้อมูล (เช่น ตอนโหลดยังไม่เสร็จ) */
function currentYearBE() {
  return new Date().getFullYear() + 543
}

/** จำนวนวันในเดือนนั้น ๆ (month นับ 1-12) ของปี พ.ศ. ที่ระบุ — แปลงเป็น ค.ศ. ก่อนแล้วให้ Date
 * คำนวณให้ (new Date(year, month, 0) จะได้วันสุดท้ายของ "month" พอดี รองรับปีอธิกสุรทินถูกต้อง
 * เพราะการเป็นปีอธิกสุรทินขึ้นกับปี ค.ศ. จริง ไม่ได้เปลี่ยนไปเพราะเรียกเลข พ.ศ.) */
function daysInMonth(month, yearBE) {
  if (!month || !yearBE) return 31
  return new Date(yearBE - 543, month, 0).getDate()
}

/** แปลง { day, month, yearBE } (ครบทั้ง 3 ค่า) เป็น ISO string "YYYY-MM-DD" (ค.ศ.) สำหรับใช้กรองข้อมูล */
function toIso(day, month, yearBE) {
  const yearCE = yearBE - 543
  return `${String(yearCE).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** แปลง ISO string "YYYY-MM-DD" (ค.ศ.) กลับเป็น { day, month, yearBE } สำหรับแสดงผล */
function fromIso(iso) {
  if (!iso) return { day: '', month: '', yearBE: '' }
  const [yearCE, month, day] = iso.split('-').map(Number)
  return { day, month, yearBE: yearCE + 543 }
}

/**
 * ช่องเลือกวันที่แบบ วัน/เดือน/ปี พ.ศ. (dropdown 3 ช่อง) แทน <input type="date"> ของเบราว์เซอร์
 * ซึ่งบังคับแสดงเป็น ค.ศ. เสมอและปรับรูปแบบเองไม่ได้
 *
 * รับ/ส่งค่าเป็น ISO string "YYYY-MM-DD" แบบ ค.ศ. เหมือนเดิม (ใช้เทียบกับ dateKey ใน
 * filterRows() ได้ตรง ๆ) ส่วนที่แสดงผลบนจอแปลงเป็น พ.ศ. ให้อัตโนมัติ
 *
 * ค่าจะยังไม่ถูกส่งออก (onChange('')) จนกว่าจะเลือกครบทั้งวัน/เดือน/ปี — เพื่อไม่ให้กรอง
 * ข้อมูลด้วยวันที่ที่เลือกยังไม่ครบถ้วน
 */
export default function ThaiDateField({ value, onChange, minDate, maxDate, label }) {
  const [draft, setDraft] = useState(() => fromIso(value))

  // sync กลับจาก value ภายนอก (เช่นตอนกดปุ่ม "ล้างตัวกรอง" ที่ set ค่าจาก App.jsx เป็น '')
  useEffect(() => {
    setDraft(fromIso(value))
  }, [value])

  const minYearBE = minDate ? Number(minDate.slice(0, 4)) + 543 : currentYearBE() - 1
  const maxYearBE = maxDate ? Number(maxDate.slice(0, 4)) + 543 : currentYearBE() + 1
  const yearOptions = []
  for (let y = minYearBE; y <= maxYearBE; y += 1) yearOptions.push(y)

  const dayCount = daysInMonth(draft.month, draft.yearBE)
  const dayOptions = Array.from({ length: dayCount }, (_, i) => i + 1)

  function commit(next) {
    setDraft(next)
    if (next.day && next.month && next.yearBE) {
      // ถ้าวันที่เลือกไว้เกินจำนวนวันจริงของเดือน/ปีใหม่ (เช่นเปลี่ยนจาก 31 มี.ค. เป็น เม.ย.)
      // ให้ปรับวันลงมาเป็นวันสุดท้ายของเดือนนั้นแทน กัน error
      const maxDay = daysInMonth(next.month, next.yearBE)
      const day = Math.min(next.day, maxDay)
      onChange(toIso(day, next.month, next.yearBE))
    } else {
      onChange('')
    }
  }

  const selectClass =
    'rounded-lg border border-[#d8c6a3] bg-white px-1.5 py-1.5 text-sm text-[#3b2a1a] focus:outline-none focus:ring-2 focus:ring-[#A9642F]/40'

  return (
    <div className="flex flex-col gap-1 text-xs font-medium text-[#8a7256]">
      {label}
      <div className="flex gap-1">
        <select
          aria-label={`${label}: วัน`}
          value={draft.day}
          onChange={(event) => commit({ ...draft, day: Number(event.target.value) || '' })}
          className={selectClass}
        >
          <option value="">วัน</option>
          {dayOptions.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label}: เดือน`}
          value={draft.month}
          onChange={(event) => commit({ ...draft, month: Number(event.target.value) || '' })}
          className={selectClass}
        >
          <option value="">เดือน</option>
          {THAI_MONTHS_ABBR.map((name, i) => (
            <option key={name} value={i + 1}>
              {name}
            </option>
          ))}
        </select>
        <select
          aria-label={`${label}: ปี พ.ศ.`}
          value={draft.yearBE}
          onChange={(event) => commit({ ...draft, yearBE: Number(event.target.value) || '' })}
          className={selectClass}
        >
          <option value="">ปี</option>
          {yearOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
