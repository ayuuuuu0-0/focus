/**
 * fo.cus — interactive daily command center
 */

const INITIAL_TASKS = [
  {
    id: "1",
    title: "review PR feedback on auth module",
    status: "completed",
    time: null,
  },
  {
    id: "2",
    title: "system design notes — chapter 4",
    status: "active",
    time: "10:00 → 12:30",
    progress: 62,
    eta: "~72m left",
  },
  {
    id: "3",
    title: "standup prep + blockers doc",
    status: "upcoming",
    time: "14:00 → 16:00",
  },
  {
    id: "4",
    title: "pair on caching layer spike",
    status: "upcoming",
    time: "16:30 → 18:00",
  },
];

const WEEK_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const ACTIVE_GOAL = "system design notes";

let tasks = [...INITIAL_TASKS];
let checkinMood = null;

const $ = (sel) => document.querySelector(sel);

function init() {
  setDateDisplay();
  renderTasks();
  renderWeekDays();
  bindEvents();
  updateStats();
}

/** Format header date pill from current date */
function setDateDisplay() {
  const now = new Date();
  const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const el = $("#dateDisplay");
  if (el) {
    el.textContent = `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
  }
}

/** Render all task rows */
function renderTasks() {
  const list = $("#taskList");
  if (!list) return;

  list.innerHTML = tasks
    .map((task) => {
      const pillClass =
        task.status === "completed"
          ? "pill-done"
          : task.status === "active"
            ? "pill-active"
            : "pill-upnext";
      const pillLabel =
        task.status === "completed" ? "done" : task.status === "active" ? "active" : "up next";

      const progressHtml =
        task.status === "active" && task.progress != null
          ? `<div class="task-progress-wrap">
               <div class="task-progress-bar" style="width: ${task.progress}%"></div>
             </div>`
          : "";

      const metaHtml =
        task.time || task.progress != null
          ? `<div class="task-meta">
               ${task.time ? `<span class="task-time">${task.time}</span>` : ""}
               ${task.status === "active" && task.progress != null ? `<span>${task.progress}% complete</span>` : ""}
             </div>${progressHtml}`
          : "";

      const etaHtml =
        task.eta ? `<span class="task-eta">${task.eta}</span>` : "";

      return `<li class="task-item ${task.status}" data-id="${task.id}" role="listitem">
        <div class="task-main">
          <div class="task-title" tabindex="0">${escapeHtml(task.title)}</div>
          ${metaHtml}
        </div>
        <div class="task-right">
          <span class="pill ${pillClass}">${pillLabel}</span>
          ${etaHtml}
        </div>
      </li>`;
    })
    .join("");

  list.querySelectorAll(".task-title").forEach((el) => {
    el.addEventListener("click", () => toggleTask(el.closest(".task-item").dataset.id));
    el.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleTask(el.closest(".task-item").dataset.id);
      }
    });
  });
}

/** Toggle task completion; active tasks advance the queue */
function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  if (task.status === "completed") {
    task.status = "upcoming";
  } else if (task.status === "active") {
    task.status = "completed";
    task.progress = null;
    task.eta = null;
    promoteNextActive();
  } else {
    task.status = "completed";
  }

  renderTasks();
  updateStats();
}

/** Promote first upcoming task to active after completing active */
function promoteNextActive() {
  const next = tasks.find((t) => t.status === "upcoming");
  if (next) {
    next.status = "active";
    next.progress = 0;
    next.eta = "~90m left";
  }
}

/** Add task from input */
function addTask() {
  const input = $("#taskInput");
  const title = input?.value.trim();
  if (title.length === 0) return;

  const hasActive = tasks.some((t) => t.status === "active");
  tasks.push({
    id: String(Date.now()),
    title,
    status: hasActive ? "upcoming" : "active",
    time: null,
    progress: hasActive ? null : 0,
    eta: hasActive ? null : "~60m left",
  });

  input.value = "";
  renderTasks();
  updateStats();
}

/** Update goals pill, stats grid, check-in context */
function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const active = tasks.find((t) => t.status === "active");
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const goalsDone = $("#goalsDone");
  const goalsTotal = $("#goalsTotal");
  const goalsFill = $("#goalsFill");
  if (goalsDone) goalsDone.textContent = String(done);
  if (goalsTotal) goalsTotal.textContent = String(total);
  if (goalsFill) goalsFill.style.width = `${total > 0 ? (done / total) * 100 : 0}%`;

  const statDone = $("#statDone");
  const statActive = $("#statActive");
  const statTime = $("#statTime");
  if (statDone) statDone.textContent = `${done}/${total}`;
  if (statActive) statActive.textContent = active?.progress != null ? `${active.progress}%` : "—";
  if (statTime) {
    const remaining = tasks.filter((t) => t.status !== "completed").length;
    statTime.textContent = `~${Math.max(1, remaining)}h`;
  }

  const checkinQ = $("#checkinQuestion");
  if (checkinQ && active) {
    const short = active.title.length > 28 ? active.title.slice(0, 28) + "…" : active.title;
    checkinQ.innerHTML = `how's <strong>${escapeHtml(short)}</strong> going?`;
  }
}

/** Render week day tiles with activity dots */
function renderWeekDays() {
  const container = $("#weekDays");
  if (!container) return;

  const today = new Date().getDay();
  const mondayBased = today === 0 ? 6 : today - 1;

  container.innerHTML = WEEK_LABELS.map((label, i) => {
    const isToday = i === mondayBased;
    const hasActivity = i <= mondayBased && i % 2 === 0;
    const hasActive = isToday;
    const classes = [
      "week-day",
      isToday ? "today" : "",
      hasActivity ? "has-activity" : "",
      hasActive ? "has-active" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return `<button type="button" class="${classes}" aria-label="Day ${label}">${label}<span class="dot"></span></button>`;
  }).join("");
}

function bindEvents() {
  $("#addTaskBtn")?.addEventListener("click", addTask);
  $("#taskInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") addTask();
  });

  document.querySelectorAll(".checkin-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".checkin-btn").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      checkinMood = btn.dataset.mood;

      if (checkinMood === "done") {
        const active = tasks.find((t) => t.status === "active");
        if (active) {
          active.status = "completed";
          active.progress = null;
          active.eta = null;
          promoteNextActive();
          renderTasks();
          updateStats();
        }
        setTimeout(() => {
          document.querySelectorAll(".checkin-btn").forEach((b) => b.classList.remove("selected"));
        }, 600);
      }
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", init);
