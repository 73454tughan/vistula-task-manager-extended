// Minimal vanilla JavaScript client for Supabase REST API

let config = null;
let categories = [];
let tasks = [];

const categoryForm = document.getElementById("categoryForm");
const categoryNameInput = document.getElementById("categoryName");
const categoryList = document.getElementById("categoryList");

const taskForm = document.getElementById("taskForm");
const taskFormTitle = document.getElementById("taskFormTitle");
const editTaskIdInput = document.getElementById("editTaskId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescInput = document.getElementById("taskDescription");
const taskCategorySelect = document.getElementById("taskCategory");
const saveTaskBtn = document.getElementById("saveTaskBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const filterCategorySelect = document.getElementById("filterCategory");
const filterStatusSelect = document.getElementById("filterStatus");
const taskList = document.getElementById("taskList");
const statusMsg = document.getElementById("statusMsg");

// Single helper for all Supabase REST API calls
async function supabaseFetch(endpoint, method = "GET", body = null) {
  const headers = {
    "apikey": config.supabaseAnonKey,
    "Content-Type": "application/json",
    "Prefer": "return=representation"
  };
  if (config.supabaseAnonKey && config.supabaseAnonKey.startsWith("eyJ")) {
    headers["Authorization"] = "Bearer " + config.supabaseAnonKey;
  }

  const options = {
    method: method,
    headers: headers
  };
  if (body !== null) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(config.supabaseUrl + "/rest/v1/" + endpoint, options);
  const text = await response.text();
  if (!response.ok) {
    throw new Error("Supabase error (" + response.status + "): " + text);
  }
  return text ? JSON.parse(text) : null;
}

// 1. Load categories: GET /categories?select=*
async function loadCategories() {
  categories = await supabaseFetch("categories?select=*&order=id.asc");
  renderCategories();
}

// 2. Create category: POST /categories
async function addCategory(event) {
  event.preventDefault();
  const name = categoryNameInput.value.trim();
  if (!name) return;

  await supabaseFetch("categories", "POST", { name: name });
  categoryNameInput.value = "";
  await loadCategories();
}

// 3. Load tasks with category name and optional filters:
//    GET /tasks?select=*,categories(name)
//    GET /tasks?category_id=eq.1
//    GET /tasks?completed=eq.false
async function loadTasks() {
  let query = "tasks?select=*,categories(name)";
  const selectedCategory = filterCategorySelect.value;
  const selectedStatus = filterStatusSelect.value;

  if (selectedCategory !== "all") {
    query += "&category_id=eq." + encodeURIComponent(selectedCategory);
  }
  if (selectedStatus !== "all") {
    query += "&completed=eq." + encodeURIComponent(selectedStatus);
  }
  query += "&order=id.asc";

  tasks = await supabaseFetch(query);
  renderTasks();
}

// 4. Create or Update task:
//    POST /tasks  OR  PATCH /tasks?id=eq.<id>
async function saveTask(event) {
  event.preventDefault();
  const title = taskTitleInput.value.trim();
  const description = taskDescInput.value.trim();
  const categoryId = Number(taskCategorySelect.value);
  const editId = editTaskIdInput.value;

  if (!title || !categoryId) return;

  const payload = {
    title: title,
    description: description,
    category_id: categoryId
  };

  if (editId) {
    await supabaseFetch("tasks?id=eq." + editId, "PATCH", payload);
    resetTaskForm();
  } else {
    await supabaseFetch("tasks", "POST", payload);
    taskForm.reset();
  }
  await loadTasks();
}

// 5. Toggle task completion: PATCH /tasks?id=eq.<id>
async function toggleTask(id, currentCompleted) {
  await supabaseFetch("tasks?id=eq." + id, "PATCH", {
    completed: !currentCompleted
  });
  await loadTasks();
}

// 6. Delete task: DELETE /tasks?id=eq.<id>
async function deleteTask(id) {
  await supabaseFetch("tasks?id=eq." + id, "DELETE");
  if (editTaskIdInput.value === String(id)) {
    resetTaskForm();
  }
  await loadTasks();
}

function startEditTask(task) {
  editTaskIdInput.value = task.id;
  taskTitleInput.value = task.title;
  taskDescInput.value = task.description || "";
  taskCategorySelect.value = String(task.category_id);
  taskFormTitle.textContent = "Edit Task #" + task.id;
  saveTaskBtn.textContent = "Save Changes";
  cancelEditBtn.classList.remove("hidden");
}

function resetTaskForm() {
  editTaskIdInput.value = "";
  taskForm.reset();
  taskFormTitle.textContent = "Add New Task";
  saveTaskBtn.textContent = "Add Task";
  cancelEditBtn.classList.add("hidden");
}

function renderCategories() {
  const prevFilter = filterCategorySelect.value;
  categoryList.innerHTML = "";
  taskCategorySelect.innerHTML = "";
  filterCategorySelect.innerHTML = '<option value="all">All Categories</option>';

  for (const cat of categories) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = cat.name;
    categoryList.appendChild(chip);

    const opt1 = document.createElement("option");
    opt1.value = String(cat.id);
    opt1.textContent = cat.name;
    taskCategorySelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = String(cat.id);
    opt2.textContent = cat.name;
    filterCategorySelect.appendChild(opt2);
  }

  if (prevFilter && [...filterCategorySelect.options].some(o => o.value === prevFilter)) {
    filterCategorySelect.value = prevFilter;
  }
}

function renderTasks() {
  taskList.innerHTML = "";
  if (tasks.length === 0) {
    taskList.innerHTML = "<li>No tasks found.</li>";
    return;
  }

  for (const task of tasks) {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " done" : "");

    const info = document.createElement("div");
    const titleSpan = document.createElement("span");
    titleSpan.className = "task-title";
    titleSpan.textContent = task.title;

    const badge = document.createElement("span");
    badge.className = "badge";
    badge.textContent = task.categories ? task.categories.name : "No category";

    info.appendChild(titleSpan);
    info.appendChild(badge);

    if (task.description) {
      const desc = document.createElement("div");
      desc.className = "task-desc";
      desc.textContent = task.description;
      info.appendChild(desc);
    }

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.textContent = task.completed ? "Undo" : "Complete";
    toggleBtn.addEventListener("click", () => handleAction(() => toggleTask(task.id, task.completed)));

    const editBtn = document.createElement("button");
    editBtn.type = "button";
    editBtn.className = "secondary";
    editBtn.textContent = "Edit";
    editBtn.addEventListener("click", () => startEditTask(task));

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "danger";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => handleAction(() => deleteTask(task.id)));

    actions.append(toggleBtn, editBtn, delBtn);
    li.append(info, actions);
    taskList.appendChild(li);
  }
}

async function handleAction(fn) {
  statusMsg.textContent = "";
  try {
    await fn();
  } catch (err) {
    statusMsg.textContent = err.message;
  }
}

async function init() {
  try {
    const res = await fetch("./config.json");
    config = await res.json();
    await loadCategories();
    await loadTasks();
  } catch (err) {
    statusMsg.textContent = "Failed to initialize: " + err.message;
  }
}

categoryForm.addEventListener("submit", (e) => handleAction(() => addCategory(e)));
taskForm.addEventListener("submit", (e) => handleAction(() => saveTask(e)));
cancelEditBtn.addEventListener("click", resetTaskForm);
filterCategorySelect.addEventListener("change", () => handleAction(loadTasks));
filterStatusSelect.addEventListener("change", () => handleAction(loadTasks));

init();
