let logs = JSON.parse(localStorage.getItem("studyLogs")) || [];
let currentLanguage = localStorage.getItem("language") || "en";

let timerState = JSON.parse(localStorage.getItem("timerState")) || {
  running: false,
  subject: "",
  mode: "timer",
  startTime: null,
  elapsedBeforePause: 0,
  targetMinutes: null
};

let timerInterval = null;

const subjectInput = document.getElementById("subject");
const timerDisplay = document.getElementById("timer");
const sessionLabel = document.getElementById("sessionLabel");

const translations = {
  en: {
    badge: "Study Tracker · Pomodoro · Analytics",
    heroTitle: "Build better study habits.",
    subtitle: "Track your study time, stay consistent, and review your progress.",
    today: "Today",
    streak: "Streak",
    subject: "Subject",
    start: "Start",
    pause: "Pause",
    finish: "Finish & Save",
    totalStudy: "Total Study Time",
    topSubject: "Most Studied Subject",
    sessionCount: "Total Sessions",
    weeklyTitle: "Weekly Study Chart",
    subjectStatsTitle: "Subject Statistics",
    recentSessions: "Recent Sessions",
    clearAll: "Clear All",
    placeholder: "e.g. Network Security",
    focusSession: "Focus Session",
    pomodoro25: "Pomodoro Focus · 25 min",
    pomodoro50: "Deep Focus · 50 min",
    noSubject: "Please enter a subject.",
    noTime: "There is no study time to save.",
    modeChangeAlert: "Finish or clear the current session before changing modes.",
    complete: "Focus session complete!",
    noLogs: "No study sessions yet.",
    noStats: "No subject statistics yet.",
    none: "None",
    clearConfirm: "Clear all study sessions?",
    days: "days",
    day: "day",
    timer: "Timer",
    pomodoroName: "25/5 Pomodoro",
    deepFocusName: "50/10 Deep Focus",
    weekDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  },
  ko: {
    badge: "공부 타이머 · 포모도로 · 학습 통계",
    heroTitle: "더 나은 공부 습관을 만들어보세요.",
    subtitle: "공부 시간을 기록하고, 꾸준함을 유지하고, 학습 성장을 확인하세요.",
    today: "오늘 공부",
    streak: "연속 공부",
    subject: "공부 과목",
    start: "시작",
    pause: "일시정지",
    finish: "종료 및 저장",
    totalStudy: "전체 누적 공부",
    topSubject: "가장 많이 공부한 과목",
    sessionCount: "전체 세션",
    weeklyTitle: "주간 공부 그래프",
    subjectStatsTitle: "과목별 누적시간",
    recentSessions: "최근 공부 기록",
    clearAll: "전체 삭제",
    placeholder: "예: 네트워크 보안",
    focusSession: "집중 세션",
    pomodoro25: "포모도로 집중 · 25분",
    pomodoro50: "깊은 집중 · 50분",
    noSubject: "공부 과목을 입력해주세요.",
    noTime: "저장할 공부 시간이 없습니다.",
    modeChangeAlert: "현재 세션을 종료한 뒤 모드를 변경해주세요.",
    complete: "집중 세션이 완료되었습니다!",
    noLogs: "아직 공부 기록이 없습니다.",
    noStats: "아직 과목별 통계가 없습니다.",
    none: "없음",
    clearConfirm: "모든 공부 기록을 삭제할까요?",
    days: "일",
    day: "일",
    timer: "일반 타이머",
    pomodoroName: "25/5 포모도로",
    deepFocusName: "50/10 집중",
    weekDays: ["월", "화", "수", "목", "금", "토", "일"]
  }
};

function t(key) {
  return translations[currentLanguage][key];
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem("language", lang);
  document.documentElement.lang = lang;

  applyLanguage();
  restoreModeButton();
  renderLogs();
  updateTodayTotal();
  updateStats();
  updateStreak();
  updateWeeklyChart();
}

function applyLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    el.textContent = t(key);
  });

  subjectInput.placeholder = t("placeholder");
}

function setMode(mode, button) {
  if (timerState.running || timerState.elapsedBeforePause > 0) {
    alert(t("modeChangeAlert"));
    return;
  }

  timerState.mode = mode;

  if (mode === "timer") {
    timerState.targetMinutes = null;
  }

  if (mode === "pomodoro25") {
    timerState.targetMinutes = 25;
  }

  if (mode === "pomodoro50") {
    timerState.targetMinutes = 50;
  }

  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  button.classList.add("active");
  saveTimerState();
  restoreModeButton();
  updateTimerDisplay();
}

function startTimer() {
  const subject = subjectInput.value.trim();

  if (!subject) {
    alert(t("noSubject"));
    return;
  }

  if (timerState.running) {
    return;
  }

  timerState.running = true;
  timerState.subject = subject;
  timerState.startTime = Date.now();

  saveTimerState();
  runTimer();
}

function pauseTimer() {
  if (!timerState.running) {
    return;
  }

  timerState.elapsedBeforePause += Date.now() - timerState.startTime;
  timerState.running = false;
  timerState.startTime = null;

  saveTimerState();
  stopTimer();
  updateTimerDisplay();
}

function finishTimer() {
  const elapsed = getCurrentElapsed();

  if (elapsed < 1000) {
    alert(t("noTime"));
    return;
  }

  const minutes = Math.max(1, Math.floor(elapsed / 60000));
  const now = new Date();

  const log = {
    id: Date.now(),
    subject: timerState.subject || subjectInput.value.trim(),
    minutes,
    mode: timerState.mode,
    date: now.toLocaleString(),
    day: now.toLocaleDateString()
  };

  logs.unshift(log);
  localStorage.setItem("studyLogs", JSON.stringify(logs));

  timerState = {
    running: false,
    subject: "",
    mode: "timer",
    startTime: null,
    elapsedBeforePause: 0,
    targetMinutes: null
  };

  subjectInput.value = "";

  saveTimerState();
  stopTimer();
  updateTimerDisplay();
  renderLogs();
  updateTodayTotal();
  updateStats();
  updateStreak();
  updateWeeklyChart();
  restoreModeButton();
}

function getCurrentElapsed() {
  if (timerState.running) {
    return timerState.elapsedBeforePause + (Date.now() - timerState.startTime);
  }

  return timerState.elapsedBeforePause;
}

function updateTimerDisplay() {
  const elapsed = getCurrentElapsed();

  if (timerState.targetMinutes) {
    const targetMs = timerState.targetMinutes * 60 * 1000;
    const remaining = Math.max(0, targetMs - elapsed);

    if (remaining === 0 && timerState.running) {
      finishTimer();
      alert(t("complete"));
      return;
    }

    timerDisplay.textContent = formatTime(remaining);
    return;
  }

  timerDisplay.textContent = formatTime(elapsed);
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);

  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");

  return `${hours}:${minutes}:${seconds}`;
}

function runTimer() {
  stopTimer();

  timerInterval = setInterval(() => {
    updateTimerDisplay();
  }, 1000);

  updateTimerDisplay();
}

function stopTimer() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function saveTimerState() {
  localStorage.setItem("timerState", JSON.stringify(timerState));
}

function renderLogs() {
  const logList = document.getElementById("logList");
  logList.innerHTML = "";

  if (logs.length === 0) {
    logList.innerHTML = `<p class="empty">${t("noLogs")}</p>`;
    return;
  }

  logs.forEach((log) => {
    const item = document.createElement("div");
    item.className = "log-item";

    item.innerHTML = `
      <h3>${escapeHTML(log.subject)}</h3>
      <div class="log-meta">
        ${formatMinutes(log.minutes)} · ${getModeName(log.mode)} · ${log.date}
      </div>
    `;

    logList.appendChild(item);
  });
}

function updateTodayTotal() {
  const today = new Date().toLocaleDateString();

  const total = logs
    .filter((log) => log.day === today)
    .reduce((sum, log) => sum + Number(log.minutes), 0);

  document.getElementById("todayTotal").textContent = formatMinutes(total);
}

function updateStats() {
  const total = logs.reduce((sum, log) => sum + Number(log.minutes), 0);
  document.getElementById("totalStudy").textContent = formatMinutes(total);
  document.getElementById("sessionCount").textContent = logs.length;

  const subjectMap = {};

  logs.forEach((log) => {
    if (!subjectMap[log.subject]) {
      subjectMap[log.subject] = 0;
    }

    subjectMap[log.subject] += Number(log.minutes);
  });

  const sortedSubjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);

  const topSubject = document.getElementById("topSubject");
  const subjectStats = document.getElementById("subjectStats");

  if (sortedSubjects.length === 0) {
    topSubject.textContent = t("none");
    subjectStats.innerHTML = `<p class="empty">${t("noStats")}</p>`;
    return;
  }

  topSubject.textContent = sortedSubjects[0][0];
  subjectStats.innerHTML = "";

  sortedSubjects.forEach(([subject, minutes]) => {
    const item = document.createElement("div");
    item.className = "subject-item";

    item.innerHTML = `
      <strong>${escapeHTML(subject)}</strong>
      <span>${formatMinutes(minutes)}</span>
    `;

    subjectStats.appendChild(item);
  });
}

function updateWeeklyChart() {
  const chart = document.getElementById("weeklyChart");
  chart.innerHTML = "";

  const weekData = getThisWeekData();
  const dailyGoalMinutes = 120;

  weekData.forEach((dayData, index) => {
    const percent = Math.min(100, (dayData.minutes / dailyGoalMinutes) * 100);

    const row = document.createElement("div");
    row.className = "week-row";

    row.innerHTML = `
      <div class="week-day">${t("weekDays")[index]}</div>
      <div class="week-bar-bg">
        <div class="week-bar" style="width: ${percent}%"></div>
      </div>
      <div class="week-time">${formatMinutes(dayData.minutes)}</div>
    `;

    chart.appendChild(row);
  });
}

function getThisWeekData() {
  const today = new Date();
  const day = today.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const week = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);

    const dateKey = current.toLocaleDateString();

    const minutes = logs
      .filter((log) => log.day === dateKey)
      .reduce((sum, log) => sum + Number(log.minutes), 0);

    week.push({
      date: dateKey,
      minutes
    });
  }

  return week;
}

function updateStreak() {
  const uniqueDays = [...new Set(logs.map((log) => log.day))]
    .map((day) => new Date(day))
    .sort((a, b) => b - a);

  if (uniqueDays.length === 0) {
    document.getElementById("streakDays").textContent =
      currentLanguage === "ko" ? "0일" : "0 days";
    return;
  }

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < uniqueDays.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);

    const current = new Date(uniqueDays[i]);
    current.setHours(0, 0, 0, 0);

    if (current.getTime() === expected.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  if (currentLanguage === "ko") {
    document.getElementById("streakDays").textContent = `${streak}일`;
  } else {
    document.getElementById("streakDays").textContent =
      streak === 1 ? `1 ${t("day")}` : `${streak} ${t("days")}`;
  }
}

function getModeName(mode) {
  if (mode === "pomodoro25") return t("pomodoroName");
  if (mode === "pomodoro50") return t("deepFocusName");
  return t("timer");
}

function formatMinutes(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  if (currentLanguage === "ko") {
    if (h === 0) return `${m}분`;
    if (m === 0) return `${h}시간`;
    return `${h}시간 ${m}분`;
  }

  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function clearAllLogs() {
  if (!confirm(t("clearConfirm"))) {
    return;
  }

  logs = [];
  localStorage.removeItem("studyLogs");

  renderLogs();
  updateTodayTotal();
  updateStats();
  updateStreak();
  updateWeeklyChart();
}

function restoreTimer() {
  if (timerState.subject) {
    subjectInput.value = timerState.subject;
  }

  if (timerState.running) {
    runTimer();
  } else {
    updateTimerDisplay();
  }

  restoreModeButton();
}

function restoreModeButton() {
  document.querySelectorAll(".mode-btn").forEach((btn) => {
    btn.classList.remove("active");
  });

  const buttons = document.querySelectorAll(".mode-btn");

  if (timerState.mode === "pomodoro25") {
    buttons[1].classList.add("active");
    sessionLabel.textContent = t("pomodoro25");
  } else if (timerState.mode === "pomodoro50") {
    buttons[2].classList.add("active");
    sessionLabel.textContent = t("pomodoro50");
  } else {
    buttons[0].classList.add("active");
    sessionLabel.textContent = t("focusSession");
  }
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js");
  });
}

document.documentElement.lang = currentLanguage;

applyLanguage();
restoreTimer();
renderLogs();
updateTodayTotal();
updateStats();
updateStreak();
updateWeeklyChart();