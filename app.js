(function () {
  "use strict";

  var D = SidejobData;

  /* ==========================================================
     フォーム読み取り・バリデーション
     ========================================================== */
  function getCheckedValues(name) {
    var nodes = document.querySelectorAll('input[name="' + name + '"]:checked');
    return Array.prototype.map.call(nodes, function (n) { return n.value; });
  }

  function getRadioValue(name) {
    var node = document.querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : null;
  }

  function readForm() {
    var skills = getCheckedValues("skills");
    var interests = getCheckedValues("interests");
    var resources = getCheckedValues("resources");
    var time = getRadioValue("time");
    var dayType = getRadioValue("dayType");
    var workStyle = getRadioValue("workStyle");
    var physicalPref = getRadioValue("physicalPref");
    var communication = getRadioValue("communication");
    var budget = getRadioValue("budget");
    var experience = getRadioValue("experience");
    var incomeGoal = getRadioValue("incomeGoal");

    var errors = {};
    if (skills.length === 0) errors.skills = true;
    if (interests.length === 0) errors.interests = true;
    if (time === null) errors.time = true;
    if (dayType === null) errors.dayType = true;
    if (workStyle === null) errors.workStyle = true;
    if (physicalPref === null) errors.physicalPref = true;
    if (communication === null) errors.communication = true;
    if (budget === null) errors.budget = true;
    if (experience === null) errors.experience = true;
    if (incomeGoal === null) errors.incomeGoal = true;

    if (Object.keys(errors).length > 0) {
      return { ok: false, errors: errors };
    }

    var hasPC = resources.indexOf("pc") !== -1;
    var vehicleTier = 0;
    resources.forEach(function (r) {
      if (D.VEHICLE_TIER_MAP[r] && D.VEHICLE_TIER_MAP[r] > vehicleTier) vehicleTier = D.VEHICLE_TIER_MAP[r];
    });

    return {
      ok: true,
      value: {
        skills: skills,
        interests: interests,
        time: parseInt(time, 10),
        dayType: dayType,
        workStyle: workStyle,
        physicalPref: physicalPref,
        communication: communication,
        hasPC: hasPC,
        vehicleTier: vehicleTier,
        budget: parseInt(budget, 10),
        experience: experience,
        incomeGoal: parseInt(incomeGoal, 10)
      }
    };
  }

  function clearFieldErrors() {
    document.querySelectorAll(".field-block.has-error").forEach(function (el) {
      el.classList.remove("has-error");
    });
  }

  function showFieldErrors(errors) {
    Object.keys(errors).forEach(function (name) {
      var group = document.querySelector('[data-name="' + name + '"]');
      if (group) {
        var block = group.closest(".field-block");
        if (block) block.classList.add("has-error");
      }
    });
  }

  /* ==========================================================
     診断履歴の一覧表示（index.html側）
     ========================================================== */
  function renderHistory() {
    var history = D.loadHistory();
    var list = document.getElementById("history-list");
    var empty = document.getElementById("history-empty");
    if (!list || !empty) return;
    list.innerHTML = "";

    if (history.length === 0) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    history.forEach(function (entry) {
      var topJob = entry.results && entry.results[0] ? D.jobById(entry.results[0].jobId) : null;
      var li = document.createElement("li");
      li.className = "history-item";

      var info = document.createElement("div");
      info.className = "history-info";
      info.innerHTML =
        '<span class="history-date">' + D.formatDate(entry.date) + "</span>" +
        '<span class="history-top">第1位: <strong>' + (topJob ? topJob.name : "不明") + "</strong></span>";

      var actions = document.createElement("div");
      actions.className = "history-actions";

      var viewBtn = document.createElement("button");
      viewBtn.type = "button";
      viewBtn.className = "icon-btn";
      viewBtn.textContent = "結果を見る";
      viewBtn.addEventListener("click", function () {
        D.saveCurrentResult(entry);
        window.location.href = "result.html";
      });

      var delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "icon-btn danger";
      delBtn.textContent = "削除";
      delBtn.addEventListener("click", function () {
        D.deleteHistoryEntry(entry.id);
        renderHistory();
      });

      actions.appendChild(viewBtn);
      actions.appendChild(delBtn);

      li.appendChild(info);
      li.appendChild(actions);
      list.appendChild(li);
    });
  }

  function clearAllHistory() {
    if (D.loadHistory().length === 0) return;
    if (!window.confirm("診断履歴をすべて削除します。よろしいですか？")) return;
    D.clearAllHistory();
    renderHistory();
  }

  /* ==========================================================
     ページ上部へ戻るボタン
     ========================================================== */
  function initBackToTop() {
    var btn = document.getElementById("back-to-top");
    if (!btn) return;

    function update() {
      var show = window.scrollY > 400;
      btn.classList.toggle("visible", show);
      btn.setAttribute("tabindex", show ? "0" : "-1");
    }

    window.addEventListener("scroll", update, { passive: true });
    btn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    update();
  }

  /* ==========================================================
     画像内「自分に合う副業を診断する」ボタンのクリック領域
     ========================================================== */
  function initDiagnosisImageCta() {
    var btn = document.getElementById("diagnosis-image-cta");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var target = document.getElementById("diagnose");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  /* ==========================================================
     GA4イベント送信（診断開始／診断完了）
     ========================================================== */
  var diagnosisStartSent = false;
  var diagnosisCompleteSent = false;
  var navigatedToResult = false;

  function sendGaEvent(eventName) {
    if (typeof gtag === "function") {
      gtag("event", eventName);
    }
  }

  function handleDiagnosisFirstInteraction() {
    if (diagnosisStartSent) return;
    diagnosisStartSent = true;
    sendGaEvent("diagnosis_start");
  }

  function goToResult() {
    if (navigatedToResult) return;
    navigatedToResult = true;
    window.location.href = "result.html";
  }

  /* ==========================================================
     初期化
     ========================================================== */
  function init() {
    var form = document.getElementById("diagnosis-form");

    form.addEventListener("change", handleDiagnosisFirstInteraction, { once: true });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      clearFieldErrors();

      var parsed = readForm();
      if (!parsed.ok) {
        showFieldErrors(parsed.errors);
        var firstErrorBlock = document.querySelector(".field-block.has-error");
        if (firstErrorBlock) firstErrorBlock.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }

      var results = D.diagnose(parsed.value);
      var entry = D.addHistoryEntry(parsed.value, results);
      D.saveCurrentResult(entry);

      if (!diagnosisCompleteSent) {
        diagnosisCompleteSent = true;

        if (typeof gtag === "function") {
          gtag("event", "diagnosis_complete", {
            event_callback: goToResult,
            event_timeout: 1000
          });
          setTimeout(goToResult, 1000);
        } else {
          goToResult();
        }
      } else {
        goToResult();
      }
    });

    document.getElementById("clear-history").addEventListener("click", clearAllHistory);

    renderHistory();
    initBackToTop();
    initDiagnosisImageCta();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
