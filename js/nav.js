// ─────────────────────────────────────────────────────────────
// js/nav.js — แถบเมนูด้านบนที่ใช้ร่วมกันทุกหน้า
// แก้เมนูที่ไฟล์นี้ที่เดียว ทุกหน้าเปลี่ยนตามพร้อมกัน
//
// วิธีใช้: ทุกหน้ามี <div id="nav"></div> ไว้บนสุดของ body
// ─────────────────────────────────────────────────────────────

(function () {
  var เมนู = [
    { href: "index.html",             ชื่อ: "หน้าแรก" },
    { href: "leave-requests.html",    ชื่อ: "รายการใบลา" },
    { href: "new-leave-request.html", ชื่อ: "ยื่นใบลาใหม่" },
    { href: "leave-types.html",       ชื่อ: "ประเภทการลา" }
  ];

  // ชื่อไฟล์ของหน้าที่กำลังเปิดอยู่ เอาไว้ขีดเส้นใต้เมนูที่ตรงกัน
  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";

  var html = '<div class="navbar"><span class="brand">🔧 LeaveEasy</span>';
  เมนู.forEach(function (m) {
    var active = m.href === หน้าปัจจุบัน ? ' class="active"' : "";
    html += '<a href="' + m.href + '"' + active + ">" + m.ชื่อ + "</a>";
  });
  html += '<span class="nav-user" id="navUser"></span></div>';

  var ที่วาง = document.getElementById("nav");
  if (ที่วาง) ที่วาง.innerHTML = html;
})();

// ─────────────────────────────────────────────────────────────
// สัปดาห์ที่ 7: ยามเฝ้าล็อกอิน — หน้าไหนที่ไม่ใช่ login/signup
// ต้องล็อกอินก่อนถึงจะอยู่ต่อได้ ไม่งั้นเด้งไปหน้าเข้าสู่ระบบ
//
// เพิ่มเติม: หลังล็อกอินแล้วไปอ่าน role จริงจาก users/{uid} เก็บไว้ที่
// window.ผู้ใช้ปัจจุบัน = {uid, name, role} ให้หน้าอื่นเอาไปซ่อน/โชว์ปุ่มตาม ACL.md
// (ดูฟังก์ชัน รอผู้ใช้พร้อม ด้านล่าง — ใช้รอค่านี้เพราะการอ่าน role เป็น async)
// ─────────────────────────────────────────────────────────────
(function () {
  var หน้าที่ไม่ต้องล็อกอิน = ["login.html", "signup.html"];
  var หน้าปัจจุบัน = location.pathname.split("/").pop() || "index.html";
  var หน้านี้ต้องล็อกอิน = หน้าที่ไม่ต้องล็อกอิน.indexOf(หน้าปัจจุบัน) === -1;

  if (typeof auth === "undefined") return; // หน้านี้ยังไม่ได้โหลด Firebase Auth SDK

  auth.onAuthStateChanged(function (ผู้ใช้) {
    if (!ผู้ใช้ && หน้านี้ต้องล็อกอิน) {
      location.href = "login.html";
      return;
    }
    if (ผู้ใช้ && หน้านี้ต้องล็อกอิน) {
      db.collection("users").doc(ผู้ใช้.uid).get().then(function (เอกสาร) {
        window.ผู้ใช้ปัจจุบัน = {
          uid: ผู้ใช้.uid,
          name: ผู้ใช้.displayName || ผู้ใช้.email,
          role: เอกสาร.exists ? เอกสาร.data().role : "employee"
        };
        แสดงผู้ใช้ที่ล็อกอินอยู่(window.ผู้ใช้ปัจจุบัน);
        จำกัดเมนูตามบทบาท(window.ผู้ใช้ปัจจุบัน.role);
        document.dispatchEvent(new CustomEvent("ผู้ใช้พร้อมแล้ว", { detail: window.ผู้ใช้ปัจจุบัน }));
      });
    }
  });
})();

function แสดงผู้ใช้ที่ล็อกอินอยู่(ผู้ใช้) {
  var กล่อง = document.getElementById("navUser");
  if (!กล่อง) return;
  กล่อง.innerHTML = "";

  var ชื่อ = document.createElement("span");
  ชื่อ.textContent = "👤 " + ผู้ใช้.name;
  กล่อง.appendChild(ชื่อ);

  var ปุ่มออกจากระบบ = document.createElement("button");
  ปุ่มออกจากระบบ.type = "button";
  ปุ่มออกจากระบบ.className = "btn-ghost";
  ปุ่มออกจากระบบ.textContent = "ออกจากระบบ";
  ปุ่มออกจากระบบ.addEventListener("click", function () {
    auth.signOut().then(function () { location.href = "login.html"; });
  });
  กล่อง.appendChild(ปุ่มออกจากระบบ);
}

// เมนู "ประเภทการลา" มีไว้ให้ฝ่ายบุคคล (hr) เท่านั้น ตาม ACL.md
function จำกัดเมนูตามบทบาท(role) {
  if (role === "hr") return;
  var ลิงก์ประเภทการลา = document.querySelector('.navbar a[href="leave-types.html"]');
  if (ลิงก์ประเภทการลา) ลิงก์ประเภทการลา.remove();
}

// หน้าอื่นที่ต้องรู้ role ก่อนวาดปุ่ม เรียกใช้ตัวนี้แทนการเดา timing เอง
// ถ้า window.ผู้ใช้ปัจจุบัน มีค่าแล้วเรียก callback ทันที ไม่งั้นรอ event แล้วค่อยเรียก
function รอผู้ใช้พร้อม(callback) {
  if (window.ผู้ใช้ปัจจุบัน) {
    callback(window.ผู้ใช้ปัจจุบัน);
    return;
  }
  document.addEventListener("ผู้ใช้พร้อมแล้ว", function ฟัง(e) {
    document.removeEventListener("ผู้ใช้พร้อมแล้ว", ฟัง);
    callback(e.detail);
  });
}

// แถบเตือนสีเหลือง ใช้ตอนที่ยังไม่ได้ตั้งค่า Firebase
function showConfigWarning(ข้อความ) {
  var กล่อง = document.createElement("div");
  กล่อง.className = "alert alert-warn";
  กล่อง.innerHTML =
    "⚠️ <strong>ยังไม่ได้ตั้งค่า Firebase</strong> — " +
    (ข้อความ || "หน้านี้จึงยังไม่ได้อ่านข้อมูลจากฐานข้อมูลจริง") +
    "<br>วิธีตั้งค่าอยู่ในไฟล์ SETUP.md ขั้นที่ 4";
  var ที่วาง = document.querySelector(".container") || document.body;
  ที่วาง.insertBefore(กล่อง, ที่วาง.firstChild);
}
