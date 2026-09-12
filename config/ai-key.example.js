// ─────────────────────────────────────────────────────────────
// config/ai-key.example.js — เทมเพลตสำหรับตั้งค่าคีย์ AI ของเครื่องตัวเอง
//
// วิธีใช้:
//   1. คัดลอกไฟล์นี้เป็น config/local-ai-key.js (ชื่อนี้เข้าเงื่อนไข .gitignore ไว้แล้ว)
//   2. ใส่คีย์ OpenRouter จริงของตัวเองแทนค่า placeholder ด้านล่าง
//   3. ห้าม commit ไฟล์ config/local-ai-key.js ขึ้น GitHub เด็ดขาด
// ─────────────────────────────────────────────────────────────

window.AI_CONFIG = {
  openRouterApiKey: "ใส่คีย์ OpenRouter ของคุณตรงนี้",
  model: "google/gemini-2.5-flash-lite"
};
