Simple Task Breaker (AI Task Architect)
Project Status: Full-Stack MVP for VibeCode Final Project

🚀 Overview
แอปพลิเคชันช่วยย่อยงานใหญ่ให้กลายเป็นขั้นตอนย่อยที่ทำได้จริงใน 2 ชั่วโมง เพื่อแก้ปัญหา Task Paralysis และช่วยให้ผู้ใช้งานเริ่มต้นงานแรกได้ง่ายขึ้น โดยใช้พลังของ AI (Gemini) และระบบบันทึกข้อมูลบน Cloud (Supabase)

📋 Prerequisites (สิ่งที่ต้องมีในเครื่อง)
ก่อนเริ่มใช้งาน กรุณาตรวจสอบว่าเครื่องของคุณมีการติดตั้งซอฟต์แวร์ดังต่อไปนี้:
Node.js: แนะนำเวอร์ชัน 18.x หรือสูงกว่า (LTS) ดาวน์โหลดที่นี่
npm: (มักติดตั้งมาพร้อมกับ Node.js)
Web Browser: แนะนำ Google Chrome หรือ Microsoft Edge เวอร์ชันล่าสุด
Supabase Account: สำหรับการสร้าง Database
Google AI Studio Key: สำหรับการใช้งาน Gemini API

🛠️ Tech Stack
Frontend: React 18 + Tailwind CSS (Vite)
Icons: Lucide-react
Database: Supabase (PostgreSQL)
AI Brain: Google Gemini 2.5 Flash

📦 Installation & Setup
Clone & Install:
npm install


Setup Environment Variables:
สร้างไฟล์ชื่อ .env ไว้ที่ Root Directory ของโปรเจกต์ และใส่ข้อมูลตามรูปแบบด้านล่างนี้ (ห้ามเว้นวรรคหลังเครื่องหมาย =):
VITE_SUPABASE_URL=[https://your-project-id.supabase.co](https://your-project-id.supabase.co)
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_GEMINI_API_KEY=your-gemini-api-key-here


Run Application:
npm run dev

จากนั้นเข้าใช้งานผ่านลิงก์ที่ปรากฏ (เช่น http://localhost:5173)
🛡️ Key Features
AI Decomposition: ย่อยงานใหญ่อัตโนมัติใน 30 วินาที
Editable Tasks: ปรับแต่งขั้นตอนได้ตามความต้องการ (Human-in-the-loop)
Cloud Saving: บันทึกแผนงานลงฐานข้อมูล Supabase ทันที
Developed by: Boom 

