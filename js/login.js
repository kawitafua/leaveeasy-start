// ─────────────────────────────────────────────────────────────
// js/login.js — หน้าเข้าสู่ระบบ
// สัปดาห์ที่ 7: เข้าสู่ระบบด้วย Firebase Authentication (อีเมล + รหัสผ่าน)
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มเข้าสู่ระบบ");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");

  // ล็อกอินอยู่แล้ว ไม่ต้องเห็นหน้านี้อีก พาไปหน้ารายการเลย
  auth.onAuthStateChanged(function (ผู้ใช้) {
    if (ผู้ใช้) location.href = "leave-requests.html";
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (!email || !password) {
      เตือน("กรอกไม่ครบ — ต้องกรอกอีเมลและรหัสผ่านก่อนกดเข้าสู่ระบบ");
      return;
    }

    var ปุ่ม = document.getElementById("ปุ่มเข้าสู่ระบบ");
    ปุ่ม.disabled = true;

    auth.signInWithEmailAndPassword(email, password).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่ม.disabled = false;
      เตือน("เข้าสู่ระบบไม่สำเร็จ: " + esc(err.message));
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
