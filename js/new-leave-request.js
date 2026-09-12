// ─────────────────────────────────────────────────────────────
// js/new-leave-request.js — หน้าที่ 2 ยื่นใบลาใหม่
// สัปดาห์ที่ 7: บันทึกใบลาใหม่ลง Firestore จริง (โฟลเดอร์ leaveRequests)
// ─────────────────────────────────────────────────────────────

(function () {
  var ฟอร์ม = document.getElementById("ฟอร์มใบลา");
  var ช่องประเภท = document.getElementById("leaveTypeId");
  var กล่องเตือน = document.getElementById("ข้อความเตือน");
  var ปุ่มAI = document.getElementById("ปุ่มAI");
  var กล่องผลลัพธ์AI = document.getElementById("ผลลัพธ์AI");
  var ข้อความปุ่มAIปกติ = ปุ่มAI.textContent;

  // เติมรายการเลื่อนลงด้วยประเภทการลาที่มีอยู่
  window.LEAVE_DATA.leaveTypes.forEach(function (ประเภท) {
    var ตัวเลือก = document.createElement("option");
    ตัวเลือก.value = ประเภท.id;
    ตัวเลือก.textContent = ประเภท.name;
    ช่องประเภท.appendChild(ตัวเลือก);
  });

  // อ่านรายชื่อประเภทการลาที่มีอยู่จริงจาก dropdown เอง (ไม่อ้างแหล่งข้อมูลตรง ๆ)
  // เพื่อให้ตรงกับสิ่งที่ผู้ใช้เห็นบนจอเสมอ ไม่ว่า dropdown จะถูกเติมมาจากที่ไหน
  function ประเภทที่มีอยู่จริง() {
    return Array.prototype.slice.call(ช่องประเภท.options)
      .filter(function (ตัวเลือก) { return ตัวเลือก.value; })
      .map(function (ตัวเลือก) { return { id: ตัวเลือก.value, name: ตัวเลือก.textContent }; });
  }

  function แสดงผลAI(ข้อความ, สำเร็จ) {
    กล่องผลลัพธ์AI.textContent = ข้อความ;
    กล่องผลลัพธ์AI.classList.remove("hidden", "alert-ai", "alert-error");
    กล่องผลลัพธ์AI.classList.add(สำเร็จ ? "alert-ai" : "alert-error");
  }

  ปุ่มAI.addEventListener("click", function () {
    var เหตุผล = document.getElementById("reason").value.trim();
    if (!เหตุผล) {
      เตือน("กรอกเหตุผลการลาก่อน ถึงจะให้ AI ช่วยจัดประเภทได้");
      return;
    }
    if (!window.AI_CONFIG || !window.AI_CONFIG.openRouterApiKey) {
      แสดงผลAI("ยังไม่ได้ตั้งค่า AI (ไม่มีคีย์ API) — กรุณาเลือกประเภทการลาเอง", false);
      return;
    }

    var รายการประเภท = ประเภทที่มีอยู่จริง();
    var ตัวควบคุมยกเลิก = new AbortController();
    var หมดเวลา = setTimeout(function () { ตัวควบคุมยกเลิก.abort(); }, 15000);

    ปุ่มAI.disabled = true;
    ปุ่มAI.textContent = "AI กำลังช่วยจัดประเภท…";

    var รายการสำหรับพรอมป์ = รายการประเภท
      .map(function (t) { return "- " + t.id + ": " + t.name; })
      .join("\n");

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
            content: "คุณคือผู้ช่วยจัดประเภทการลา ตอบกลับเป็น JSON เท่านั้น รูปแบบ {\"leaveTypeId\": \"...\"} " +
              "ห้ามมีข้อความอื่นปนมา และต้องเลือก leaveTypeId จากรายการที่ให้เท่านั้น"
          },
          {
            role: "user",
            content: "เหตุผลการลา: " + เหตุผล + "\n\nรายการประเภทการลาที่มีอยู่จริง:\n" + รายการสำหรับพรอมป์
          }
        ]
      })
    }).then(function (res) {
      return res.json().then(function (data) {
        if (!res.ok) throw new Error((data && data.error && data.error.message) || ("HTTP " + res.status));
        return data;
      });
    }).then(function (data) {
      var เนื้อหา = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      var จับJSON = เนื้อหา && เนื้อหา.match(/\{[\s\S]*\}/);
      var ผลลัพธ์ = จับJSON ? JSON.parse(จับJSON[0]) : null;
      var idที่ได้ = ผลลัพธ์ && ผลลัพธ์.leaveTypeId;

      var ประเภทที่ตรง = รายการประเภท.find(function (t) {
        return t.id === idที่ได้ || t.name === idที่ได้;
      });

      if (!ประเภทที่ตรง) {
        แสดงผลAI("จัดประเภทให้ไม่ได้ กรุณาเลือกเอง", false);
        return;
      }

      ช่องประเภท.value = ประเภทที่ตรง.id;
      แสดงผลAI("🤖 ข้อเสนอจาก AI — โปรดตรวจสอบก่อนยืนยัน: " + ประเภทที่ตรง.name, true);
    }).catch(function () {
      แสดงผลAI("จัดประเภทให้ไม่ได้ กรุณาเลือกเอง", false);
    }).finally(function () {
      clearTimeout(หมดเวลา);
      ปุ่มAI.disabled = false;
      ปุ่มAI.textContent = ข้อความปุ่มAIปกติ;
    });
  });

  ฟอร์ม.addEventListener("submit", function (e) {
    e.preventDefault();

    var ค่า = {
      title: document.getElementById("title").value.trim(),
      reason: document.getElementById("reason").value.trim(),
      leaveTypeId: ช่องประเภท.value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value
    };

    // ตรวจว่ากรอกครบก่อนบันทึก
    if (!ค่า.title || !ค่า.reason || !ค่า.leaveTypeId || !ค่า.startDate || !ค่า.endDate) {
      เตือน("กรอกไม่ครบ — ต้องกรอกทุกช่องก่อนกดบันทึก");
      return;
    }
    if (ค่า.endDate < ค่า.startDate) {
      เตือน("วันที่สิ้นสุดต้องไม่มาก่อนวันที่เริ่มลา");
      return;
    }

    var ประเภท = window.LEAVE_DATA.leaveTypes.find(function (t) { return t.id === ค่า.leaveTypeId; });
    var ผู้ใช้ = auth.currentUser;

    // สัปดาห์ที่ 7: requesterId ต้องเป็น uid ของคนที่ล็อกอินอยู่จริง
    var ใบใหม่ = {
      title: ค่า.title,
      reason: ค่า.reason,
      status: "รอพิจารณา",                       // ใบใหม่เริ่มที่ รอพิจารณา เสมอ
      requesterId: ผู้ใช้.uid, requesterName: ผู้ใช้.displayName || ผู้ใช้.email,
      approverId: "",      approverName: "",
      leaveTypeId: ประเภท.id, leaveTypeName: ประเภท.name,
      startDate: ค่า.startDate,
      endDate: ค่า.endDate,
      createdAt: เวลาตอนนี้()
    };

    var ปุ่มบันทึก = document.getElementById("ปุ่มบันทึก");
    ปุ่มบันทึก.disabled = true;

    db.collection("leaveRequests").add(ใบใหม่).then(function () {
      location.href = "leave-requests.html";
    }).catch(function (err) {
      ปุ่มบันทึก.disabled = false;
      เตือน("บันทึกไม่สำเร็จ: " + esc(err.message));
    });
  });

  function เตือน(ข้อความ) {
    กล่องเตือน.textContent = "⚠️ " + ข้อความ;
    กล่องเตือน.classList.remove("hidden");
  }
})();
