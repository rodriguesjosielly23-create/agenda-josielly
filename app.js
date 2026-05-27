const storageKey = "agenda-josielly-v2";
const oldStorageKey = "agenda-josielly-v1";
const photoKey = "agenda-josielly-photo";
const defaultPhoto = "./app-icon-512.png";
const themeKey = "agenda-josielly-theme";
const nameKey = "agenda-josielly-name";
const managementKey = "agenda-josielly-management";
const supabaseUrl = "https://hbgzstzoqkrgzdiqqome.supabase.co";
const supabaseKey = "sb_publishable_9NmOWScYrvZMrjgBxVMGIg_c-5-F2Ms";
const columns = ["today", "week", "follow", "done"];
const priorityLabels = { low: "Leve", medium: "Importante", high: "Urgente" };
const repeatLabels = {
  none: "Não repete",
  weekdays: "Todos os dias",
  weekly: "Semanal",
  monthly: "Mensal"
};
const workdayStartMinutes = 9 * 60;
const workdayEndMinutes = 18 * 60;
const workdayMinutes = workdayEndMinutes - workdayStartMinutes;

const state = {
  tasks: loadTasks(),
  management: loadManagement(),
  filter: "",
  routineFilter: "",
  taskSearchOpen: false,
  dayView: "today",
  draggingId: null,
  selectedDate: localDateISO(),
  calendarDate: new Date(),
  activeAttachments: [],
  overdueSelection: new Set()
};

const els = {
  todayLabel: document.querySelector("#todayLabel"),
  clockLabel: document.querySelector("#clockLabel"),
  clockDateLabel: document.querySelector("#clockDateLabel"),
  ownerName: document.querySelector("#ownerName"),
  profilePhoto: document.querySelector("#profilePhoto"),
  photoStage: document.querySelector(".photo-stage"),
  photoInput: document.querySelector("#photoInput"),
  themeToggle: document.querySelector("#themeToggle"),
  taskDialog: document.querySelector("#taskDialog"),
  taskForm: document.querySelector("#taskForm"),
  dialogTitle: document.querySelector("#dialogTitle"),
  taskId: document.querySelector("#taskId"),
  titleInput: document.querySelector("#titleInput"),
  dateInput: document.querySelector("#dateInput"),
  timeInput: document.querySelector("#timeInput"),
  durationInput: document.querySelector("#durationInput"),
  customDurationWrap: document.querySelector("#customDurationWrap"),
  customDurationInput: document.querySelector("#customDurationInput"),
  showAvailabilityBtn: document.querySelector("#showAvailabilityBtn"),
  availabilityPanel: document.querySelector("#availabilityPanel"),
  availabilityTitle: document.querySelector("#availabilityTitle"),
  occupiedSlots: document.querySelector("#occupiedSlots"),
  freeSlots: document.querySelector("#freeSlots"),
  closeAvailabilityBtn: document.querySelector("#closeAvailabilityBtn"),
  scheduleAlert: document.querySelector("#scheduleAlert"),
  categoryInput: document.querySelector("#categoryInput"),
  priorityInput: document.querySelector("#priorityInput"),
  repeatInput: document.querySelector("#repeatInput"),
  repeatUntilInput: document.querySelector("#repeatUntilInput"),
  notesInput: document.querySelector("#notesInput"),
  attachmentInput: document.querySelector("#attachmentInput"),
  pasteZone: document.querySelector("#pasteZone"),
  attachmentList: document.querySelector("#attachmentList"),
  doneInput: document.querySelector("#doneInput"),
  deleteTaskBtn: document.querySelector("#deleteTaskBtn"),
  searchInput: document.querySelector("#searchInput"),
  futureTasks: document.querySelector("#futureTasks"),
  todayTasks: document.querySelector("#todayTasks"),
  tomorrowTasks: document.querySelector("#tomorrowTasks"),
  weeklyTasks: document.querySelector("#weeklyTasks"),
  monthlyTasks: document.querySelector("#monthlyTasks"),
  summaryTodayCount: document.querySelector("#summaryTodayCount"),
  summaryFreeTime: document.querySelector("#summaryFreeTime"),
  summaryUsage: document.querySelector("#summaryUsage"),
  exportBtn: document.querySelector("#exportBtn"),
  icsInput: document.querySelector("#icsInput"),
  googleBtn: document.querySelector("#googleBtn"),
  outlookBtn: document.querySelector("#outlookBtn"),
  calendarTitle: document.querySelector("#calendarTitle"),
  calendarGrid: document.querySelector("#calendarGrid"),
  selectedDateTitle: document.querySelector("#selectedDateTitle"),
  dayList: document.querySelector("#dayList"),
  prevMonthBtn: document.querySelector("#prevMonthBtn"),
  nextMonthBtn: document.querySelector("#nextMonthBtn"),
  clearDateBtn: document.querySelector("#clearDateBtn"),
  dayViewButtons: [...document.querySelectorAll(".view-tabs button")],
  routineForm: document.querySelector("#routineForm"),
  routineId: document.querySelector("#routineId"),
  routineTitle: document.querySelector("#routineTitle"),
  routineStatus: document.querySelector("#routineStatus"),
  routineBody: document.querySelector("#routineBody"),
  routineSearch: document.querySelector("#routineSearch"),
  routineCount: document.querySelector("#routineCount"),
  routineList: document.querySelector("#routineList"),
  clearRoutineBtn: document.querySelector("#clearRoutineBtn"),
  overdueCount: document.querySelector("#overdueCount"),
  overdueBulkActions: document.querySelector("#overdueBulkActions"),
  selectAllOverdue: document.querySelector("#selectAllOverdue"),
  selectedOverdueCount: document.querySelector("#selectedOverdueCount"),
  finishSelectedOverdue: document.querySelector("#finishSelectedOverdue"),
  deleteSelectedOverdue: document.querySelector("#deleteSelectedOverdue"),
  attentionCount: document.querySelector("#attentionCount"),
  attentionList: document.querySelector("#attentionList"),
  taskSearchInput: document.querySelector("#taskSearchInput"),
  taskSearchList: document.querySelector("#taskSearchList")
};

function loadTasks() {
  const saved = localStorage.getItem(storageKey) || localStorage.getItem(oldStorageKey);
  if (saved) {
    return JSON.parse(saved).map((task) => ({
      account: "Gmail pessoal",
      ...task
    }));
  }
  return [];
}

function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(state.tasks));
  syncTasksToCloud();
}

function loadManagement() {
  const saved = localStorage.getItem(managementKey);
  if (!saved) return { routines: [] };
  const parsed = JSON.parse(saved);
  if (Array.isArray(parsed.routines)) {
    return {
      routines: parsed.routines.map((record) => ({
        status: "Em andamento",
        ...record
      }))
    };
  }

  const migrated = [
    ...(parsed.daily || []).map((record) => ({
      ...record,
      body: record.body || "",
      title: record.title || "Rotina diária",
      status: record.status || "Em andamento"
    })),
    ...(parsed.monthly || []).map((record) => ({
      ...record,
      body: record.body || "",
      title: record.title || "Rotina mensal",
      status: record.status || "Em andamento"
    }))
  ];
  return { routines: migrated };
}

function saveManagement() {
  localStorage.setItem(managementKey, JSON.stringify(state.management));
  syncRoutinesToCloud();
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!response.ok) {
    throw new Error(`Supabase ${response.status}`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function taskToRow(task) {
  return {
    id: task.id,
    title: task.title,
    date: task.date || null,
    time: task.time || null,
    duration: Number(task.duration || 30),
    category: task.category || "Pessoal",
    priority: task.priority || "low",
    repeat: task.repeat || "none",
    repeat_until: task.repeatUntil || null,
    notes: task.notes || "",
    status: task.status || (task.done ? "done" : "today"),
    completed: Boolean(task.done),
    attachments: task.attachments || [],
    created_at: new Date(task.createdAt || Date.now()).toISOString(),
    updated_at: new Date().toISOString()
  };
}

function rowToTask(row) {
  return {
    id: row.id,
    title: row.title,
    date: row.date || localDateISO(),
    time: row.time || "",
    duration: Number(row.duration || 30),
    account: "Agenda online",
    category: row.category || "Pessoal",
    priority: row.priority || "low",
    repeat: row.repeat || "none",
    repeatUntil: row.repeat_until || "",
    notes: row.notes || "",
    status: row.status || (row.completed ? "done" : "today"),
    done: Boolean(row.completed),
    attachments: Array.isArray(row.attachments) ? row.attachments : [],
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now()
  };
}

function routineToRow(record) {
  return {
    id: record.id,
    type: "mensal",
    title: record.title,
    description: record.body || "",
    status: record.status || "Em andamento",
    created_at: new Date(record.createdAt || Date.now()).toISOString(),
    updated_at: new Date(record.updatedAt || Date.now()).toISOString()
  };
}

function rowToRoutine(row) {
  return {
    id: row.id,
    title: row.title,
    body: row.description || "",
    status: row.status || "Em andamento",
    createdAt: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
    updatedAt: row.updated_at ? new Date(row.updated_at).getTime() : Date.now()
  };
}

async function loadCloudData() {
  try {
    const [tasks, routines] = await Promise.all([
      supabaseRequest("commitments?select=*&order=date.asc,time.asc"),
      supabaseRequest("routines?select=*&order=updated_at.desc")
    ]);

    if (Array.isArray(tasks) && tasks.length) {
      state.tasks = tasks.map(rowToTask);
      localStorage.setItem(storageKey, JSON.stringify(state.tasks));
    } else if (state.tasks.length) {
      syncTasksToCloud();
    }

    if (Array.isArray(routines) && routines.length) {
      state.management.routines = routines.map(rowToRoutine);
      localStorage.setItem(managementKey, JSON.stringify(state.management));
    } else if (state.management.routines.length) {
      syncRoutinesToCloud();
    }

    render();
  } catch (error) {
    console.warn("Agenda online indisponivel. Usando dados locais.", error);
  }
}

async function syncTasksToCloud() {
  if (!navigator.onLine || !state.tasks.length) return;
  try {
    await supabaseRequest("commitments?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(state.tasks.map(taskToRow))
    });
  } catch (error) {
    console.warn("Nao foi possivel sincronizar compromissos.", error);
  }
}

async function syncRoutinesToCloud() {
  const routines = state.management.routines;
  if (!navigator.onLine || !routines.length) return;
  try {
    await supabaseRequest("routines?on_conflict=id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates" },
      body: JSON.stringify(routines.map(routineToRow))
    });
  } catch (error) {
    console.warn("Nao foi possivel sincronizar demandas.", error);
  }
}

async function deleteCloudRecord(table, id) {
  if (!navigator.onLine || !id) return;
  try {
    await supabaseRequest(`${table}?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE"
    });
  } catch (error) {
    console.warn("Nao foi possivel excluir na nuvem.", error);
  }
}

function localDateISO(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDate(value, style = "short") {
  if (!value) return "Sem data";
  const date = new Date(`${value}T00:00:00`);
  if (style === "long") {
    return date.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  }
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function getSmartStatus(task) {
  if (task.done || task.status === "done") return "done";
  if (task.status === "follow") return "follow";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cardDate = new Date(`${task.date}T00:00:00`);
  const diff = Math.round((cardDate - today) / 86400000);
  return diff <= 0 ? "today" : "week";
}

function visibleTasks() {
  const query = state.filter.trim().toLowerCase();
  return state.tasks.filter((task) => {
    const text = `${task.title} ${task.account} ${task.category} ${task.notes}`.toLowerCase();
    return text.includes(query);
  });
}

function render() {
  renderClock();
  renderBoard();
  renderCalendar();
  renderDayList();
  renderManagement();
  renderAttention();
  renderTaskSearch();
  renderMetrics();
}

function renderMetrics() {
  const today = localDateISO();
  const tomorrow = localDateISO(addDays(new Date(), 1));
  const todayTasks = state.tasks.filter((task) => task.date === today && !task.done);
  const todayOpen = todayTasks.length;
  const committedMinutes = todayTasks.reduce((total, task) => total + Number(task.duration || 30), 0);
  const freeMinutes = Math.max(0, workdayMinutes - committedMinutes);
  const dayUsage = Math.min(100, Math.round((committedMinutes / workdayMinutes) * 100));
  els.futureTasks.textContent = state.tasks.filter((task) => !task.done && (task.date > today || task.repeat !== "none")).length;
  els.todayTasks.textContent = todayOpen;
  els.tomorrowTasks.textContent = state.tasks.filter((task) => task.date === tomorrow && !task.done).length;
  els.weeklyTasks.textContent = state.tasks.filter((task) => !task.done && task.repeat === "weekly").length;
  els.monthlyTasks.textContent = state.tasks.filter((task) => !task.done && task.repeat === "monthly").length;
  els.summaryTodayCount.textContent = `${todayOpen} ${todayOpen === 1 ? "compromisso" : "compromissos"}`;
  els.summaryFreeTime.textContent = `${formatMinutes(freeMinutes)} livres`;
  els.summaryUsage.textContent = `${dayUsage}% do dia`;
}

function renderClock() {
  const now = new Date();
  els.clockLabel.textContent = now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  els.clockDateLabel.textContent = now.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
}

function formatMinutes(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

function renderBoard() {
  const filtered = visibleTasks();

  columns.forEach((status) => {
    const container = document.querySelector(`#${status}`);
    const tasks = filtered.filter((task) => getSmartStatus(task) === status);
    container.innerHTML = "";
    tasks.forEach((task) => container.appendChild(createCard(task)));

    if (!tasks.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Sem itens";
      container.appendChild(empty);
    }

    document.querySelector(`#count-${status}`).textContent = tasks.length;
  });
}

function renderCalendar() {
  const year = state.calendarDate.getFullYear();
  const month = state.calendarDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const start = new Date(firstDay);
  start.setDate(firstDay.getDate() - firstDay.getDay());

  els.calendarTitle.textContent = firstDay.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  els.calendarGrid.innerHTML = "";

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const iso = localDateISO(date);
    const dayTasks = state.tasks.filter((task) => task.date === iso);
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      "day-cell",
      date.getMonth() !== month ? "is-muted" : "",
      iso === localDateISO() ? "is-today" : "",
      iso === state.selectedDate ? "is-selected" : ""
    ].filter(Boolean).join(" ");
    button.innerHTML = `
      <span class="day-number">${date.getDate()}</span>
      <span class="day-dots">${dayTasks.slice(0, 4).map(() => "<i class=\"day-dot\"></i>").join("")}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedDate = iso;
      state.calendarDate = new Date(`${iso}T00:00:00`);
      state.dayView = "date";
      render();
    });
    els.calendarGrid.appendChild(button);
  }
}

function renderDayList() {
  const range = getDayViewRange();
  const tasks = visibleTasks()
    .filter((task) => task.date >= range.start && task.date <= range.end && !task.done)
    .sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  els.selectedDateTitle.textContent = range.label;
  updateDayViewTabs();
  els.dayList.innerHTML = "";

  if (!tasks.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nenhum compromisso neste dia";
    els.dayList.appendChild(empty);
    return;
  }

  tasks.forEach((task) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "day-item";
    const endTime = task.time ? addMinutesToTime(task.time, Number(task.duration || 30)) : "";
    item.innerHTML = `
      <span class="day-time">
        <strong>${task.time || "--:--"}</strong>
        <small>${endTime || formatDate(task.date)}</small>
      </span>
      <span class="day-dot-large ${priorityDotClass(task.priority)}"></span>
      <span class="day-info">
        <strong>${escapeHtml(task.title)}</strong>
        <small>${escapeHtml(task.notes || task.category)}${task.repeat && task.repeat !== "none" ? ` · ${repeatLabels[task.repeat]}` : ""}</small>
      </span>
      <span class="day-icon">${categoryIcon(task.category)}</span>
      <span class="day-more">...</span>
    `;
    item.addEventListener("click", () => openTask(task.id));
    els.dayList.appendChild(item);
  });
}

function getDayViewRange() {
  const today = localDateISO();
  if (state.dayView === "tomorrow") {
    const tomorrow = localDateISO(addDays(new Date(), 1));
    return { start: tomorrow, end: tomorrow, label: "amanhã" };
  }
  if (state.dayView === "week") {
    return { start: today, end: localDateISO(addDays(new Date(), 6)), label: "próximos 7 dias" };
  }
  if (state.dayView === "date") {
    return { start: state.selectedDate, end: state.selectedDate, label: formatDate(state.selectedDate, "long") };
  }
  return { start: today, end: today, label: "hoje" };
}

function updateDayViewTabs() {
  els.dayViewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === state.dayView);
  });
}

function addMinutesToTime(time, minutes) {
  const [hours, mins] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, mins + minutes, 0, 0);
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function priorityDotClass(priority) {
  return {
    high: "is-hot",
    medium: "is-mid",
    low: "is-cool"
  }[priority] || "is-mid";
}

function categoryIcon(category) {
  return {
    Trabalho: "▥",
    Pessoal: "♡",
    Saúde: "+",
    Família: "☻",
    Financeiro: "▥"
  }[category] || "▥";
}

function renderManagement() {
  renderRoutineList();
}

function renderRoutineList() {
  const query = state.routineFilter.trim().toLowerCase();
  const records = [...state.management.routines]
    .filter((record) => {
      const text = `${record.title} ${record.body}`.toLowerCase();
      return text.includes(query);
    })
    .sort((a, b) => Number(b.updatedAt || b.createdAt || 0) - Number(a.updatedAt || a.createdAt || 0));
  els.routineList.innerHTML = "";
  els.routineCount.textContent = state.management.routines.length;

  if (!records.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = query ? "Nenhuma rotina encontrada" : "Nenhuma rotina cadastrada";
    els.routineList.appendChild(empty);
    return;
  }

  records.forEach((record) => {
    const card = document.createElement("article");
    card.className = "management-card";
    card.innerHTML = `
      <div class="management-card-top">
        <h4>${escapeHtml(record.title)}</h4>
        <div class="management-actions">
          <button class="tiny-btn edit-management" type="button">Editar</button>
          <button class="tiny-btn is-danger delete-management" type="button">Excluir</button>
        </div>
      </div>
      <div class="management-tags">
        <span class="management-date">Acompanhamento da demanda</span>
        <span class="status-badge ${statusClass(record.status)}">${escapeHtml(record.status || "Em andamento")}</span>
      </div>
      <p>${escapeHtml(record.body)}</p>
    `;
    card.querySelector(".edit-management").addEventListener("click", () => editManagement(record.id));
    card.querySelector(".delete-management").addEventListener("click", () => removeManagement(record.id));
    els.routineList.appendChild(card);
  });
}

function renderAttention() {
  const today = localDateISO();
  const tomorrow = localDateISO(addDays(new Date(), 1));
  const overdueAlerts = state.tasks
    .filter((task) => !task.done && task.date && task.date < today)
    .sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")))
    .map((task) => ({
      id: task.id,
      kind: task.repeat === "weekdays" ? "Diário" : task.repeat === "monthly" ? "Mensal" : "Atrasado",
      repeat: task.repeat || "none",
      title: task.title,
      detail: `Venceu em ${formatDate(task.date)}${task.time ? ` · ${task.time}` : ""}`,
      overdue: true,
      action: () => openTask(task.id)
    }));
  const taskAlerts = state.tasks
    .filter((task) => !task.done && (task.date === today || task.date === tomorrow))
    .sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")))
    .map((task) => ({
      kind: task.date === today ? "Hoje" : "Amanhã",
      title: task.title,
      detail: `${formatDate(task.date)}${task.time ? ` · ${task.time}` : ""}`,
      action: () => openTask(task.id)
    }));

  const demandAlerts = state.management.routines
    .filter((record) => ["Pendente", "Aguardando retorno"].includes(record.status))
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0))
    .map((record) => ({
      kind: record.status,
      title: record.title,
      detail: record.body,
      action: () => editManagement(record.id)
    }));

  const alerts = [...overdueAlerts, ...taskAlerts, ...demandAlerts];
  const overdueIds = new Set(overdueAlerts.map((item) => item.id));
  state.overdueSelection = new Set([...state.overdueSelection].filter((id) => overdueIds.has(id)));
  els.overdueCount.textContent = `${overdueAlerts.length} ${overdueAlerts.length === 1 ? "atrasado" : "atrasados"}`;
  els.overdueCount.classList.toggle("has-overdue", overdueAlerts.length > 0);
  updateOverdueBulkActions(overdueAlerts);
  els.attentionList.innerHTML = "";

  if (!alerts.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nada crítico para olhar agora";
    els.attentionList.appendChild(empty);
    return;
  }

  renderAttentionGroup("Atrasados diários", overdueAlerts.filter((item) => item.repeat === "weekdays"));
  renderAttentionGroup("Atrasados mensais", overdueAlerts.filter((item) => item.repeat === "monthly"));
  renderAttentionGroup("Atrasados semanais", overdueAlerts.filter((item) => item.repeat === "weekly"));
  renderAttentionGroup("Atrasados pontuais", overdueAlerts.filter((item) => item.repeat === "none"));
  renderAttentionGroup("Hoje, amanhã e demandas", [...taskAlerts, ...demandAlerts]);
}

function renderAttentionGroup(title, items) {
  if (!items.length) return;
  const group = document.createElement("section");
  group.className = "attention-group";
  group.innerHTML = `
    <div class="attention-group-head">
      <h3>${escapeHtml(title)}</h3>
      <span>${items.length}</span>
    </div>
    <div class="attention-group-list"></div>
  `;
  const list = group.querySelector(".attention-group-list");
  items.forEach((item) => list.appendChild(createAttentionItem(item)));
  els.attentionList.appendChild(group);
}

function createAttentionItem(item) {
  const itemElement = document.createElement("article");
  const selected = item.overdue && state.overdueSelection.has(item.id);
  itemElement.className = `attention-item${item.overdue ? " is-overdue" : ""}${selected ? " is-selected" : ""}`;
  itemElement.innerHTML = `
    ${item.overdue ? `<label class="attention-select" title="Selecionar">
      <input type="checkbox" ${selected ? "checked" : ""} />
      <span aria-hidden="true"></span>
    </label>` : ""}
    <button class="attention-open" type="button">
      <span class="status-badge${item.overdue ? " is-pending" : ""}">${escapeHtml(item.kind)}</span>
      <strong>${escapeHtml(item.title)}</strong>
      <small>${escapeHtml(item.detail)}</small>
    </button>
    ${item.overdue ? '<button class="finish-overdue" type="button" aria-label="Finalizar compromisso" title="Finalizar">✓</button>' : ""}
  `;
  if (item.overdue) {
    itemElement.querySelector(".attention-select input").addEventListener("change", (event) => {
      if (event.target.checked) {
        state.overdueSelection.add(item.id);
      } else {
        state.overdueSelection.delete(item.id);
      }
      renderAttention();
    });
  }
  itemElement.querySelector(".attention-open").addEventListener("click", item.action);
  if (item.overdue) {
    itemElement.querySelector(".finish-overdue").addEventListener("click", () => {
      finishOverdueTask(item.id);
    });
  }
  return itemElement;
}

function getOverdueTasks() {
  const today = localDateISO();
  return state.tasks.filter((task) => !task.done && task.date && task.date < today);
}

function updateOverdueBulkActions(overdueItems = []) {
  const total = overdueItems.length;
  const selected = state.overdueSelection.size;
  els.overdueBulkActions.hidden = total === 0;
  els.selectedOverdueCount.textContent = `${selected} ${selected === 1 ? "selecionado" : "selecionados"}`;
  els.finishSelectedOverdue.disabled = selected === 0;
  els.deleteSelectedOverdue.disabled = selected === 0;
  els.selectAllOverdue.checked = total > 0 && selected === total;
  els.selectAllOverdue.indeterminate = selected > 0 && selected < total;
}

function finishOverdueTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  if (!task) return;
  task.done = true;
  task.status = "done";
  saveTasks();
  render();
  document.querySelector('.column[data-status="done"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function finishSelectedOverdueTasks() {
  if (!state.overdueSelection.size) return;
  state.tasks.forEach((task) => {
    if (state.overdueSelection.has(task.id)) {
      task.done = true;
      task.status = "done";
    }
  });
  state.overdueSelection.clear();
  saveTasks();
  render();
  document.querySelector('.column[data-status="done"]')?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteSelectedOverdueTasks() {
  const selected = [...state.overdueSelection];
  if (!selected.length) return;
  if (!window.confirm(`Excluir ${selected.length} compromisso(s) selecionado(s)?`)) return;
  selected.forEach((id) => deleteCloudRecord("commitments", id));
  state.tasks = state.tasks.filter((task) => !state.overdueSelection.has(task.id));
  state.overdueSelection.clear();
  saveTasks();
  render();
}

function renderTaskSearch() {
  const query = els.taskSearchInput.value.trim().toLowerCase();
  els.taskSearchList.innerHTML = "";

  if (!query) {
    return;
  }

  const results = state.tasks
    .filter((task) => {
      return task.title.toLowerCase().includes(query);
    })
    .sort((a, b) => a.title.localeCompare(b.title, "pt-BR"))
    .reduce((unique, task) => {
      const key = task.title.trim().toLowerCase();
      if (!unique.some((item) => item.title.trim().toLowerCase() === key)) {
        unique.push(findBestTaskByTitle(task.title));
      }
      return unique;
    }, [])
    .slice(0, 80);

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "task-title-empty";
    empty.textContent = query ? "Nenhum compromisso encontrado" : "Nenhum compromisso criado ainda";
    els.taskSearchList.appendChild(empty);
    return;
  }

  results.forEach((task) => {
    const item = document.createElement("div");
    item.className = "task-title-option";
    item.innerHTML = `
      <strong>${escapeHtml(task.title)}</strong>
      <span class="status-badge ${taskMomentClass(task)}">${escapeHtml(taskMoment(task))}</span>
      <small>${formatDate(task.date)}${task.time ? ` · ${task.time}` : ""} · ${escapeHtml(task.category)}${task.repeat && task.repeat !== "none" ? ` · ${repeatLabels[task.repeat]}` : ""}</small>
      ${task.notes ? `<p>${escapeHtml(task.notes)}</p>` : ""}
    `;
    els.taskSearchList.appendChild(item);
  });
}

function findBestTaskByTitle(title) {
  const today = localDateISO();
  const sameTitle = state.tasks
    .filter((task) => task.title.trim().toLowerCase() === title.trim().toLowerCase())
    .sort((a, b) => (a.date + (a.time || "99:99")).localeCompare(b.date + (b.time || "99:99")));
  return sameTitle.find((task) => !task.done && task.date >= today)
    || sameTitle.find((task) => !task.done)
    || sameTitle[0];
}

function taskMoment(task) {
  if (task.done) return "Finalizado";
  const today = localDateISO();
  const tomorrow = localDateISO(addDays(new Date(), 1));
  if (task.date === today) return "Hoje";
  if (task.date === tomorrow) return "Amanhã";
  if (task.repeat && task.repeat !== "none") return "Recorrente";
  if (task.date > today) return "Futuro";
  return "Atrasado";
}

function taskMomentClass(task) {
  const moment = taskMoment(task);
  return {
    Hoje: "is-progress",
    Amanhã: "is-waiting",
    Recorrente: "is-progress",
    Futuro: "is-waiting",
    Finalizado: "is-done",
    Atrasado: "is-pending"
  }[moment] || "is-progress";
}

function upsertManagement() {
  const id = els.routineId.value || crypto.randomUUID();
  const existing = state.management.routines.find((record) => record.id === id);
  const record = {
    id,
    title: els.routineTitle.value.trim(),
    status: els.routineStatus.value,
    body: els.routineBody.value.trim(),
    updatedAt: Date.now(),
    createdAt: existing?.createdAt || Date.now()
  };

  if (existing) {
    Object.assign(existing, record);
  } else {
    state.management.routines.unshift(record);
  }

  saveManagement();
  clearManagementForm();
  renderManagement();
}

function editManagement(id) {
  const record = state.management.routines.find((item) => item.id === id);
  if (!record) return;
  els.routineId.value = record.id;
  els.routineTitle.value = record.title;
  els.routineStatus.value = record.status || "Em andamento";
  els.routineBody.value = record.body;
  els.routineTitle.focus();
}

function removeManagement(id) {
  state.management.routines = state.management.routines.filter((record) => record.id !== id);
  deleteCloudRecord("routines", id);
  saveManagement();
  renderManagement();
}

function clearManagementForm() {
  els.routineForm.reset();
  els.routineId.value = "";
}

function statusClass(status) {
  return {
    "Em andamento": "is-progress",
    "Aguardando retorno": "is-waiting",
    "Pendente": "is-pending",
    "Concluído": "is-done"
  }[status] || "is-progress";
}

function createCard(task) {
  const card = document.createElement("article");
  card.className = "card";
  card.draggable = true;
  card.dataset.id = task.id;
  card.tabIndex = 0;

  const priorityClass = `priority-${task.priority || "low"}`;
  card.innerHTML = `
    <div class="card-top">
      <h3>${escapeHtml(task.title)}</h3>
      <button class="icon-btn edit-card" type="button" aria-label="Editar">✎</button>
    </div>
    <div class="card-meta">
      <span>${formatDate(task.date)}${task.time ? ` · ${task.time}` : ""} · ${formatMinutes(Number(task.duration || 30))}</span>
      <span class="pill">${escapeHtml(task.account || "Gmail pessoal")}</span>
      <span class="pill">${escapeHtml(task.category)}</span>
      <span class="pill ${priorityClass}">${priorityLabels[task.priority] || "Leve"}</span>
      ${task.repeat && task.repeat !== "none" ? `<span class="pill">${repeatLabels[task.repeat]}</span>` : ""}
    </div>
    ${task.notes ? `<p class="notes">${escapeHtml(task.notes)}</p>` : ""}
    <div class="card-actions">
      <label class="done-check">
        <input type="checkbox" ${task.done ? "checked" : ""} />
        Finalizado
      </label>
      <button class="icon-btn delete-card" type="button" aria-label="Excluir">×</button>
    </div>
  `;

  card.addEventListener("click", (event) => {
    if (event.target.closest("button") || event.target.closest("label")) return;
    openTask(task.id);
  });
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter") openTask(task.id);
  });
  card.addEventListener("dragstart", () => {
    state.draggingId = task.id;
    card.classList.add("dragging");
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));
  card.querySelector(".edit-card").addEventListener("click", () => openTask(task.id));
  card.querySelector(".delete-card").addEventListener("click", () => removeTask(task.id));
  card.querySelector("input[type='checkbox']").addEventListener("change", (event) => {
    task.done = event.target.checked;
    task.status = task.done ? "done" : "today";
    saveTasks();
    render();
  });

  return card;
}

function openTask(id) {
  const task = state.tasks.find((item) => item.id === id);
  els.taskForm.reset();
  state.activeAttachments = [...(task?.attachments || [])];
  els.scheduleAlert.textContent = "";
  els.taskId.value = task?.id || "";
  els.dialogTitle.textContent = task ? "Editar compromisso" : "Novo compromisso";
  els.deleteTaskBtn.hidden = !task;
  els.titleInput.value = task?.title || "";
  els.dateInput.value = task?.date || state.selectedDate || localDateISO();
  els.timeInput.value = task?.time || "";
  setDurationFields(Number(task?.duration || 30));
  els.categoryInput.value = task?.category || "Pessoal";
  els.priorityInput.value = task?.priority || "low";
  els.repeatInput.value = task?.repeat || "none";
  els.repeatUntilInput.value = task?.repeatUntil || "";
  els.notesInput.value = task?.notes || "";
  els.doneInput.checked = Boolean(task?.done);
  els.availabilityPanel.hidden = true;
  renderAttachments();
  els.taskDialog.showModal();
}

function setDurationFields(duration) {
  const presetValues = ["15", "30", "45", "60", "90", "120", "150", "180", "240"];
  const value = String(duration || 30);
  const isCustom = !presetValues.includes(value);
  els.durationInput.value = isCustom ? "custom" : value;
  els.customDurationInput.value = value;
  els.customDurationWrap.hidden = !isCustom;
}

function getSelectedDuration() {
  if (els.durationInput.value === "custom") {
    return Math.min(720, Math.max(5, Number(els.customDurationInput.value) || 30));
  }
  return Number(els.durationInput.value || 30);
}

function upsertTask() {
  const id = els.taskId.value || crypto.randomUUID();
  const existing = state.tasks.find((task) => task.id === id);
  const repeat = els.repeatInput.value;
  const repeatUntil = els.repeatUntilInput.value;
  const task = {
    id,
    title: els.titleInput.value.trim(),
    date: els.dateInput.value,
    time: els.timeInput.value,
    duration: getSelectedDuration(),
    account: existing?.account || "Gmail pessoal",
    category: els.categoryInput.value,
    priority: els.priorityInput.value,
    repeat,
    repeatUntil,
    attachments: [...state.activeAttachments],
    seriesId: existing?.seriesId || (repeat === "none" ? "" : crypto.randomUUID()),
    notes: els.notesInput.value.trim(),
    done: els.doneInput.checked,
    status: els.doneInput.checked ? "done" : existing?.status || "today",
    createdAt: existing?.createdAt || Date.now()
  };
  const occurrences = existing ? [task] : expandRecurringTask(task);
  const conflict = findScheduleConflict(occurrences, id);

  if (conflict) {
    els.scheduleAlert.textContent = `Já existe agendamento nesse período: ${conflict.title} em ${formatDate(conflict.date)} das ${conflict.time || "--:--"} às ${addMinutesToTime(conflict.time || "00:00", Number(conflict.duration || 30))}.`;
    return;
  }

  if (existing) {
    Object.assign(existing, task);
  } else {
    state.tasks.unshift(...occurrences);
  }

  state.selectedDate = task.date;
  state.calendarDate = new Date(`${task.date}T00:00:00`);
  saveTasks();
  render();
  els.taskDialog.close();
}

function findScheduleConflict(candidates, editingId = "") {
  return candidates
    .filter((task) => task.time)
    .map((task) => {
      const candidateStart = timeToMinutes(task.time);
      const candidateEnd = candidateStart + Number(task.duration || 30);
      return state.tasks.find((existing) => {
        if (existing.id === editingId || !existing.time || existing.done || existing.date !== task.date) return false;
        const existingStart = timeToMinutes(existing.time);
        const existingEnd = existingStart + Number(existing.duration || 30);
        return candidateStart < existingEnd && candidateEnd > existingStart;
      });
    })
    .find(Boolean);
}

function showAvailability() {
  renderAvailability();
  els.availabilityPanel.hidden = false;
}

function renderAvailability() {
  const date = els.dateInput.value || state.selectedDate || localDateISO();
  const editingId = els.taskId.value;
  const appointments = state.tasks
    .filter((task) => !task.done && task.date === date && task.time && task.id !== editingId)
    .sort((a, b) => a.time.localeCompare(b.time));

  els.availabilityTitle.textContent = formatDate(date, "long");
  els.occupiedSlots.innerHTML = "";
  els.freeSlots.innerHTML = "";

  if (!appointments.length) {
    els.occupiedSlots.innerHTML = '<p class="slot-empty">Nenhum horário ocupado</p>';
  } else {
    appointments.forEach((task) => {
      const item = document.createElement("div");
      item.className = "occupied-slot";
      item.innerHTML = `
        <strong>${escapeHtml(task.time)} - ${escapeHtml(addMinutesToTime(task.time, Number(task.duration || 30)))}</strong>
        <span>${escapeHtml(task.title)}</span>
      `;
      els.occupiedSlots.appendChild(item);
    });
  }

  const freeRanges = findAvailableRanges(appointments);
  if (!freeRanges.length) {
    els.freeSlots.innerHTML = '<p class="slot-empty">Sem intervalos livres entre 09:00 e 18:00</p>';
    return;
  }

  const requestedDuration = getSelectedDuration();
  freeRanges.forEach((range) => {
    const button = document.createElement("button");
    const fitsDuration = range.end - range.start >= requestedDuration;
    button.className = `free-slot${fitsDuration ? "" : " is-too-short"}`;
    button.type = "button";
    button.disabled = !fitsDuration;
    button.innerHTML = `
      <strong>${minutesToTime(range.start)} - ${minutesToTime(range.end)}</strong>
      <span>${fitsDuration ? `${formatMinutes(range.end - range.start)} livres` : "Intervalo menor que a duração"}</span>
    `;
    button.addEventListener("click", () => {
      els.timeInput.value = minutesToTime(range.start);
      validateDraftSchedule();
    });
    els.freeSlots.appendChild(button);
  });
}

function findAvailableRanges(appointments) {
  const ranges = [];
  let cursor = workdayStartMinutes;
  appointments.forEach((task) => {
    const start = timeToMinutes(task.time);
    const end = start + Number(task.duration || 30);
    if (end <= workdayStartMinutes || start >= workdayEndMinutes) return;
    const boundedStart = Math.max(workdayStartMinutes, start);
    const boundedEnd = Math.min(workdayEndMinutes, end);
    if (boundedStart > cursor) ranges.push({ start: cursor, end: boundedStart });
    cursor = Math.max(cursor, boundedEnd);
  });
  if (cursor < workdayEndMinutes) ranges.push({ start: cursor, end: workdayEndMinutes });
  return ranges;
}

function minutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function validateDraftSchedule() {
  if (!els.dateInput.value || !els.timeInput.value) {
    els.scheduleAlert.textContent = "";
    return;
  }
  const candidate = {
    date: els.dateInput.value,
    time: els.timeInput.value,
    duration: getSelectedDuration()
  };
  const conflict = findScheduleConflict([candidate], els.taskId.value);
  els.scheduleAlert.textContent = conflict
    ? `Horário indisponível: ${conflict.title} já está marcado das ${conflict.time} às ${addMinutesToTime(conflict.time, Number(conflict.duration || 30))}. Escolha um horário livre.`
    : "";
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function renderAttachments() {
  els.attachmentList.innerHTML = "";
  if (!state.activeAttachments.length) {
    const empty = document.createElement("div");
    empty.className = "attachment-empty";
    empty.textContent = "Nenhum anexo";
    els.attachmentList.appendChild(empty);
    return;
  }

  state.activeAttachments.forEach((file) => {
    const item = document.createElement("div");
    item.className = "attachment-item";
    item.innerHTML = `
      ${file.type?.startsWith("image/") ? `<img src="${file.data}" alt="${escapeHtml(file.name)}" />` : `<span class="file-icon">📎</span>`}
      <a href="${file.data}" download="${escapeHtml(file.name)}">${escapeHtml(file.name)}</a>
      <button type="button" aria-label="Remover anexo">×</button>
    `;
    item.querySelector("button").addEventListener("click", () => {
      state.activeAttachments = state.activeAttachments.filter((attachment) => attachment.id !== file.id);
      renderAttachments();
    });
    els.attachmentList.appendChild(item);
  });
}

function addAttachment(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      state.activeAttachments.push({
        id: crypto.randomUUID(),
        name: file.name || `print-${new Date().toISOString().slice(0, 10)}.png`,
        type: file.type || "application/octet-stream",
        data: reader.result,
        createdAt: Date.now()
      });
      resolve();
    };
    reader.readAsDataURL(file);
  });
}

function expandRecurringTask(task) {
  if (task.repeat === "none") return [task];

  const start = new Date(`${task.date}T00:00:00`);
  const end = new Date(`${task.repeatUntil || addMonths(start, 3)}T00:00:00`);
  if (Number.isNaN(end.getTime()) || end < start) return [task];

  if (task.repeat === "monthly") {
    return expandMonthlyTask(task, start, end);
  }

  const dates = [];
  const current = new Date(start);

  while (current <= end) {
    if (task.repeat === "weekdays") {
      dates.push(localDateISO(current));
      current.setDate(current.getDate() + 1);
      continue;
    }

    dates.push(localDateISO(current));

    if (task.repeat === "weekly") {
      current.setDate(current.getDate() + 7);
      continue;
    }

    break;
  }

  return dates.map((date, index) => ({
    ...task,
    id: index === 0 ? task.id : crypto.randomUUID(),
    date,
    createdAt: Date.now() + index
  }));
}

function expandMonthlyTask(task, start, end) {
  const dates = [];
  const targetDay = start.getDate();
  let monthOffset = 0;

  while (monthOffset < 240) {
    const candidate = new Date(start.getFullYear(), start.getMonth() + monthOffset, 1);
    const lastDay = new Date(candidate.getFullYear(), candidate.getMonth() + 1, 0).getDate();
    candidate.setDate(Math.min(targetDay, lastDay));
    if (candidate > end) break;
    dates.push(localDateISO(candidate));
    monthOffset += 1;
  }

  return dates.map((date, index) => ({
    ...task,
    id: index === 0 ? task.id : crypto.randomUUID(),
    date,
    createdAt: Date.now() + index
  }));
}

function addMonths(date, amount) {
  const copy = new Date(date);
  copy.setMonth(copy.getMonth() + amount);
  return localDateISO(copy);
}

function addDays(date, amount) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + amount);
  return copy;
}

function removeTask(id) {
  state.tasks = state.tasks.filter((task) => task.id !== id);
  deleteCloudRecord("commitments", id);
  saveTasks();
  render();
  if (els.taskDialog.open) els.taskDialog.close();
}

function exportIcs() {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Agenda Josielly//PT-BR"];
  state.tasks.filter((task) => !task.done).forEach((task) => {
    const start = `${task.date.replaceAll("-", "")}T${(task.time || "0900").replace(":", "")}00`;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${task.id}@agenda-josielly`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
      `DTSTART:${start}`,
      `SUMMARY:${escapeIcs(task.title)}`,
      `DESCRIPTION:${escapeIcs(`${task.account || ""} - ${task.notes || task.category}`)}`,
      "END:VEVENT"
    );
  });
  lines.push("END:VCALENDAR");

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "agenda-josielly.ics";
  link.click();
  URL.revokeObjectURL(link.href);
}

function importIcs(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const events = String(reader.result).split("BEGIN:VEVENT").slice(1);
    events.forEach((eventText) => {
      const summary = readIcsField(eventText, "SUMMARY") || "Compromisso importado";
      const description = readIcsField(eventText, "DESCRIPTION") || "";
      const dtStart = readIcsField(eventText, "DTSTART") || "";
      const date = dtStart.slice(0, 8);
      const time = dtStart.includes("T") ? `${dtStart.slice(9, 11)}:${dtStart.slice(11, 13)}` : "";
      state.tasks.unshift({
        id: crypto.randomUUID(),
        title: summary,
        date: date ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : localDateISO(),
        time,
        duration: 30,
        account: "Gmail pessoal",
        category: "Pessoal",
        priority: "medium",
        notes: description,
        status: "today",
        done: false,
        createdAt: Date.now()
      });
    });
    saveTasks();
    render();
  };
  reader.readAsText(file);
}

function openCalendar(target) {
  const task = state.tasks.find((item) => item.date === state.selectedDate && !item.done)
    || state.tasks.find((item) => !item.done)
    || state.tasks[0];
  const title = encodeURIComponent(task?.title || "Compromisso Josielly");
  const details = encodeURIComponent(task?.notes || "");
  const date = (task?.date || localDateISO()).replaceAll("-", "");
  const time = (task?.time || "09:00").replace(":", "");
  const start = `${date}T${time}00`;
  const endHour = String(Math.min(Number(time.slice(0, 2)) + 1, 23)).padStart(2, "0");
  const end = `${date}T${endHour}${time.slice(2)}00`;
  const outlookStart = `${task?.date || localDateISO()}T${task?.time || "09:00"}`;
  const url = target === "google"
    ? `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}`
    : `https://outlook.office.com/calendar/0/deeplink/compose?subject=${title}&startdt=${outlookStart}&body=${details}`;
  window.open(url, "_blank", "noopener");
}

function setTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(themeKey, theme);
  const isDark = theme === "dark";
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeIcs(value) {
  return String(value).replaceAll("\\", "\\\\").replaceAll(",", "\\,").replaceAll(";", "\\;").replace(/\n/g, "\\n");
}

function readIcsField(text, field) {
  const line = text.split(/\r?\n/).find((item) => item.startsWith(`${field}:`) || item.startsWith(`${field};`));
  if (!line) return "";
  return line.slice(line.indexOf(":") + 1).replaceAll("\\n", "\n").replaceAll("\\,", ",").replaceAll("\\;", ";");
}

document.querySelectorAll(".column").forEach((column) => {
  column.addEventListener("dragover", (event) => event.preventDefault());
  column.addEventListener("drop", () => {
    const task = state.tasks.find((item) => item.id === state.draggingId);
    if (!task) return;
    task.status = column.dataset.status;
    task.done = column.dataset.status === "done";
    saveTasks();
    render();
  });
});

els.todayLabel.textContent = new Date().toLocaleDateString("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long"
});

els.ownerName.textContent = localStorage.getItem(nameKey) || "JOSIELLY";
els.ownerName.addEventListener("blur", () => {
  const name = els.ownerName.textContent.trim() || "JOSIELLY";
  els.ownerName.textContent = name;
  localStorage.setItem(nameKey, name);
});
els.ownerName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    els.ownerName.blur();
  }
});

const savedPhoto = localStorage.getItem(photoKey);
if (savedPhoto) {
  els.profilePhoto.src = savedPhoto;
  els.photoStage.classList.add("has-photo");
} else {
  els.profilePhoto.src = defaultPhoto;
  els.photoStage.classList.add("has-photo");
}

els.photoInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    localStorage.setItem(photoKey, reader.result);
    els.profilePhoto.src = reader.result;
    els.photoStage.classList.add("has-photo");
  };
  reader.readAsDataURL(file);
});

document.querySelector("#newTaskBtn").addEventListener("click", () => openTask());
document.querySelector("#closeDialogBtn").addEventListener("click", () => els.taskDialog.close());
document.querySelector("#cancelBtn").addEventListener("click", () => els.taskDialog.close());
els.showAvailabilityBtn.addEventListener("click", showAvailability);
els.closeAvailabilityBtn.addEventListener("click", () => {
  els.availabilityPanel.hidden = true;
});
els.timeInput.addEventListener("focus", showAvailability);
els.timeInput.addEventListener("change", validateDraftSchedule);
els.dateInput.addEventListener("change", () => {
  if (!els.availabilityPanel.hidden) renderAvailability();
  validateDraftSchedule();
});
els.durationInput.addEventListener("change", () => {
  const isCustom = els.durationInput.value === "custom";
  els.customDurationWrap.hidden = !isCustom;
  if (isCustom) els.customDurationInput.focus();
  if (!els.availabilityPanel.hidden) renderAvailability();
  validateDraftSchedule();
});
els.customDurationInput.addEventListener("input", () => {
  if (!els.availabilityPanel.hidden) renderAvailability();
  validateDraftSchedule();
});
els.deleteTaskBtn.addEventListener("click", () => removeTask(els.taskId.value));
els.taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertTask();
});
els.attachmentInput.addEventListener("change", async (event) => {
  const files = [...(event.target.files || [])];
  for (const file of files) {
    await addAttachment(file);
  }
  event.target.value = "";
  renderAttachments();
});
els.pasteZone.addEventListener("paste", async (event) => {
  const files = [...event.clipboardData.items]
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter(Boolean);
  if (!files.length) return;
  event.preventDefault();
  for (const file of files) {
    await addAttachment(file);
  }
  renderAttachments();
});
els.searchInput.addEventListener("input", (event) => {
  state.filter = event.target.value;
  render();
});
els.exportBtn.addEventListener("click", exportIcs);
els.icsInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) importIcs(file);
  event.target.value = "";
});
els.googleBtn.addEventListener("click", () => openCalendar("google"));
els.outlookBtn.addEventListener("click", () => openCalendar("outlook"));
els.prevMonthBtn.addEventListener("click", () => {
  state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() - 1, 1);
  renderCalendar();
});
els.nextMonthBtn.addEventListener("click", () => {
  state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + 1, 1);
  renderCalendar();
});
els.clearDateBtn.addEventListener("click", () => {
  state.selectedDate = localDateISO();
  state.calendarDate = new Date();
  state.dayView = "week";
  render();
});
els.dayViewButtons.forEach((button) => {
  button.addEventListener("click", () => {
    state.dayView = button.dataset.view;
    state.selectedDate = state.dayView === "tomorrow" ? localDateISO(addDays(new Date(), 1)) : localDateISO();
    state.calendarDate = new Date(`${state.selectedDate}T00:00:00`);
    render();
  });
});
els.themeToggle.addEventListener("click", () => {
  setTheme(document.body.dataset.theme === "dark" ? "light" : "dark");
});
els.routineForm.addEventListener("submit", (event) => {
  event.preventDefault();
  upsertManagement();
});
els.routineSearch.addEventListener("input", (event) => {
  state.routineFilter = event.target.value;
  renderManagement();
});
els.selectAllOverdue.addEventListener("change", (event) => {
  const overdueTasks = getOverdueTasks();
  state.overdueSelection = event.target.checked
    ? new Set(overdueTasks.map((task) => task.id))
    : new Set();
  renderAttention();
});
els.finishSelectedOverdue.addEventListener("click", finishSelectedOverdueTasks);
els.deleteSelectedOverdue.addEventListener("click", deleteSelectedOverdueTasks);
els.taskSearchInput.addEventListener("focus", () => {
  state.taskSearchOpen = true;
  renderTaskSearch();
});
els.taskSearchInput.addEventListener("input", () => {
  state.taskSearchOpen = true;
  renderTaskSearch();
});
els.taskSearchInput.addEventListener("blur", () => {
  setTimeout(() => {
    state.taskSearchOpen = false;
    renderTaskSearch();
  }, 120);
});
els.clearRoutineBtn.addEventListener("click", clearManagementForm);

setTheme(localStorage.getItem(themeKey) || "dark");
setInterval(renderClock, 30000);

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((registrations) => registrations.forEach((registration) => registration.unregister()))
    .catch(() => {});
}

render();
loadCloudData();
