// ─────────────────────────────────────────────────────────────
// js/leave-request-detail.js — หน้าที่ 3 รายละเอียดใบลา
// สัปดาห์ที่ 7: อ่านใบลา + ความเห็น จาก Firestore จริง
// ปุ่มอนุมัติ/ไม่อนุมัติ แก้ฟิลด์ status ลง Firestore · ส่งความเห็นเขียนลงโฟลเดอร์ย่อย approvals จริง
// ─────────────────────────────────────────────────────────────

(function () {
  var รหัสใบลา = ค่าจากURL("id");
  var กล่องใบลา = document.getElementById("กล่องใบลา");
  var กล่องความเห็น = document.getElementById("กล่องความเห็น");
  var กล่องเขียนความเห็น = document.getElementById("กล่องเขียนความเห็น");
  var ใบ = null;
  var ความเห็น = [];
  var ผู้ใช้ปัจจุบัน = null;

  // ต้องรอทั้งข้อมูลใบลาและ role ของคนที่ล็อกอินอยู่ก่อน ถึงจะรู้ว่าจะโชว์ปุ่มไหนบ้าง
  var ข้อมูลใบลาพร้อมแล้ว = false;
  function ลองวาดถ้าพร้อม() {
    if (!ข้อมูลใบลาพร้อมแล้ว || !ผู้ใช้ปัจจุบัน) return;
    วาดใบลา();
    วาดความเห็น();

    // เขียนความเห็นได้ก็ต่อเมื่อพิจารณาใบลาได้ (manager/hr) หรือเป็นเจ้าของใบลานั้นเอง
    var เขียนความเห็นได้ = พิจารณาได้() || เป็นเจ้าของใบ();
    กล่องความเห็น.classList.remove("hidden");
    กล่องเขียนความเห็น.classList.toggle("hidden", !เขียนความเห็นได้);
    if (เขียนความเห็นได้) {
      document.getElementById("ปุ่มส่งความเห็น").addEventListener("click", ส่งความเห็น);
    }
  }

  รอผู้ใช้พร้อม(function (ค่า) {
    ผู้ใช้ปัจจุบัน = ค่า;
    ลองวาดถ้าพร้อม();
  });

  function พิจารณาได้() {
    return ผู้ใช้ปัจจุบัน.role === "manager" || ผู้ใช้ปัจจุบัน.role === "hr";
  }
  function เป็นเจ้าของใบ() {
    return ใบ.requesterId === ผู้ใช้ปัจจุบัน.uid;
  }

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

      ข้อมูลใบลาพร้อมแล้ว = true;
      ลองวาดถ้าพร้อม();
    });
  }).catch(function (err) {
    กล่องใบลา.innerHTML = "<p>โหลดข้อมูลไม่สำเร็จ: " + esc(err.message) + "</p>";
  });

  // ── วาดข้อมูลใบลาลงหน้าจอ ──
  function วาดใบลา() {
    var แถว = [
      ["หัวข้อ", esc(ใบ.title)],
      ["เหตุผลการลา", esc(ใบ.reason)]
    ];
    if (ใบ.aiSuggestion) {
      แถว.push(["🤖 สรุปโดย AI", esc(ใบ.aiSuggestion)]);
    }
    แถว.push(
      ["ประเภทการลา", esc(ใบ.leaveTypeName)],
      ["วันที่ลา", esc(ใบ.startDate) + " ถึง " + esc(ใบ.endDate)],
      ["ผู้ขอลา", esc(ใบ.requesterName)],
      ["ผู้อนุมัติ", ใบ.approverName ? esc(ใบ.approverName) : "ยังไม่ได้กำหนดผู้อนุมัติ"],
      ["สถานะ", ป้ายสถานะ(ใบ.status)],
      ["วันที่ยื่น", esc(ใบ.createdAt)]
    );

    var html = แถว.map(function (r) {
      return '<div class="field-row"><span class="k">' + r[0] + "</span><span>" + r[1] + "</span></div>";
    }).join("");

    // ปุ่มอนุมัติ/ไม่อนุมัติ ขึ้นเฉพาะ manager/hr · ปุ่มลบ ขึ้นเฉพาะเจ้าของใบเอง · ทั้งคู่ต้องเป็นใบที่ยังรอพิจารณา
    var แสดงปุ่มพิจารณา = ใบ.status === "รอพิจารณา" && พิจารณาได้();
    var แสดงปุ่มลบ = ใบ.status === "รอพิจารณา" && เป็นเจ้าของใบ();

    if (แสดงปุ่มพิจารณา) {
      html +=
        '<div class="btn-row">' +
        '<button type="button" class="btn-ghost" id="ปุ่มสรุปAI">ให้ AI ช่วยสรุปใบลา</button>' +
        "</div>" +
        '<div id="เตือนสรุปAI" class="alert alert-error hidden"></div>' +
        '<div class="btn-row">' +
        '<button type="button" class="btn-ok" id="ปุ่มอนุมัติ">อนุมัติ</button>' +
        '<button type="button" class="btn-danger" id="ปุ่มไม่อนุมัติ">ไม่อนุมัติ</button>' +
        "</div>";
    }
    if (แสดงปุ่มลบ) {
      html += '<div class="btn-row"><button type="button" class="btn-danger" id="ปุ่มลบ">ลบใบลานี้</button></div>';
    }
    if (ใบ.status !== "รอพิจารณา") {
      html += '<p class="hint">ใบนี้พิจารณาแล้ว จึงเปลี่ยนสถานะต่อไม่ได้</p>';
    }

    กล่องใบลา.innerHTML = html;

    if (แสดงปุ่มพิจารณา) {
      document.getElementById("ปุ่มอนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("อนุมัติ"); });
      document.getElementById("ปุ่มไม่อนุมัติ").addEventListener("click", function () { เปลี่ยนสถานะ("ไม่อนุมัติ"); });
      document.getElementById("ปุ่มสรุปAI").addEventListener("click", สรุปด้วยAI);
    }
    if (แสดงปุ่มลบ) {
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

  // ── ให้ AI ช่วยสรุปใบลา — อ่านใบลานี้ (ขั้น 1) → ให้ AI เขียนสรุปสั้น ๆ (ขั้น 2) → เขียนสรุปกลับ Firestore (ขั้น 3) ──
  function สรุปด้วยAI() {
    var ปุ่ม = document.getElementById("ปุ่มสรุปAI");
    var กล่องเตือน = document.getElementById("เตือนสรุปAI");
    var ข้อความปุ่มปกติ = ปุ่ม.textContent;

    กล่องเตือน.classList.add("hidden");

    if (!window.AI_CONFIG || !window.AI_CONFIG.openRouterApiKey) {
      กล่องเตือน.textContent = "⚠️ ยังไม่ได้ตั้งค่า AI (ไม่มีคีย์ API)";
      กล่องเตือน.classList.remove("hidden");
      return;
    }

    var ตัวควบคุมยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

    ปุ่ม.disabled = true;
    ปุ่ม.textContent = "AI กำลังอ่านและสรุปใบลา…";

    var ข้อมูลนำเข้า = "หัวข้อ: " + ใบ.title +
      "\nประเภทการลา: " + ใบ.leaveTypeName +
      "\nวันที่ลา: " + ใบ.startDate + " ถึง " + ใบ.endDate +
      "\nผู้ขอลา: " + ใบ.requesterName +
      "\nเหตุผลการลา: " + ใบ.reason;

    // บันทึกทุกครั้งที่เรียก AI ไว้ในโฟลเดอร์ย่อย aiLog — ไม่ว่าจะสำเร็จหรือพัง เพื่อตรวจสอบย้อนหลังได้
    function บันทึกลอก(ผลลัพธ์) {
      return db.collection("leaveRequests").doc(รหัสใบลา).collection("aiLog").add({
        input: ข้อมูลนำเข้า,
        output: ผลลัพธ์,
        createdAt: เวลาตอนนี้()
      });
    }

    fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: ตัวควบคุมยกเลิก.signal,
      headers: {
        "Authorization": "Bearer " + window.AI_CONFIG.openRouterApiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: window.AI_CONFIG.model,
        messages: [
          {
            role: "system",
            content: "คุณคือผู้ช่วยสรุปใบลาให้หัวหน้าอ่านก่อนตัดสินใจอนุมัติ ตอบเป็นข้อความสรุปข้อเท็จจริงสั้น ๆ " +
              "ไม่เกิน 2 ประโยคภาษาไทย ห้ามแนะนำหรือชี้นำว่าควรอนุมัติหรือไม่ ห้ามมีข้อความอื่นนอกจากสรุป"
          },
          { role: "user", content: ข้อมูลนำเข้า }
        ]
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.error && data.error.message) || ("HTTP " + res.status));
        return data;
      });
    }).then(function (data) {
      var สรุป = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      สรุป = สรุป && สรุป.trim();
      if (!สรุป) throw new Error("AI ไม่ได้ตอบข้อความสรุปกลับมา");

      return บันทึกลอก(สรุป).then(function () {
        // สถานะจริงของใบลาไม่ถูกแตะตรงนี้เลย — เปลี่ยนได้ก็ต่อเมื่อคนกดปุ่มอนุมัติ/ไม่อนุมัติเอง (ดู เปลี่ยนสถานะ())
        return db.collection("leaveRequests").doc(รหัสใบลา).update({ aiSuggestion: สรุป });
      }).then(function () {
        ใบ.aiSuggestion = สรุป;
        วาดใบลา();
      });
    }).catch(function (err) {
      บันทึกลอก("(เรียกไม่สำเร็จ: " + (err && err.message ? err.message : "ไม่ทราบสาเหตุ") + ")");
      กล่องเตือน.textContent = "⚠️ สรุปให้ไม่ได้ ลองใหม่อีกครั้ง";
      กล่องเตือน.classList.remove("hidden");
    }).finally(function () {
      clearTimeout(หมดเวลา);
      ปุ่ม.disabled = false;
      ปุ่ม.textContent = ข้อความปุ่มปกติ;
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

    // สัปดาห์ที่ 7: authorId ต้องเป็น uid ของคนที่ล็อกอินอยู่จริง
    var ผู้ใช้ = auth.currentUser;
    var ความเห็นใหม่ = {
      authorId: ผู้ใช้.uid, authorName: ผู้ใช้.displayName || ผู้ใช้.email,
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
