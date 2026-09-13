(function () {
  "use strict";

  var D = SidejobData;
  var entry = null;
  var results = [];
  var currentIndex = 0;

  function starString(stars) {
    var full = "★".repeat(stars);
    var dim = "☆".repeat(5 - stars);
    return full + '<span class="dim">' + dim + "</span>";
  }

  /* ==========================================================
     ランクタブ（1位／2位／3位）
     ========================================================== */
  function renderRankTabs() {
    var container = document.getElementById("rank-tabs");
    container.innerHTML = "";
    results.forEach(function (result, index) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "rank-tab" + (index === currentIndex ? " active" : "");
      btn.setAttribute("role", "tab");
      btn.setAttribute("aria-selected", index === currentIndex ? "true" : "false");
      btn.innerHTML =
        '<span class="rank-tab-num">' + (index + 1) + "位</span>" +
        '<span class="rank-tab-name">' + result.job.name + "</span>";
      btn.addEventListener("click", function () {
        if (currentIndex === index) return;
        currentIndex = index;
        renderRankTabs();
        renderDetail();
      });
      container.appendChild(btn);
    });
  }

  /* ==========================================================
     詳細セクションの描画
     ========================================================== */
  function renderDetail() {
    var result = results[currentIndex];
    var job = result.job;
    var input = entry.input;

    document.getElementById("r-rank-badge").textContent = "おすすめ第" + (currentIndex + 1) + "位";
    document.getElementById("r-name").textContent = job.name;
    document.getElementById("r-stars").innerHTML = starString(result.stars);
    document.getElementById("r-desc").textContent = job.desc;

    var reasonList = document.getElementById("r-reason-list");
    reasonList.innerHTML = "";
    D.buildReasonList(job, input).forEach(function (item) {
      var li = document.createElement("li");
      li.innerHTML = "<strong>" + item.label + "</strong>" + "<span>" + item.text + "</span>";
      reasonList.appendChild(li);
    });

    var prosList = document.getElementById("r-pros-list");
    prosList.innerHTML = "";
    D.getDisplayPros(job).forEach(function (text) {
      var li = document.createElement("li");
      li.textContent = text;
      prosList.appendChild(li);
    });

    var consList = document.getElementById("r-cons-list");
    consList.innerHTML = "";
    D.getDisplayCons(job).forEach(function (con) {
      var li = document.createElement("li");
      li.innerHTML =
        '<p class="con-text">' + con.text + "</p>" +
        '<p class="con-mitigation"><strong>対策・注意点　</strong>' + con.mitigation + "</p>";
      consList.appendChild(li);
    });

    document.getElementById("r-monetize-value").textContent = "収益化までの目安：" + job.monetizeSpan;
    document.getElementById("r-income-value").textContent = "想定月収の目安：" + job.incomeRange;
    document.getElementById("r-first-action-value").textContent = job.firstAction;

    var neededList = document.getElementById("r-needed-list");
    neededList.innerHTML = "";
    job.needed.forEach(function (item) {
      var li = document.createElement("li");
      li.textContent = item;
      neededList.appendChild(li);
    });

    document.getElementById("r-cost-value").textContent =
      "初期費用の目安：" + D.BUDGET_LABELS[job.budgetLevel] + "程度。" + job.costNote;

    document.getElementById("r-suitable-value").textContent = job.suitableFor;

    var planList = document.getElementById("r-plan-list");
    planList.innerHTML = "";
    D.getDisplayPlan(job).forEach(function (day, i) {
      var stepsHtml = day.steps.map(function (s) { return "<li>" + s + "</li>"; }).join("");
      var details = document.createElement("details");
      details.className = "plan-day-item";
      if (i === 0) details.open = true;

      details.innerHTML =
        '<summary class="plan-day-header">' +
          '<span class="plan-day-badge">Day' + (i + 1) + "</span>" +
          '<span class="plan-day-header-text">' +
            '<p class="plan-day-header-title">' + day.title + "</p>" +
            '<span class="plan-day-header-time">' + day.time + "</span>" +
          "</span>" +
          '<span class="plan-day-chevron" aria-hidden="true">▾</span>' +
        "</summary>" +
        '<div class="plan-day-panel">' +
          '<div>' +
            '<p class="plan-block-label">今回の目的</p>' +
            '<p class="plan-purpose">' + day.purpose + "</p>" +
          "</div>" +
          '<div>' +
            '<p class="plan-block-label">今日やること・具体的な手順</p>' +
            '<ol class="plan-steps">' + stepsHtml + "</ol>" +
          "</div>" +
          '<div>' +
            '<p class="plan-block-label">初心者が迷いやすいポイント・注意点</p>' +
            '<p class="plan-pitfall">' + day.pitfall + "</p>" +
          "</div>" +
          '<div>' +
            '<p class="plan-block-label">今日の完了目標</p>' +
            '<p class="plan-goal">' + day.goal + "</p>" +
          "</div>" +
        "</div>";
      planList.appendChild(details);
    });

    var skillLabels = input.skills.map(function (s) { return D.SKILL_LABELS[s]; }).join("・");
    var interestLabels = input.interests.map(function (i) { return D.INTEREST_LABELS[i]; }).join("・");
    document.getElementById("results-summary").textContent =
      "得意分野「" + skillLabels + "」、興味「" + interestLabels +
      "」に加え、働く場所・活動しやすい曜日・体力面や対人面の希望なども考慮して、おすすめの副業を3つ選びました。";
  }

  /* ==========================================================
     ページ内ナビゲーション（スムーズスクロール）
     ========================================================== */
  function initDetailNav() {
    var nav = document.getElementById("detail-nav");
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function (e) {
        var targetId = link.getAttribute("href").slice(1);
        var targetEl = document.getElementById(targetId);
        if (!targetEl) return;
        e.preventDefault();
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
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
     初期化
     ========================================================== */
  function init() {
    entry = D.loadCurrentResult();

    if (!entry || !entry.results || !entry.results.length || !entry.input) {
      document.getElementById("no-result").hidden = false;
      return;
    }

    results = entry.results
      .map(function (r) {
        var job = D.jobById(r.jobId);
        return job ? { job: job, stars: r.stars } : null;
      })
      .filter(Boolean);

    if (results.length === 0) {
      document.getElementById("no-result").hidden = false;
      return;
    }

    document.getElementById("result-root").hidden = false;

    renderRankTabs();
    renderDetail();
    initDetailNav();
    initBackToTop();

    if (typeof gtag === "function") {
      gtag("event", "diagnosis_result_view");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
