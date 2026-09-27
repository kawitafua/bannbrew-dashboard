import { useEffect, useMemo, useState } from 'react'
import Papa from 'papaparse'
import {
  normalizeRows,
  computeMetrics,
  getBranchOptions,
  getDateBounds,
  filterRows,
} from './lib/metrics'
import FilterBar from './components/FilterBar'
import KpiCards from './components/KpiCards'
import DailySalesChart from './components/DailySalesChart'
import BranchSalesChart from './components/BranchSalesChart'
import HourlyOrdersChart from './components/HourlyOrdersChart'

const EMPTY_FILTERS = { branch: 'all', startDate: '', endDate: '' }

function App() {
  // allRows = ข้อมูลทั้งชุดหลัง normalize (ยังไม่กรอง) — คำนวณครั้งเดียวตอนโหลดไฟล์เสร็จ
  const [allRows, setAllRows] = useState(null)
  const [rawRowCount, setRawRowCount] = useState(0)
  const [error, setError] = useState(null)
  const [filters, setFilters] = useState(EMPTY_FILTERS)

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
  const metrics = useMemo(() => computeMetrics(filteredRows), [filteredRows])

  const hasActiveFilters =
    filters.branch !== 'all' || filters.startDate !== '' || filters.endDate !== ''

  const handleClearFilters = () => setFilters(EMPTY_FILTERS)

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
        <h1 className="text-xl font-bold text-[#3b2a1a] sm:text-2xl">บ้านบรู Dashboard</h1>
        <p className="mt-1 text-sm text-[#8a7256]">สรุปยอดขายจาก sales.csv</p>

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
            onClear={handleClearFilters}
            hasActiveFilters={hasActiveFilters}
          />
        </div>

        {filteredRows.length === 0 ? (
          <div className="mt-4 rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6 sm:mt-6">
            <p className="text-sm font-medium text-[#4a3a1a]">
              ไม่มีข้อมูลตรงกับตัวกรองที่เลือกไว้ (สาขา/ช่วงวันที่) ลองปรับตัวกรอง หรือกด
              "ล้างตัวกรอง" ด้านบน
            </p>
          </div>
        ) : (
          <>
            <div className="mt-4 sm:mt-6">
              <KpiCards metrics={metrics} />
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
              <DailySalesChart data={metrics.dailySales} />
              <BranchSalesChart data={metrics.salesByBranch} />
            </div>

            <div className="mt-4 sm:mt-6">
              <HourlyOrdersChart data={metrics.ordersByHour} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default App
