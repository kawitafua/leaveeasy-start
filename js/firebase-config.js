// ─────────────────────────────────────────────────────────────
// js/firebase-config.js — ตั้งค่า Firebase (สัปดาห์ที่ 6)
// ใช้ Firebase SDK แบบ compat (CDN) ให้เข้ากับสไตล์ <script> ธรรมดาของโปรเจกต์นี้
// ต้องโหลดไฟล์นี้หลัง firebase-app-compat.js และ firebase-firestore-compat.js เสมอ
// ─────────────────────────────────────────────────────────────

var firebaseConfig = {
  apiKey: "AIzaSyBTC5ykjjNmmPfzNrA9Wm474BDA_kOeohM",
  authDomain: "leaveeasy-kawitafua.firebaseapp.com",
  projectId: "leaveeasy-kawitafua",
  storageBucket: "leaveeasy-kawitafua.firebasestorage.app",
  messagingSenderId: "858609736129",
  appId: "1:858609736129:web:dc2c0a45848cd0c3833740"
};

firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
