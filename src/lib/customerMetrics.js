// ============================================================================
// customerMetrics.js
// -----------------------------------------------------------------------------
// รวม "ตรรกะการคำนวณ" ทั้งหมดสำหรับข้อมูลสมาชิกจาก public/customers.csv ไว้ที่เดียว
// แยกไฟล์จาก metrics.js (ซึ่งเป็นข้อมูลยอดขายจาก sales.csv) เพราะเป็นคนละแหล่งข้อมูล/
// คนละมิติกัน ไม่มีการอ้างอิง React/Recharts ในไฟล์นี้เลย เช่นเดียวกับ metrics.js
//
// โครงสร้างข้อมูลดิบ 1 แถวจาก customers.csv (ก่อนแปลง):
//   customer_id, nickname, gender, age_group, home_branch_id, joined_date,
//   phone, is_shared_phone
// ============================================================================

// customers.csv เก็บสาขาเป็นรหัส (B01-B05) ไม่ใช่ชื่อสาขาภาษาไทยเหมือน sales.csv และไม่มี
// ไฟล์ไหนให้ mapping ตรง ๆ ระหว่างรหัสกับชื่อสาขา จึงพิสูจน์ mapping นี้เอง โดย
// cross-reference customer_id ระหว่าง customers.csv กับ sales.csv: ลูกค้าแต่ละคนไปซื้อที่
// สาขา (ชื่อไทย) ตรงกับ home_branch_id ของตัวเองเป็นส่วนใหญ่ท่วมท้น (มากกว่า 84% ของบิล
// ของลูกค้ากลุ่มนั้นทุกกลุ่ม) จึงมั่นใจได้ว่า mapping นี้ถูกต้อง:
//   B01 -> สยาม, B02 -> สีลม, B03 -> อารีย์, B04 -> บางนา, B05 -> มหาวิทยาลัย
const BRANCH_ID_TO_NAME = {
  B01: 'สยาม',
  B02: 'สีลม',
  B03: 'อารีย์',
  B04: 'บางนา',
  B05: 'มหาวิทยาลัย',
}

// ลำดับช่วงอายุตามธรรมชาติ (ไม่ใช่เรียงตามตัวอักษร ไม่งั้น "ต่ำกว่า 18" จะไปอยู่ท้ายสุด)
const AGE_GROUP_ORDER = ['ต่ำกว่า 18', '18-24', '25-34', '35-44', '45-54', '55+']

// ลำดับเพศที่ต้องการให้แสดงคงที่เสมอ (ไม่เรียงตามจำนวน) กันไม่ให้ตำแหน่งแท่งสลับไปมา
// เวลาข้อมูลเปลี่ยนตามตัวกรองสาขา
const GENDER_ORDER = ['ชาย', 'หญิง', 'ไม่ระบุ']

/** ตัดส่วน "YYYY-MM" ออกจาก joined_date เช่น "2025-04-01 00:00:00" -> "2025-04" */
function toMonthKey(joinedDate) {
  return typeof joinedDate === 'string' ? joinedDate.slice(0, 7) : ''
}

/**
 * แปลง 1 แถวดิบจาก PapaParse (string ทั้งหมด) ให้เป็นแถวที่พร้อมคำนวณ:
 *  - homeBranchName = ชื่อสาขาภาษาไทย แปลงจาก home_branch_id ผ่าน mapping ด้านบน
 *    (ถ้าเป็นรหัสที่ไม่รู้จัก จะคงรหัสเดิมไว้แทนชื่อ กันไม่ให้ข้อมูลหายเงียบ ๆ)
 *  - joinMonthKey = เดือนที่สมัคร (YYYY-MM)
 *  - isSharedPhone = แปลงจาก string "True"/"False" เป็น boolean จริง
 */
export function parseCustomerRow(row) {
  const homeBranchId = (row.home_branch_id ?? '').toString().trim()

  return {
    customerId: (row.customer_id ?? '').toString().trim(),
    nickname: (row.nickname ?? '').toString().trim(),
    gender: (row.gender ?? '').toString().trim() || 'ไม่ระบุ',
    ageGroup: (row.age_group ?? '').toString().trim(),
    homeBranchId,
    homeBranchName: BRANCH_ID_TO_NAME[homeBranchId] ?? (homeBranchId || 'ไม่ระบุสาขา'),
    joinMonthKey: toMonthKey(row.joined_date),
    isSharedPhone: (row.is_shared_phone ?? '').toString().trim().toLowerCase() === 'true',
  }
}

/**
 * แปลง array แถวดิบทั้งหมดจาก CSV เป็นแถวที่พร้อมคำนวณ และตัดทิ้งแถวที่ไม่มี customer_id
 * (เหมือน normalizeRows ใน metrics.js — กันปัญหา BOM/ชื่อคอลัมน์ไม่ตรงแบบเดียวกัน)
 */
export function normalizeCustomerRows(rawRows) {
  return rawRows.map(parseCustomerRow).filter((row) => Boolean(row.customerId))
}

/**
 * กรองแถวสมาชิกตามสาขา (home branch) — ใช้ตัวกรองสาขาตัวเดียวกับฝั่งยอดขาย (FilterBar)
 * เพื่อให้ทั้งสองส่วนของแดชบอร์ดควบคุมด้วยตัวกรองเดียวกัน
 */
export function filterCustomerRows(rows, { branch } = {}) {
  if (!branch || branch === 'all') return rows
  return rows.filter((row) => row.homeBranchName === branch)
}

/**
 * จำนวนสมาชิกแยกตามเพศ เรียงลำดับคงที่ตาม GENDER_ORDER (ไม่เรียงตามจำนวน)
 * คืนค่า [{ label, count }]
 */
export function getGenderBreakdown(rows) {
  const counts = new Map()
  for (const row of rows) {
    counts.set(row.gender, (counts.get(row.gender) ?? 0) + 1)
  }

  const knownFirst = GENDER_ORDER.filter((g) => counts.has(g))
  const unknownRest = Array.from(counts.keys()).filter((g) => !GENDER_ORDER.includes(g))
  return [...knownFirst, ...unknownRest].map((label) => ({ label, count: counts.get(label) }))
}

/**
 * จำนวนสมาชิกแยกตามช่วงอายุ เรียงจากอายุน้อย -> มาก ตาม AGE_GROUP_ORDER
 * คืนค่า [{ label, count }]
 */
export function getAgeGroupBreakdown(rows) {
  const counts = new Map()
  for (const row of rows) {
    if (!row.ageGroup) continue
    counts.set(row.ageGroup, (counts.get(row.ageGroup) ?? 0) + 1)
  }

  return AGE_GROUP_ORDER.filter((g) => counts.has(g)).map((label) => ({
    label,
    count: counts.get(label),
  }))
}

/**
 * จำนวนสมาชิกแยกตามสาขาบ้าน (home branch) เรียงจากมาก -> น้อย
 * เหมือนกราฟยอดขายแยกสาขา (getSalesByBranch ใน metrics.js) เพื่อความสอดคล้องกันทั้งแดชบอร์ด
 */
export function getHomeBranchBreakdown(rows) {
  const counts = new Map()
  for (const row of rows) {
    counts.set(row.homeBranchName, (counts.get(row.homeBranchName) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
}

/**
 * จำนวนสมาชิกใหม่ต่อเดือน เรียงจากเดือนเก่าสุด -> ใหม่สุด
 * รวมเป็นรายเดือน (ไม่ใช่รายวัน) เพราะข้อมูลสมัครสมาชิกกระจายอยู่ ๆ ราว 18 เดือน
 * ถ้ารวมรายวันกราฟจะแบนราบเกินไป มองไม่เห็นแนวโน้ม
 */
export function getSignupsByMonth(rows) {
  const counts = new Map()
  for (const row of rows) {
    if (!row.joinMonthKey) continue
    counts.set(row.joinMonthKey, (counts.get(row.joinMonthKey) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([month, count]) => ({ month, count }))
    .sort((a, b) => (a.month < b.month ? -1 : a.month > b.month ? 1 : 0))
}

/**
 * จำนวนบัญชีที่ระบุว่าใช้เบอร์โทรร่วมกับคนอื่น (is_shared_phone = true ใน CSV)
 * เก็บไว้เป็นสถิติเตือน/ข้อสังเกตให้ผู้ดูแลระบบ ไม่ได้ใช้กรองอะไรต่อ
 */
export function getSharedPhoneCount(rows) {
  return rows.filter((row) => row.isSharedPhone).length
}

/**
 * อัตราสมาชิกที่เคยซื้อจริงอย่างน้อย 1 ครั้ง (%) = จำนวนสมาชิกที่เคยซื้อ / จำนวนสมาชิกทั้งหมด
 * กันหารด้วยศูนย์กรณีไม่มีสมาชิกเลย
 */
export function getActiveMemberRate(totalMembers, activeMemberCount) {
  return totalMembers === 0 ? 0 : (activeMemberCount / totalMembers) * 100
}

/**
 * ฟังก์ชันหลัก: รับแถวสมาชิกที่ normalize (และอาจกรองสาขาแล้ว) มา แล้วคำนวณทุกอย่างที่
 * ส่วน "ข้อมูลสมาชิก" ของแดชบอร์ดต้องใช้
 *
 * activeCustomerIds: Set ของ customer_id ที่เคยซื้อจริงอย่างน้อย 1 ครั้ง มาจาก
 * getActiveCustomerIds() ใน metrics.js (คำนวณจาก sales.csv ทั้งชุด ไม่ผูกกับตัวกรอง
 * ช่วงวันที่ฝั่งยอดขาย เพราะสถานะ "เคยซื้อหรือไม่" ควรนับตลอดอายุสมาชิก ไม่ใช่แค่ช่วงที่กำลังดู)
 */
export function computeCustomerMetrics(rows, activeCustomerIds) {
  const totalMembers = rows.length
  const activeMemberCount = rows.filter((row) => activeCustomerIds.has(row.customerId)).length

  return {
    totalMembers,
    activeMemberCount,
    activeMemberRate: getActiveMemberRate(totalMembers, activeMemberCount),
    sharedPhoneCount: getSharedPhoneCount(rows),
    genderBreakdown: getGenderBreakdown(rows),
    ageGroupBreakdown: getAgeGroupBreakdown(rows),
    homeBranchBreakdown: getHomeBranchBreakdown(rows),
    signupsByMonth: getSignupsByMonth(rows),
  }
}
