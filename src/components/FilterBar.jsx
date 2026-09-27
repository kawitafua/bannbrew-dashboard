import ThaiDateField from './ThaiDateField'

/**
 * แถบตัวกรองส่วนกลางของแดชบอร์ด: เลือกสาขา + เลือกช่วงวันที่ + ปุ่มล้างตัวกรอง
 * ตัวกรองนี้มีผลกับ "ทุกการ์ด/กราฟ" ในหน้า (KPI, ยอดขายรายวัน, ยอดขายแยกสาขา,
 * จำนวนบิลตามชั่วโมง) เพราะ App.jsx กรองแถวข้อมูลก่อนคำนวณ metrics ทั้งหมด
 *
 * branches: รายชื่อสาขาทั้งหมด (เรียงยอดขายมาก -> น้อย) มาจากข้อมูลทั้งชุด ไม่ใช่ข้อมูล
 * ที่กรองแล้ว เพื่อไม่ให้ตัวเลือกใน dropdown หายไปเรื่อย ๆ เวลาผู้ใช้กรองอยู่
 *
 * minDate/maxDate: ขอบเขตวันที่จริงในไฟล์ ใช้จำกัดปีใน date picker ไม่ให้เลือกปีที่ไม่มีข้อมูล
 * ช่องวันที่ใช้ ThaiDateField (วัน/เดือน/ปี พ.ศ. แบบ dropdown) แทน <input type="date"> ของ
 * เบราว์เซอร์ เพราะ input แบบ native บังคับแสดงเป็น ค.ศ. เสมอ ปรับเป็น พ.ศ. เองไม่ได้
 */
export default function FilterBar({
  branches,
  branch,
  onBranchChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  minDate,
  maxDate,
  onClear,
  hasActiveFilters,
}) {
  return (
    <div className="rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-3 shadow-sm sm:p-4">
      <div className="flex flex-wrap items-end gap-3 sm:gap-4">
        <label className="flex flex-col gap-1 text-xs font-medium text-[#8a7256]">
          สาขา
          <select
            value={branch}
            onChange={(event) => onBranchChange(event.target.value)}
            className="rounded-lg border border-[#d8c6a3] bg-white px-2.5 py-1.5 text-sm text-[#3b2a1a] focus:outline-none focus:ring-2 focus:ring-[#A9642F]/40"
          >
            <option value="all">ทุกสาขา</option>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </label>

        <ThaiDateField
          label="ตั้งแต่วันที่"
          value={startDate}
          onChange={onStartDateChange}
          minDate={minDate}
          maxDate={maxDate}
        />

        <ThaiDateField
          label="ถึงวันที่"
          value={endDate}
          onChange={onEndDateChange}
          minDate={minDate}
          maxDate={maxDate}
        />

        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="rounded-lg border border-[#d8c6a3] px-3 py-1.5 text-sm font-medium text-[#5c4a34] transition-colors enabled:hover:bg-[#ede2c9] disabled:cursor-not-allowed disabled:opacity-40"
        >
          ล้างตัวกรอง
        </button>
      </div>
    </div>
  )
}
