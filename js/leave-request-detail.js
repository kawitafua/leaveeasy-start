// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลา + ความเห็น จาก Firestore จริง
// ปุ่มอนุมัติ/ไม่อนุมัติ แก้ฟิลด์ status ลง Firestore · ส่งความเห็นเขียนลงโฟลเดอร์ย่อย approvals จริง
// ─────────────────────────────────────────────────────────────

(function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var ใบ = null;
  var ความเห็น = [];

  db.collection("leaveRequests").doc(รหัสใบลา).get().then(function (เอกสาร) {
    if (!เอกสาร.exists) {
      กล่องใบลา.innerHTML = "<p>ไม่พบใบขอลาที่ต้องการ — อาจถูกลบไปแล้ว หรือลิงก์ไม่ถูกต้อง</p>";
      return;
    }
    ใบ = เอกสาร.data();
    ใบ.id = เอกสาร.id;

    return db.collection("leaveRequests").doc(รหัสใบลา).collection("approvals").get().then(function (snapshot) {
      ความเห็น = snapshot.docs.map(function (เอกสารความเห็น) {
        var c = เอกสารความเห็น.data();
        c.id = เอกสารความเห็น.id;
        return c;
      });

      วาดใบลา();
      วาดความเห็น();
      กล่องความเห็น.classList.remove("hidden");

      document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
    });
  }).catch(function (err) {
    กล่องใบลา.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)],
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    ];

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ / ไม่อนุมัติ / ลบ ขึ้นเฉพาะใบที่ยังรอพิจารณา
    if (ใบ.status === "รอพิจารณา") {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>" +
        '<div class="btn-row">' +
        '<button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลานี้</button>' +
        "</div>";
    } else {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (ใบ.status === "รอพิจารณา") {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มลบ").addEventListener("click", ลบใบลา);
    }
  }

  // ── เปลี่ยนสถานะ — เขียนกลับ Firestore จริง แก้เฉพาะฟิลด์ status ──
  function เปลี่ยนสถานะ(สถานะใหม่) {
    // กฎ: จะไม่อนุมัติได้ ต้องมีความเห็นอย่างน้อย 1 รายการก่อน
    if (สถานะใหม่ === "ไม่อนุมัติ" && ความเห็น.length === 0) {
      alert("ต้องเขียนความเห็นอย่างน้อย 1 รายการก่อน จึงจะกดไม่อนุมัติได้");
      return;
    }

    var ปุ่มอนุมัติ = document.getElementById("ปุ่มอนุมัติ");
    var ปุ่มไม่อนุมัติ = document.getElementById("ปุ่มไม่อนุมัติ");
    ปุ่มอนุมัติ.disabled = true;
    ปุ่มไม่อนุมัติ.disabled = true;

    // .update() แก้เฉพาะฟิลด์ที่ระบุ ฟิลด์อื่นในเอกสารเดิมไม่ถูกแตะ
    db.collection("leaveRequests").doc(รหัสใบลา).update({ status: สถานะใหม่ }).then(function () {
      ใบ.status = สถานะใหม่;
      วาดใบลา();
    }).catch(function (err) {
      ปุ่มอนุมัติ.disabled = false;
      ปุ่มไม่อนุมัติ.disabled = false;
      alert("บันทึกสถานะไม่สำเร็จ: " + err.message);
    });
  }

  // ── ลบใบลานี้ — ถามยืนยันก่อนเสมอ แล้วลบ approvals ก่อนลบเอกสารหลัก ──
  function ลบใบลา() {
    if (!confirm('ยืนยันการลบใบลา "' + ใบ.title + '" หรือไม่ — ลบแล้วกู้คืนไม่ได้')) return;

    var ปุ่มลบ = document.getElementById("ปุ่มลบ");
    ปุ่มลบ.disabled = true;

    db.collection("leaveRequests").doc(รหัสใบลา).collection("approvals").get().then(function (snapshot) {
      var ลบทั้งหมด = snapshot.docs.map(function (d) { return d.ref.delete(); });
      return Promise.all(ลบทั้งหมด);
    }).then(function () {
      return db.collection("leaveRequests").doc(รหัสใบลา).delete();
    }).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่มลบ.disabled = false;
      alert("ลบไม่สำเร็จ: " + err.message);
    });
  }

  // ── รายการความเห็น เรียงจากเก่าไปใหม่ ──
  function วาดความเห็น() {
    var ที่วาง = document.getElementById("รายการความเห็น");
    if (ความเห็น.length === 0) {
      ที่วาง.innerHTML = "<p>ยังไม่มีความเห็นในใบนี้</p>";
      return;
    }
    ที่วาง.innerHTML = ความเห็น
      .slice()
      .sort(function (a, b) { return a.createdAt < b.createdAt ? -1 : 1; })
      .map(function (c) {
        return '<div class="comment"><div class="meta">' + esc(c.authorName) + " · " + esc(c.createdAt) +
               "</div><div>" + esc(c.message) + "</div></div>";
      }).join("");
  }

  // ── ส่งความเห็นใหม่ — เขียนลงโฟลเดอร์ย่อย approvals ของใบนี้จริง ──
  function ส่งความเห็น() {
    var ช่อง = document.getElementById("ข้อความความเห็น");
    var เตือน = document.getElementById("เตือนความเห็น");
    var ข้อความ = ช่อง.value.trim();

    if (!ข้อความ) {
      เตือน.textContent = "⚠️ พิมพ์ข้อความก่อน จึงจะส่งความเห็นได้";
      เตือน.classList.remove("hidden");
      return;
    }
    เตือน.classList.add("hidden");

    var ปุ่มส่ง = document.getElementById("ปุ่มส่งความเห็น");
    ปุ่มส่ง.disabled = true;

    // สัปดาห์ที่ 6 ยังไม่มีล็อกอิน จึงสมมติว่าผู้เขียนคือ สมหญิง รักงาน
    var ความเห็นใหม่ = {
      authorId: "u002", authorName: "สมหญิง รักงาน",
      message: ข้อความ,
      createdAt: เวลาตอนนี้()
    };

    db.collection("leaveRequests").doc(รหัสใบลา).collection("approvals").add(ความเห็นใหม่).then(function (เอกสารใหม่) {
      ความเห็นใหม่.id = เอกสารใหม่.id;
      ความเห็น.push(ความเห็นใหม่);
      ช่อง.value = "";
      วาดความเห็น();
      ปุ่มส่ง.disabled = false;
    }).catch(function (err) {
      ปุ่มส่ง.disabled = false;
      เตือน.textContent = "⚠️ ส่งความเห็นไม่สำเร็จ: " + err.message;
      เตือน.classList.remove("hidden");
    });
  }
})();
