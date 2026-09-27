import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// ฟอนต์ IBM Plex Sans Thai — เลือกเพราะออกแบบมาให้ตัวเลข/ตัวอักษรไทยอ่านง่ายและดูทันสมัย
// เหมาะกับแดชบอร์ดที่มีตัวเลขเยอะ (การ์ด KPI, แกนกราฟ) โหลดเฉพาะน้ำหนักที่ใช้จริงในหน้านี้
// (400 = ตัวอักษรทั่วไป, 500/600 = หัวข้อ/ตัวเลข KPI, 700 = ชื่อแดชบอร์ดด้านบนสุด)
import '@fontsource/ibm-plex-sans-thai/400.css'
import '@fontsource/ibm-plex-sans-thai/500.css'
import '@fontsource/ibm-plex-sans-thai/600.css'
import '@fontsource/ibm-plex-sans-thai/700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
