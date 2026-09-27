// ============================================================================
// metrics.js
// -----------------------------------------------------------------------------
// รวม "ตรรกะการคำนวณ" ทั้งหมดของแดชบอร์ดไว้ที่เดียว ไม่มีการอ้างอิง React/Recharts
// ในไฟล์นี้เลย เพื่อให้ทดสอบ (unit test) และนำไปใช้ที่อื่นได้ง่าย
//
// โครงสร้างข้อมูลดิบ 1 แถวจาก sales.csv (ก่อนแปลง):
//   order_id, datetime, branch, product_id, qty, unit_price,
//   customer_id, payment_method, channel
//
// กติกาสำคัญของข้อมูล:
//   - 1 แถว = 1 รายการสินค้าในบิล บิลเดียวกัน (order_id ซ้ำ) มีได้หลายแถว
//   - ยอดขายของแต่ละแถว = qty * unit_price
//   - customer_id ว่าง = ลูกค้าทั่วไป (walk-in) ไม่ใช่สมาชิก
//   - datetime มี offset +07:00 ติดมาแล้ว (เวลาไทยจริง) จึงตัดเอาแค่ส่วนวันที่
//     (10 ตัวอักษรแรก "YYYY-MM-DD") ได้เลยโดยไม่ต้องแปลง timezone ซ้ำ
// ============================================================================

/**
 * แปลงค่าที่อ่านจาก CSV (เป็น string เสมอ) ให้เป็นตัวเลข
 * ถ้าแปลงไม่ได้ (ค่าว่าง, ไม่ใช่ตัวเลข) ให้ถือว่าเป็น 0
 * ตัดจุลภาคคั่นหลักพันออกก่อน เผื่อไฟล์มาจาก Excel ที่ใส่ comma ในตัวเลข (เช่น "1,200")
 */
function toNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const cleaned = String(value ?? '').replace(/,/g, '').trim()
  const n = Number(cleaned)
  return Number.isFinite(n) && cleaned !== '' ? n : 0
}

/**
 * ตัดส่วน "YYYY-MM-DD" ออกจาก datetime แบบ ISO ที่มี offset +07:00 ติดมาแล้ว
 * เช่น "2025-04-01T18:48:40+07:00" -> "2025-04-01"
 * ไม่ผ่าน Date object เพื่อเลี่ยงปัญหา timezone ของเบราว์เซอร์ผู้ใช้แต่ละเครื่อง
 */
function toThaiDateKey(datetime) {
  return typeof datetime === 'string' ? datetime.slice(0, 10) : ''
}

/**
 * ตัดชั่วโมง (0-23) ออกจาก datetime แบบ ISO ที่มี offset +07:00 ติดมาแล้ว
 * เช่น "2025-04-01T18:48:40+07:00" -> 18
 * ใช้วิธีตัด string ตำแหน่งที่ 11-13 เหมือน toThaiDateKey เพื่อเลี่ยงปัญหา timezone
 * ของเบราว์เซอร์ผู้ใช้แต่ละเครื่อง (ไม่ผ่าน Date object)
 */
function toHourOfDay(datetime) {
  if (typeof datetime !== 'string' || datetime.length < 13) return null
  const hour = Number(datetime.slice(11, 13))
  return Number.isFinite(hour) && hour >= 0 && hour <= 23 ? hour : null
}

/**
 * แปลง 1 แถวดิบจาก PapaParse (string ทั้งหมด) ให้เป็นแถวที่พร้อมคำนวณ:
 *  - qty, unitPrice เป็นตัวเลข
 *  - lineTotal = qty * unitPrice (ยอดขายของแถวนี้)
 *  - dateKey = วันที่ (YYYY-MM-DD) แบบเวลาไทย
 *  - hour = ชั่วโมง (0-23) แบบเวลาไทย
 *  - isMember = true ถ้ามี customer_id (ไม่ว่าง/ไม่ใช่ whitespace ล้วน)
 */
export function parseRow(row) {
  const qty = toNumber(row.qty)
  const unitPrice = toNumber(row.unit_price)
  const customerId = (row.customer_id ?? '').trim()
  const orderId = (row.order_id ?? '').toString().trim()
  const branch = (row.branch ?? '').toString().trim()

  return {
    orderId,
    dateKey: toThaiDateKey(row.datetime),
    hour: toHourOfDay(row.datetime),
    branch: branch || 'ไม่ระบุสาขา',
    qty,
    unitPrice,
    lineTotal: qty * unitPrice,
    customerId,
    isMember: customerId !== '',
  }
}

/**
 * แปลง array แถวดิบทั้งหมดจาก CSV เป็นแถวที่พร้อมคำนวณ
 * และตัดทิ้งแถวที่ไม่มี order_id (แถวเสีย/แถวว่าง)
 *
 * หมายเหตุ: ถ้าไฟล์ CSV ต้นทางมีปัญหาชื่อคอลัมน์ (เช่น มีอักขระ BOM ติดหน้าคอลัมน์แรก
 * จากการเซฟด้วย Excel, หรือสะกด/พิมพ์ใหญ่เล็กไม่ตรง) row.order_id จะเป็น undefined
 * ทุกแถว ทำให้ normalizeRows คืนค่าว่างทั้งหมด และ dashboard จะไม่มีข้อมูลขึ้นเลย
 * (ดู transformHeader ใน App.jsx ที่ช่วยลด BOM/ช่องว่างในชื่อคอลัมน์)
 */
export function normalizeRows(rawRows) {
  return rawRows.map(parseRow).filter((row) => Boolean(row.orderId))
}

/**
 * ยอดขายรวมทั้งหมด = ผลรวม (qty * unit_price) ของทุกแถว (ทุกรายการสินค้า)
 */
export function getTotalSales(rows) {
  return rows.reduce((sum, row) => sum + row.lineTotal, 0)
}

/**
 * จำนวนบิลทั้งหมด = จำนวน order_id ที่ไม่ซ้ำกัน
 * (นับบิล ไม่ใช่นับแถว เพราะ 1 บิลมีได้หลายแถว/หลายสินค้า)
 */
export function getOrderCount(rows) {
  return new Set(rows.map((row) => row.orderId)).size
}

/**
 * ยอดขายเฉลี่ยต่อบิล = ยอดขายรวม / จำนวนบิล
 * กันหารด้วยศูนย์กรณีไม่มีข้อมูล
 */
export function getAverageOrderValue(rows) {
  const orderCount = getOrderCount(rows)
  return orderCount === 0 ? 0 : getTotalSales(rows) / orderCount
}

/**
 * จำนวนลูกค้าสมาชิกที่ไม่ซ้ำ = นับ customer_id ที่ไม่ว่าง แล้วเอาเฉพาะค่าที่ไม่ซ้ำ
 * (ลูกค้าทั่วไปที่ customer_id ว่าง จะไม่ถูกนับในที่นี้)
 */
export function getUniqueMemberCount(rows) {
  const memberIds = rows.filter((row) => row.isMember).map((row) => row.customerId)
  return new Set(memberIds).size
}

/**
 * ยอดขายรายวัน: รวม lineTotal ของทุกแถวที่อยู่วันเดียวกัน (dateKey เดียวกัน)
 * คืนค่าเป็น array [{ date, total }] เรียงจากวันเก่าสุด -> ใหม่สุด
 * (เหมาะสำหรับกราฟเส้นแนวโน้มตามเวลา)
 */
export function getDailySales(rows) {
  const totalsByDate = new Map()

  for (const row of rows) {
    if (!row.dateKey) continue
    totalsByDate.set(row.dateKey, (totalsByDate.get(row.dateKey) ?? 0) + row.lineTotal)
  }

  return Array.from(totalsByDate.entries())
    .map(([date, total]) => ({ date, total }))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
}

/**
 * ค่าเฉลี่ยเคลื่อนที่ (moving average) ของยอดขายรายวัน ใช้ลดความรกของกราฟเส้นรายวัน
 * ที่แกว่งขึ้นลงถี่ ให้เห็นแนวโน้มโดยรวมชัดขึ้น
 *
 * สำหรับแต่ละวัน จะเฉลี่ยยอดขายของ "windowSize วันล่าสุดที่มีข้อมูลอยู่ในชุดนี้"
 * (นับจาก index ใน array ไม่ใช่นับปฏิทินจริง เพราะถ้าบางวันไม่มีบิลเลยจะไม่มีแถวในชุดข้อมูล
 * อยู่แล้ว — ในทางปฏิบัติแทบไม่ต่างกัน เพราะร้านส่วนใหญ่เปิดขายทุกวัน)
 * ช่วงต้น ๆ ที่ยังไม่ครบ windowSize วัน จะเฉลี่ยเท่าที่มีข้อมูล (ไม่ปล่อยเป็นค่าว่าง)
 * เพื่อให้เส้นเฉลี่ยเริ่มขึ้นตั้งแต่จุดแรกของกราฟ
 *
 * รับ dailySales ที่เรียงวันที่จากเก่า -> ใหม่แล้ว (ผลลัพธ์ของ getDailySales)
 * คืนค่าเป็น array ค่าเฉลี่ยเรียงลำดับเดียวกัน (ยาวเท่ากับ dailySales)
 */
export function getMovingAverage(dailySales, windowSize = 7) {
  return dailySales.map((_, index) => {
    const start = Math.max(0, index - windowSize + 1)
    const window = dailySales.slice(start, index + 1)
    const sum = window.reduce((acc, day) => acc + day.total, 0)
    return sum / window.length
  })
}

/**
 * ยอดขายรายวัน พร้อมค่าเฉลี่ยเคลื่อนที่ windowSize วันแนบมาในแถวเดียวกัน
 * (สะดวกสำหรับส่งเข้ากราฟเส้นที่ต้องวาด 2 เส้นจากข้อมูลชุดเดียว: total และ movingAverage)
 */
export function getDailySalesWithMovingAverage(rows, windowSize = 7) {
  const dailySales = getDailySales(rows)
  const movingAverages = getMovingAverage(dailySales, windowSize)
  return dailySales.map((day, index) => ({ ...day, movingAverage: movingAverages[index] }))
}

/**
 * ยอดขายแยกตามสาขา: รวม lineTotal ของทุกแถวที่อยู่สาขาเดียวกัน
 * คืนค่าเป็น array [{ branch, total }] เรียงจากยอดขายมาก -> น้อย
 * (เหมาะสำหรับกราฟแท่งเปรียบเทียบสาขา)
 */
export function getSalesByBranch(rows) {
  const totalsByBranch = new Map()

  for (const row of rows) {
    totalsByBranch.set(row.branch, (totalsByBranch.get(row.branch) ?? 0) + row.lineTotal)
  }

  return Array.from(totalsByBranch.entries())
    .map(([branch, total]) => ({ branch, total }))
    .sort((a, b) => b.total - a.total)
}

/**
 * จำนวนบิลแยกตามชั่วโมงของวัน (0-23): นับ order_id ที่ไม่ซ้ำกันในแต่ละชั่วโมง
 * (บิลเดียวกันมีหลายแถวแต่เป็นชั่วโมงเดียวกันเสมอ จึงนับด้วย Set เหมือน getOrderCount)
 * คืนค่าเป็น array ยาว 24 ช่อง [{ hour: 0, count }, ..., { hour: 23, count }]
 * มีครบทุกชั่วโมงเสมอแม้ชั่วโมงนั้นไม่มีบิลเลย (count = 0) เพื่อให้กราฟแกน X ไม่ขาดช่วง
 */
export function getOrderCountByHour(rows) {
  const orderIdsByHour = Array.from({ length: 24 }, () => new Set())

  for (const row of rows) {
    if (row.hour === null) continue
    orderIdsByHour[row.hour].add(row.orderId)
  }

  return orderIdsByHour.map((orderIds, hour) => ({ hour, count: orderIds.size }))
}

/**
 * จำนวนบิลแยกตามชั่วโมง ทั้งภาพรวม (all) และแยกทีละสาขา (byBranch)
 * คำนวณครั้งเดียวตอนโหลดข้อมูล เพื่อให้ตัวเลือกสาขาในกราฟสลับไปมาได้ทันที
 * โดยไม่ต้องคำนวณใหม่ทุกครั้งที่ผู้ใช้เปลี่ยนตัวกรอง
 */
export function getOrderCountByHourGrouped(rows) {
  const branches = Array.from(new Set(rows.map((row) => row.branch)))
  const byBranch = {}

  for (const branch of branches) {
    byBranch[branch] = getOrderCountByHour(rows.filter((row) => row.branch === branch))
  }

  return {
    all: getOrderCountByHour(rows),
    byBranch,
  }
}

/**
 * ฟังก์ชันหลัก: รับแถวดิบจาก PapaParse มาครั้งเดียว แล้วคำนวณทุกอย่างที่แดชบอร์ดต้องใช้
 * เรียกใช้ครั้งเดียวตอนโหลดไฟล์ แล้วส่งผลลัพธ์นี้เข้า component ต่าง ๆ
 */
export function computeDashboardMetrics(rawRows) {
  const rows = normalizeRows(rawRows)
  const salesByBranch = getSalesByBranch(rows)

  return {
    // rowCount ไว้ให้ UI เช็คว่า parse ได้ข้อมูลจริงหรือไม่ (0 = อ่านคอลัมน์ไม่ตรง/ไฟล์ผิดที่)
    rawRowCount: rawRows.length,
    rowCount: rows.length,
    totalSales: getTotalSales(rows),
    orderCount: getOrderCount(rows),
    averageOrderValue: getAverageOrderValue(rows),
    memberCount: getUniqueMemberCount(rows),
    dailySales: getDailySalesWithMovingAverage(rows, 7),
    salesByBranch,
    // รายชื่อสาขาเรียงจากยอดขายมาก -> น้อย (ใช้เติม dropdown ตัวเลือกสาขาให้เรียงลำดับเดียวกันทั้งแดชบอร์ด)
    branches: salesByBranch.map((b) => b.branch),
    ordersByHour: getOrderCountByHourGrouped(rows),
  }
}
