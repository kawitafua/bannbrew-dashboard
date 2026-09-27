import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import {
  normalizeRows,
  computeMetrics,
  getBranchOptions,
  getDateBounds,
  filterRows,
  getActiveCustomerIds,
} from './lib/metrics'
import {
  normalizeCustomerRows,
  filterCustomerRows,
  computeCustomerMetrics,
} from './lib/customerMetrics'
import FilterBar from './components/FilterBar'
import KpiCards from './components/KpiCards'
import DailySalesChart from './components/DailySalesChart'
import BranchSalesChart from './components/BranchSalesChart'
import HourlyOrdersChart from './components/HourlyOrdersChart'
import CustomerKpiCards from './components/CustomerKpiCards'
import CategoryBarChart from './components/CategoryBarChart'
import MemberSignupsChart from './components/MemberSignupsChart'

const EMPTY_FILTERS = { branch: 'all', startDate: '', endDate: '', startHour: '', endHour: '' }

function App() {
  // allRows = ข้อมูลทั้งชุดหลัง normalize (ยังไม่กรอง) — คำนวณครั้งเดียวตอนโหลดไฟล์เสร็จ
  const [allRows, setAllRows] = useState(null)
  const [rawRowCount, setRawRowCount] = useState(0)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

  // ข้อมูลสมาชิกจาก public/customers.csv — แยก state ต่างหากจากยอดขาย เพราะเป็นคนละไฟล์/
  // คนละจังหวะโหลด ถ้าไฟล์นี้โหลดไม่สำเร็จก็ไม่ควรทำให้ส่วนยอดขายที่เหลือใช้งานไม่ได้ไปด้วย
  const [customerRows, setCustomerRows] = useState(null)
  const [rawCustomerRowCount, setRawCustomerRowCount] = useState(0)
  const [customerError, setCustomerError] = useState(null)

  useEffect(() => {
    // ไฟล์อยู่ใน public/ จึง fetch ได้ตรง ๆ ที่ path "/sales.csv"
    Papa.parse('/sales.csv', {
      download: true,
      header: true,
      skipEmptyLines: 'greedy', // ตัดทั้งแถวว่างสนิทและแถวที่มีแต่ช่องว่าง/คอมมาล้วน
      // ตัด BOM (พบบ่อยเมื่อเซฟ CSV จาก Excel) และช่องว่างหน้า-หลังชื่อคอลัมน์ออก
      // ไม่งั้น "order_id" ที่มี BOM ติดจะกลายเป็นคนละ key กับที่โค้ดคาดไว้ ทำให้ทุกแถวถูกทิ้ง
      transformHeader: (header) => header.replace(/^﻿/, '').trim(),
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (result) => {
        if (result.errors?.length) {
          console.warn('PapaParse warnings:', result.errors)
        }
        setRawRowCount(result.data.length)
        setAllRows(normalizeRows(result.data))
      },
      error: (err) => {
        setError(err.message)
      },
    })

    // เดียวกันกับด้านบนแต่สำหรับ customers.csv (ข้อมูลสมาชิก) — parse แยก effect เพราะเป็นคนละ
    // ไฟล์คนละ config การแปลงข้อมูล
    Papa.parse('/customers.csv', {
      download: true,
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (header) => header.replace(/^﻿/, '').trim(),
      transform: (value) => (typeof value === 'string' ? value.trim() : value),
      complete: (result) => {
        if (result.errors?.length) {
          console.warn('PapaParse warnings (customers.csv):', result.errors)
        }
        setRawCustomerRowCount(result.data.length)
        setCustomerRows(normalizeCustomerRows(result.data))
      },
      error: (err) => {
        setCustomerError(err.message)
      },
    })
  }, [])

  // ตัวเลือกสาขา + ขอบเขตวันที่ ต้องมาจากข้อมูล "ทั้งชุด" เสมอ ไม่ใช่ข้อมูลที่กรองแล้ว
  // ไม่งั้นพอเลือกกรองไปแล้ว ตัวเลือกในแถบตัวกรองจะหายไปเรื่อย ๆ ตามข้อมูลที่เหลือ
  const branchOptions = useMemo(() => (allRows ? getBranchOptions(allRows) : []), [allRows])
  const dateBounds = useMemo(
    () => (allRows ? getDateBounds(allRows) : { minDate: null, maxDate: null }),
    [allRows],
  )

  const filteredRows = useMemo(
    () => (allRows ? filterRows(allRows, filters) : []),
    [allRows, filters],
  )
  const metrics = useMemo(() => computeMetrics(filteredRows, filters), [filteredRows, filters])

  // เคยซื้อจริงหรือไม่ ต้องดูจากยอดขาย "ทั้งชุด" เสมอ (allRows) ไม่ใช่ filteredRows
  // เพราะสถานะนี้ควรนับตลอดประวัติ ไม่ผูกกับตัวกรองช่วงวันที่ที่กำลังดูอยู่ตอนนี้
  const activeCustomerIds = useMemo(
    () => (allRows ? getActiveCustomerIds(allRows) : new Set()),
    [allRows],
  )
  // ส่วนสมาชิกกรองแค่ตาม "สาขา" ตัวเดียวกับฝั่งยอดขาย ไม่กรองตามช่วงวันที่ เพราะวันที่สมัคร
  // สมาชิกเป็นคนละมิติกับวันที่ซื้อของ — กรองตามวันที่จะทำให้ตัวเลขสมาชิกดูสับสน (เช่น สมาชิก
  // ที่สมัครเมื่อปีก่อนจะหายไปจากรายงานทั้งที่ยังเป็นสมาชิกอยู่)
  const filteredCustomerRows = useMemo(
    () => (customerRows ? filterCustomerRows(customerRows, filters) : []),
    [customerRows, filters],
  )
  const customerMetrics = useMemo(
    () => computeCustomerMetrics(filteredCustomerRows, activeCustomerIds),
    [filteredCustomerRows, activeCustomerIds],
  )

  const hasActiveFilters =
    filters.branch !== 'all' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.startHour !== '' ||
    filters.endHour !== ''

  const handleClearFilters = () => setFilters(EMPTY_FILTERS)

  // เลือกชั่วโมงเริ่มต้น: ถ้าชั่วโมงสิ้นสุดที่เลือกไว้ก่อนหน้านี้น้อยกว่าค่าใหม่ ให้เลื่อนตามขึ้นไป
  // ด้วย กันกรณีเลือกช่วงกลับด้าน (เช่นเคยตั้งสิ้นสุด = 10 แล้วมาเปลี่ยนเริ่มต้น = 15 ทีหลัง)
  const handleStartHourChange = (startHour) => {
    setFilters((prev) => ({
      ...prev,
      startHour,
      endHour:
        startHour !== '' && prev.endHour !== '' && Number(prev.endHour) < Number(startHour)
          ? startHour
          : prev.endHour,
    }))
  }

  // เดียวกันกับด้านบนแต่กลับด้าน: เลือกชั่วโมงสิ้นสุดน้อยกว่าเริ่มต้นที่ตั้งไว้ก่อนหน้า
  const handleEndHourChange = (endHour) => {
    setFilters((prev) => ({
      ...prev,
      endHour,
      startHour:
        endHour !== '' && prev.startHour !== '' && Number(prev.startHour) > Number(endHour)
          ? endHour
          : prev.startHour,
    }))
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6]">
        <p className="text-[#a13a1c]">โหลด sales.csv ไม่สำเร็จ: {error}</p>
      </div>
    )
  }

  if (!allRows) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6]">
        <p className="text-[#8a7256]">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  // parse ผ่าน แต่ไม่มีแถวไหนมี order_id เลย = เกือบจะแน่นอนว่าชื่อคอลัมน์หรือ path ไฟล์ไม่ตรง
  // เช็คจาก allRows (ข้อมูลทั้งชุดก่อนกรอง) เท่านั้น ไม่ใช้ metrics.rowCount ของข้อมูลที่กรองแล้ว
  // เพราะ metrics.rowCount === 0 ก็เกิดได้ปกติเวลาผู้ใช้เลือกช่วงวันที่ที่ไม่มีข้อมูล
  if (allRows.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6] p-4">
        <div className="max-w-md rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6">
          <h1 className="text-lg font-semibold text-[#4a3a1a]">ไม่พบข้อมูลที่อ่านได้จาก sales.csv</h1>
          <p className="mt-2 text-sm text-[#5c4a26]">
            อ่านไฟล์เจอ {rawRowCount} แถว แต่ไม่มีแถวไหนมีค่า{' '}
            <code className="rounded bg-[#e9d9b0] px-1">order_id</code> เลย สาเหตุที่พบบ่อยที่สุด:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[#5c4a26]">
            <li>ชื่อคอลัมน์ในไฟล์สะกด/พิมพ์ใหญ่เล็กไม่ตรงกับ order_id, datetime, branch, product_id, qty, unit_price, customer_id, payment_method, channel</li>
            <li>ไฟล์เซฟจาก Excel เป็น "CSV UTF-8" แล้วมีอักขระ BOM หรือใช้ตัวคั่นเป็น ; แทน , (ลองเซฟใหม่เป็น "CSV (Comma delimited)")</li>
            <li>ไฟล์ไม่ได้อยู่ที่ public/sales.csv พอดี (ชื่อไฟล์/ตำแหน่งไม่ตรง)</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f0e6]">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-xl font-bold tracking-tight text-[#3b2a1a] sm:text-2xl">
          บ้านบรู Dashboard
        </h1>
        <p className="mt-1 text-sm font-medium text-[#8a7256]">สรุปยอดขายจาก sales.csv</p>

        <div className="mt-4 sm:mt-6">
          <FilterBar
            branches={branchOptions}
            branch={filters.branch}
            onBranchChange={(branch) => setFilters((prev) => ({ ...prev, branch }))}
            startDate={filters.startDate}
            endDate={filters.endDate}
            onStartDateChange={(startDate) => setFilters((prev) => ({ ...prev, startDate }))}
            onEndDateChange={(endDate) => setFilters((prev) => ({ ...prev, endDate }))}
            minDate={dateBounds.minDate}
            maxDate={dateBounds.maxDate}
            startHour={filters.startHour}
            endHour={filters.endHour}
            onStartHourChange={handleStartHourChange}
            onEndHourChange={handleEndHourChange}
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {filteredRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6 sm:mt-6">
            <p className="text-sm font-medium text-[#4a3a1a]">
              ไม่มีข้อมูลตรงกับตัวกรองที่เลือกไว้ (สาขา/ช่วงวันที่/ช่วงเวลา) ลองปรับตัวกรอง หรือกด
              "ล้างตัวกรอง" ด้านบน
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 sm:mt-6">
              <KpiCards metrics={metrics} />
            </div>

            {/* กราฟยอดขายรายวันเป็นกราฟที่ "ยาว" ที่สุด (แกน X มีจุดข้อมูลนับร้อยจุดตามช่วงวันที่
                ที่กรอง) เลยให้ขึ้นเต็มความกว้างหน้าจอเป็นแถวของตัวเอง อ่านง่ายกว่าถูกบีบให้เหลือ
                ครึ่งจอ ส่วนกราฟอีก 2 อัน (แยกสาขา, ตามชั่วโมง) มีจำนวนหมวดหมู่คงที่และน้อยกว่ามาก
                (5 สาขา, 24 ชั่วโมง) จึงอ่านง่ายอยู่แล้วแม้อยู่ในคอลัมน์ครึ่งจอ เลยจับมาไว้แถวล่าง
                ด้วยกัน */}
            <div className="mt-4 sm:mt-6">
              <DailySalesChart data={metrics.dailySales} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
              <BranchSalesChart data={metrics.salesByBranch} />
              <HourlyOrdersChart data={metrics.ordersByHour} />
            </div>
          </>
        )}

        {/* ส่วนข้อมูลสมาชิกจาก customers.csv — วางแยกจากส่วนยอดขายด้านบนโดยตั้งใจ ไม่ผูกกับ
            filteredRows.length === 0 ของฝั่งยอดขาย เพราะสองส่วนนี้คนละไฟล์คนละตัวกรอง (สมาชิก
            กรองแค่ตามสาขา ไม่กรองตามวันที่) การไม่มีข้อมูลยอดขายในช่วงที่เลือกไม่ควรทำให้ส่วน
            สมาชิกหายไปด้วย */}
        <div className="mt-8 sm:mt-10">
          <h2 className="text-lg font-bold tracking-tight text-[#3b2a1a] sm:text-xl">
            ข้อมูลสมาชิก
          </h2>
          <p className="mt-1 text-sm font-medium text-[#8a7256]">สรุปข้อมูลสมาชิกจาก customers.csv</p>

          {customerError ? (
            <div className="mt-4 rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6 sm:mt-6">
              <p className="text-sm font-medium text-[#4a3a1a]">
                โหลด customers.csv ไม่สำเร็จ: {customerError}
              </p>
            </div>
          ) : !customerRows ? (
            <div className="mt-4 rounded-xl border border-[#e3d5bf] bg-[#fdfbf6] p-6 sm:mt-6">
              <p className="text-sm text-[#8a7256]">กำลังโหลดข้อมูลสมาชิก...</p>
            </div>
          ) : customerRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6 sm:mt-6">
              <p className="text-sm font-medium text-[#4a3a1a]">
                ไม่พบข้อมูลที่อ่านได้จาก customers.csv (อ่านไฟล์เจอ {rawCustomerRowCount} แถว
                แต่ไม่มีแถวไหนมีค่า <code className="rounded bg-[#e9d9b0] px-1">customer_id</code>{' '}
                เลย)
              </p>
            </div>
          ) : filteredCustomerRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6 sm:mt-6">
              <p className="text-sm font-medium text-[#4a3a1a]">
                ไม่มีข้อมูลสมาชิกตรงกับสาขาที่เลือกไว้
              </p>
            </div>
          ) : (
            <>
              <div className="mt-4 sm:mt-6">
                <CustomerKpiCards metrics={customerMetrics} />
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
                <CategoryBarChart title="สมาชิกแยกตามเพศ" data={customerMetrics.genderBreakdown} />
                <CategoryBarChart
                  title="สมาชิกแยกตามช่วงอายุ"
                  data={customerMetrics.ageGroupBreakdown}
                />
                <CategoryBarChart
                  title="สมาชิกแยกตามสาขา"
                  data={customerMetrics.homeBranchBreakdown}
                />
                <MemberSignupsChart data={customerMetrics.signupsByMonth} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
