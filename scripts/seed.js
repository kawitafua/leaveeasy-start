// ─────────────────────────────────────────────────────────────
// scripts/seed.js — ใส่ข้อมูลตัวอย่างลง Firestore ครั้งเดียว (สัปดาห์ที่ 6)
// ข้อมูลชุดนี้ตรงกับ js/data.js และหัวข้อ 7 ของ leaveeasy-spec.md ทุกช่อง
// รันด้วยคำสั่ง: npm run seed
// ─────────────────────────────────────────────────────────────

const { initializeApp } = require("firebase/app");
const { getFirestore, doc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBTC5ykjjNmmPfzNrA9Wm474BDA_kOeohM",
  authDomain: "leaveeasy-kawitafua.firebaseapp.com",
  projectId: "leaveeasy-kawitafua",
  storageBucket: "leaveeasy-kawitafua.firebasestorage.app",
  messagingSenderId: "858609736129",
  appId: "1:858609736129:web:dc2c0a45848cd0c3833740"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const users = [
  { id: "u001", name: "สมชาย ใจดี",   email: "somchai@example.com", role: "employee" },
  { id: "u002", name: "สมหญิง รักงาน", email: "somying@example.com", role: "manager" },
  { id: "u003", name: "สมศรี ตั้งใจ",  email: "somsri@example.com",  role: "hr" }
];

const leaveTypes = [
  { id: "lt001", name: "ลาพักร้อน" },
  { id: "lt002", name: "ลาป่วย" },
  { id: "lt003", name: "ลากิจ" }
];

const leaveRequests = [
  {
    id: "lr001",
    title: "ลาพักร้อนไปเที่ยวกับครอบครัว",
    reason: "วางแผนเดินทางไปต่างจังหวัดกับครอบครัว จองที่พักไว้ล่วงหน้าแล้ว",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-09-07", endDate: "2026-09-09",
    createdAt: "2026-09-01 09:15"
  },
  {
    id: "lr002",
    title: "ลาป่วยไข้หวัดใหญ่",
    reason: "มีไข้สูงและไอมาก แพทย์แนะนำให้พักอยู่บ้าน 2 วัน",
    status: "อนุมัติ",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-08-24", endDate: "2026-08-25",
    createdAt: "2026-08-24 08:05"
  },
  {
    id: "lr003",
    title: "ลากิจไปทำบัตรประชาชน",
    reason: "บัตรประชาชนหมดอายุ ต้องไปทำที่สำนักงานเขตในวันทำการ",
    status: "รอพิจารณา",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "",      approverName: "",
    leaveTypeId: "lt003", leaveTypeName: "ลากิจ",
    startDate: "2026-09-15", endDate: "2026-09-15",
    createdAt: "2026-09-10 16:30"
  },
  {
    id: "lr004",
    title: "ลาพักร้อนช่วงวันหยุดยาว",
    reason: "อยากต่อวันหยุดยาวไปพักผ่อนกับครอบครัวอีก 3 วัน",
    status: "ไม่อนุมัติ",
    requesterId: "u003", requesterName: "สมศรี ตั้งใจ",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt001", leaveTypeName: "ลาพักร้อน",
    startDate: "2026-10-12", endDate: "2026-10-16",
    createdAt: "2026-09-20 11:00"
  },
  {
    id: "lr005",
    title: "ลาป่วยไปพบแพทย์ตามนัด",
    reason: "มีนัดตรวจติดตามอาการกับแพทย์ในช่วงเช้า",
    status: "รอพิจารณา",
    requesterId: "u001", requesterName: "สมชาย ใจดี",
    approverId: "u002",  approverName: "สมหญิง รักงาน",
    leaveTypeId: "lt002", leaveTypeName: "ลาป่วย",
    startDate: "2026-09-22", endDate: "2026-09-22",
    createdAt: "2026-09-18 14:45"
  }
];

const approvals = [
  { id: "ap001", requestId: "lr001", authorId: "u002", authorName: "สมหญิง รักงาน",
    message: "รับเรื่องแล้ว ขอดูตารางงานของทีมช่วงนั้นก่อนนะครับ", createdAt: "2026-09-01 13:40" },
  { id: "ap002", requestId: "lr001", authorId: "u003", authorName: "สมศรี ตั้งใจ",
    message: "ตรวจแล้ว วันลาพักร้อนคงเหลือครอบคลุมช่วงที่ขอ ไม่ติดขัดฝั่งฝ่ายบุคคล", createdAt: "2026-09-02 10:05" },
  { id: "ap003", requestId: "lr002", authorId: "u002", authorName: "สมหญิง รักงาน",
    message: "อนุมัติแล้ว พักผ่อนให้เต็มที่ งานที่ค้างไว้เดี๋ยวทีมช่วยดูให้", createdAt: "2026-08-24 09:20" },
  { id: "ap004", requestId: "lr004", authorId: "u002", authorName: "สมหญิง รักงาน",
    message: "ช่วงนั้นทีมมีงานส่งมอบพอดี ขอเลื่อนเป็นสัปดาห์ถัดไปได้ไหมครับ", createdAt: "2026-09-20 15:10" }
];

async function seed() {
  for (const { id, ...data } of users) {
    await setDoc(doc(db, "users", id), data);
    console.log("✅ users/" + id);
  }

  for (const { id, ...data } of leaveTypes) {
    await setDoc(doc(db, "leaveTypes", id), data);
    console.log("✅ leaveTypes/" + id);
  }

  for (const { id, ...data } of leaveRequests) {
    await setDoc(doc(db, "leaveRequests", id), data);
    console.log("✅ leaveRequests/" + id);
  }

  for (const { id, requestId, ...data } of approvals) {
    await setDoc(doc(db, "leaveRequests", requestId, "approvals", id), data);
    console.log("✅ leaveRequests/" + requestId + "/approvals/" + id);
  }

  console.log("\n🎉 ใส่ข้อมูลตัวอย่างครบแล้ว — เปิด Firebase Console เพื่อตรวจสอบ");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ ใส่ข้อมูลไม่สำเร็จ:", err.message);
  process.exit(1);
});
