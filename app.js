(() => {
  "use strict";

  // ------------------------------------------------------------
  // 0. グループ決定 (URL の ?group=1〜4 で指定。無指定ならランダム割当)
  // ------------------------------------------------------------
  const params = new URLSearchParams(window.location.search);
  let groupId = params.get("group");
  if (!GROUPS[groupId]) {
    groupId = String(Math.floor(Math.random() * 4) + 1); // fallback: random 1-4
  }
  const group = GROUPS[groupId];

  // ------------------------------------------------------------
  // データを保持するオブジェクト
  // ------------------------------------------------------------
  const responseId =
    (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
    "resp-" + Date.now() + "-" + Math.random().toString(16).slice(2);

  const data = {
    response_id: responseId,
    group: groupId,
    lang: group.lang,
    framing: group.framing,
    consent_time: "",
    modal_shown_time: "",
    modal_action: "",
    modal_reaction_ms: "",
    cefr: "",
    cefr_note: "",
    fear_key: "",
    fear_stalker: "",
    fear_car: "",
    scam_action_choice: "",
    scam_fear: "",
    user_agent: navigator.userAgent,
    submitted_at: "",
  };

  // ------------------------------------------------------------
  // ステップ切り替え
  // ------------------------------------------------------------
  function showStep(id) {
    document.querySelectorAll(".step").forEach(el => el.classList.remove("active"));
    document.getElementById(id).classList.add("active");
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  // ------------------------------------------------------------
  // 1〜5 の尺度ラジオボタンを生成
  // ------------------------------------------------------------
  function buildScale(container) {
    const name = container.dataset.scale;
    for (let i = 1; i <= 5; i++) {
      const wrap = document.createElement("div");
      wrap.className = "scale-item";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = name;
      input.value = String(i);
      input.id = `${name}-${i}`;
      const label = document.createElement("label");
      label.htmlFor = input.id;
      label.textContent = String(i);
      wrap.appendChild(input);
      wrap.appendChild(label);
      container.appendChild(wrap);
    }
  }
  document.querySelectorAll(".scale-row").forEach(buildScale);

  // ------------------------------------------------------------
  // グループごとのメッセージをモーダル・アンケートに反映
  // ------------------------------------------------------------
  document.getElementById("scam-title").textContent = group.modalTitle;
  document.getElementById("scam-message").textContent = group.message;
  document.getElementById("scam-download").textContent = group.downloadLabel;
  document.getElementById("scam-ignore").textContent = group.closeLabel;
  document.getElementById("scam-countdown-label").textContent = group.countdownLabel;
  document.getElementById("scam-message-recap").textContent =
    `「${group.message}」`;

  // ------------------------------------------------------------
  // STEP 1: 同意画面
  // ------------------------------------------------------------
  const consentCheckbox = document.getElementById("consent-checkbox");
  const consentError = document.getElementById("consent-error");

  document.getElementById("btn-start").addEventListener("click", () => {
    if (!consentCheckbox.checked) {
      consentError.classList.remove("hidden");
      return;
    }
    consentError.classList.add("hidden");
    data.consent_time = new Date().toISOString();
    showStep("step-experiment");
    startExperiment();
  });

  // ------------------------------------------------------------
  // STEP 2: 模擬詐欺メッセージ モーダル + カウントダウン
  // ------------------------------------------------------------
  const overlay = document.getElementById("scam-overlay");
  const timerEl = document.getElementById("scam-timer");
  const countdownBox = document.getElementById("scam-countdown");
  const surveyWrap = document.getElementById("survey-wrap");

  let countdownInterval = null;
  let modalShownAt = 0;

  function startExperiment() {
    overlay.classList.remove("hidden");
    modalShownAt = Date.now();
    data.modal_shown_time = new Date(modalShownAt).toISOString();

    let remaining = COUNTDOWN_SECONDS;
    updateTimerDisplay(remaining);

    countdownInterval = setInterval(() => {
      remaining -= 1;
      updateTimerDisplay(remaining);
      if (remaining <= 30) {
        countdownBox.classList.add("urgent");
      }
      if (remaining <= 0) {
        dismissModal("timeout");
      }
    }, 1000);
  }

  function updateTimerDisplay(seconds) {
    const s = Math.max(0, seconds);
    const mm = String(Math.floor(s / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    timerEl.textContent = `${mm}:${ss}`;
  }

  function dismissModal(action) {
    if (overlay.classList.contains("hidden")) return; // already dismissed
    clearInterval(countdownInterval);
    data.modal_action = action;
    data.modal_reaction_ms = String(Date.now() - modalShownAt);
    overlay.classList.add("hidden");
    surveyWrap.classList.remove("survey-locked");
  }

  document.getElementById("scam-download").addEventListener("click", () => dismissModal("download"));
  document.getElementById("scam-ignore").addEventListener("click", () => dismissModal("close"));
  document.getElementById("scam-close-x").addEventListener("click", () => dismissModal("close_x"));

  // ------------------------------------------------------------
  // アンケート送信
  // ------------------------------------------------------------
  const submitError = document.getElementById("submit-error");

  document.getElementById("btn-submit").addEventListener("click", async () => {
    const cefr = document.querySelector('input[name="cefr"]:checked');
    const fearKey = document.querySelector('input[name="fear_key"]:checked');
    const fearStalker = document.querySelector('input[name="fear_stalker"]:checked');
    const fearCar = document.querySelector('input[name="fear_car"]:checked');
    const action = document.querySelector('input[name="action"]:checked');
    const scamFear = document.querySelector('input[name="scam_fear"]:checked');

    if (!cefr || !fearKey || !fearStalker || !fearCar || !action || !scamFear) {
      submitError.classList.remove("hidden");
      submitError.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    submitError.classList.add("hidden");

    data.cefr = cefr.value;
    data.cefr_note = document.getElementById("cefr-note").value.trim();
    data.fear_key = fearKey.value;
    data.fear_stalker = fearStalker.value;
    data.fear_car = fearCar.value;
    data.scam_action_choice = action.value;
    data.scam_fear = scamFear.value;
    data.submitted_at = new Date().toISOString();

    const btn = document.getElementById("btn-submit");
    btn.disabled = true;
    btn.textContent = "送信中...";

    await sendData(data);

    showStep("step-done");
  });

  // ------------------------------------------------------------
  // Google Apps Script へ送信（GAS_ENDPOINT が空ならコンソール出力のみ）
  // ------------------------------------------------------------
  async function sendData(payload) {
    if (!GAS_ENDPOINT) {
      console.log("[TEST MODE] GAS_ENDPOINT が未設定のため、送信データをコンソールに出力します:", payload);
      return;
    }
    try {
      await fetch(GAS_ENDPOINT, {
        method: "POST",
        mode: "no-cors", // Apps Script は CORS レスポンスヘッダを返さないため no-cors で送信
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("送信エラー:", err);
      // no-cors では失敗の詳細を取得できないため、ネットワークエラー時のみここに到達
    }
  }
})();
