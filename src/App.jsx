import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { computeDashboardMetrics } from './lib/metrics'
import KpiCards from './components/KpiCards'
import DailySalesChart from './components/DailySalesChart'
import BranchSalesChart from './components/BranchSalesChart'
import HourlyOrdersChart from './components/HourlyOrdersChart'

function App() {
  const [metrics, setMetrics] = useState(null)
  const [error, setError] = useState(null)

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
        setMetrics(computeDashboardMetrics(result.data))
      },
      error: (err) => {
        setError(err.message)
      },
    })
  }, [])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6]">
        <p className="text-[#a13a1c]">โหลด sales.csv ไม่สำเร็จ: {error}</p>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6]">
        <p className="text-[#8a7256]">กำลังโหลดข้อมูล...</p>
      </div>
    )
  }

  // parse ผ่าน แต่ไม่มีแถวไหนมี order_id เลย = เกือบจะแน่นอนว่าชื่อคอลัมน์หรือ path ไฟล์ไม่ตรง
  if (metrics.rowCount === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f0e6] p-4">
        <div className="max-w-md rounded-xl border border-[#d8bd84] bg-[#f4e8cf] p-6">
          <h1 className="text-lg font-semibold text-[#4a3a1a]">ไม่พบข้อมูลที่อ่านได้จาก sales.csv</h1>
          <p className="mt-2 text-sm text-[#5c4a26]">
            อ่านไฟล์เจอ {metrics.rawRowCount} แถว แต่ไม่มีแถวไหนมีค่า{' '}
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
          <KpiCards metrics={metrics} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-2">
          <DailySalesChart data={metrics.dailySales} />
          <BranchSalesChart data={metrics.salesByBranch} />
        </div>

        <div className="mt-4 sm:mt-6">
          <HourlyOrdersChart ordersByHour={metrics.ordersByHour} branches={metrics.branches} />
        </div>
      </div>
    </div>
  )
}

export default App
