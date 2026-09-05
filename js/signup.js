// ─────────────────────────────────────────────────────────────
// js/signup.js — หน้าสมัครสมาชิก
// สัปดาห์ที่ 7: สมัครด้วย Firebase Authentication + สร้างไฟล์ผู้ใช้ในโฟลเดอร์ users
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มสมัครสมาชิก");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var name = document.getElementById("name").value.trim();
    var email = document.getElementById("email").value.trim();
    var password = document.getElementById("password").value;

    if (!name || !email || !password) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดสมัครสมาชิก");
      return;
    }
    if (password.length < 6) {
      เตือน("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    var ปุ่ม = document.getElementById("ปุ่มสมัคร");
    ปุ่ม.disabled = true;

    auth.createUserWithEmailAndPassword(email, password).then(function (ผลลัพธ์) {
      var ผู้ใช้ = ผลลัพธ์.user;
      // ตั้งชื่อที่แสดงไว้ในบัญชี Auth เอง จะได้เอามาโชว์บนแถบเมนูได้ทันทีโดยไม่ต้องไปอ่าน Firestore ซ้ำ
      return ผู้ใช้.updateProfile({ displayName: name }).then(function () {
        // สมัครสำเร็จแล้วต้องมีไฟล์ใหม่ในโฟลเดอร์ users เสมอ role เริ่มต้นเป็น employee
        return db.collection("users").doc(ผู้ใช้.uid).set({
          name: name,
          email: email,
          role: "employee"
        });
      });
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่ม.disabled = false;
      เตือน("สมัครสมาชิกไม่สำเร็จ: " + esc(err.message));
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
