// === State ===
let tasks = [];
let nextId = 1;
let currentFilter = "all"; // "all" | "active" | "completed"

// === DOM References ===
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskListEl = document.getElementById("task-list");
const taskCountEl = document.getElementById("task-count");
const clearCompletedBtn = document.getElementById("clear-completed-btn");
const filterBtns = document.querySelectorAll(".filter-btn");
const toastContainer = document.getElementById("toast-container");

// === Toast Notification System ===
function showToast(message, duration = 3000) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("removing");
    toast.addEventListener("animationend", () => toast.remove());
  }, duration);
}

// === Agent Highlight ===
function highlightTask(taskId) {
  const row = taskListEl.querySelector(`[data-id="${taskId}"]`);
  if (!row) return;
  row.classList.remove("agent-highlight");
  // Force reflow so re-adding the class restarts the animation
  void row.offsetWidth;
  row.classList.add("agent-highlight");
}

// === Core App Logic ===
function addTask(text) {
  const task = { id: nextId++, text: text.trim(), completed: false };
  tasks.push(task);
  render();
  return task;
}

function toggleTask(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.completed = !task.completed;
  render();
  return task;
}

function setTaskStatus(id, completed) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.completed = completed;
  render();
  return task;
}

function editTask(id, newText) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return null;
  task.text = newText.trim();
  render();
  return task;
}

function deleteTask(id) {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const removed = tasks.splice(idx, 1)[0];
  render();
  return removed;
}

function clearCompleted() {
  const cleared = tasks.filter((t) => t.completed);
  tasks = tasks.filter((t) => !t.completed);
  render();
  return cleared;
}

function setFilter(filter) {
  currentFilter = filter;
  filterBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.filter === filter);
  });
  render();
}

function getVisibleTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

// === Rendering ===
function render() {
  const visible = getVisibleTasks();
  taskListEl.innerHTML = "";

  visible.forEach((task) => {
    const li = document.createElement("li");
    li.className = "task-item" + (task.completed ? " completed" : "");
    li.dataset.id = task.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = task.completed;
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const textSpan = document.createElement("span");
    textSpan.className = "task-text";
    textSpan.textContent = task.text;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editBtn = document.createElement("button");
    editBtn.textContent = "\u270F\uFE0F";
    editBtn.title = "Edit";
    editBtn.addEventListener("click", () => startInlineEdit(task.id));

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "\uD83D\uDDD1\uFE0F";
    deleteBtn.title = "Delete";
    deleteBtn.addEventListener("click", () => deleteTask(task.id));

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    li.appendChild(checkbox);
    li.appendChild(textSpan);
    li.appendChild(actions);
    taskListEl.appendChild(li);
  });

  const activeCount = tasks.filter((t) => !t.completed).length;
  taskCountEl.textContent = `${activeCount} task${activeCount !== 1 ? "s" : ""} remaining`;
}

function startInlineEdit(id) {
  const task = tasks.find((t) => t.id === id);
  if (!task) return;

  const li = taskListEl.querySelector(`[data-id="${id}"]`);
  if (!li) return;

  const textSpan = li.querySelector(".task-text");
  const input = document.createElement("input");
  input.type = "text";
  input.className = "task-text-input";
  input.value = task.text;

  const commit = () => {
    const val = input.value.trim();
    if (val && val !== task.text) {
      editTask(id, val);
    } else {
      render(); // revert
    }
  };

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") render();
  });
  input.addEventListener("blur", commit);

  textSpan.replaceWith(input);
  input.focus();
  input.select();
}

// === Manual UI Event Listeners ===
addBtn.addEventListener("click", () => {
  const text = taskInput.value.trim();
  if (text) {
    addTask(text);
    taskInput.value = "";
    taskInput.focus();
  }
});

taskInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addBtn.click();
});

filterBtns.forEach((btn) => {
  btn.addEventListener("click", () => setFilter(btn.dataset.filter));
});

clearCompletedBtn.addEventListener("click", () => clearCompleted());

// === Initial Render ===
render();

// ============================================================
// === WebMCP Tool Registration ===
// ============================================================
window.addEventListener("load", () => {
  if (!("modelContext" in navigator)) return;

  navigator.modelContext.provideContext({
    tools: [
      // --- 1. get_tasks ---
      {
        name: "get_tasks",
        description:
          "Returns the full list of tasks with their IDs, text, and completion status. Use this to inspect current state before making changes.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        execute: () => {
          if (tasks.length === 0) {
            return JSON.stringify({
              success: true,
              message: "No tasks exist yet.",
              new_state: { tasks: [], current_filter: currentFilter },
            });
          }
          return JSON.stringify({
            success: true,
            message: `Found ${tasks.length} task(s).`,
            new_state: { tasks: tasks, current_filter: currentFilter },
          });
        },
      },

      // --- 2. add_task ---
      {
        name: "add_task",
        description:
          "Creates a new task with the given text. The task starts as active (not completed). Returns the created task.",
        inputSchema: {
          type: "object",
          properties: {
            text: {
              type: "string",
              description: "The text description of the task to create.",
            },
          },
          required: ["text"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
        execute: ({ text }) => {
          if (!text || !text.trim()) {
            return JSON.stringify({
              success: false,
              error: "Task text cannot be empty.",
            });
          }
          const task = addTask(text);
          highlightTask(task.id);
          showToast(`\uD83E\uDD16 Agent added a task: '${task.text}'`);
          return JSON.stringify({
            success: true,
            message: `Added task: "${task.text}" (ID: ${task.id}).`,
            new_state: { created_task: task, total_tasks: tasks.length },
          });
        },
      },

      // --- 3. update_task_status ---
      {
        name: "update_task_status",
        description:
          "Marks a specific task as complete or pending by its ID. Use get_tasks first to find the correct ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The unique ID of the task to update.",
            },
            completed: {
              type: "boolean",
              description:
                "Set to true to mark the task as completed, or false to mark it as pending/active.",
            },
          },
          required: ["id", "completed"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        execute: ({ id, completed }) => {
          const task = setTaskStatus(id, completed);
          if (!task) {
            return JSON.stringify({
              success: false,
              error: `No task found with ID ${id}. Use get_tasks to see available tasks.`,
            });
          }
          highlightTask(task.id);
          const status = completed ? "completed" : "active";
          showToast(
            `\uD83E\uDD16 Agent marked '${task.text}' as ${status}`
          );
          return JSON.stringify({
            success: true,
            message: `Task ${id} ("${task.text}") is now ${status}.`,
            new_state: { updated_task: task },
          });
        },
      },

      // --- 4. edit_task_text ---
      {
        name: "edit_task_text",
        description:
          "Modifies the text content of an existing task by its ID. Use get_tasks first to find the correct ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The unique ID of the task to edit.",
            },
            new_text: {
              type: "string",
              description: "The new text content for the task.",
            },
          },
          required: ["id", "new_text"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        execute: ({ id, new_text }) => {
          if (!new_text || !new_text.trim()) {
            return JSON.stringify({
              success: false,
              error: "New task text cannot be empty.",
            });
          }
          const task = editTask(id, new_text);
          if (!task) {
            return JSON.stringify({
              success: false,
              error: `No task found with ID ${id}. Use get_tasks to see available tasks.`,
            });
          }
          highlightTask(task.id);
          showToast(
            `\uD83E\uDD16 Agent edited task: '${task.text}'`
          );
          return JSON.stringify({
            success: true,
            message: `Task ${id} text updated to "${task.text}".`,
            new_state: { updated_task: task },
          });
        },
      },

      // --- 5. delete_task ---
      {
        name: "delete_task",
        description:
          "Permanently removes a task by its ID. This cannot be undone. Use get_tasks first to find the correct ID.",
        inputSchema: {
          type: "object",
          properties: {
            id: {
              type: "number",
              description: "The unique ID of the task to delete.",
            },
          },
          required: ["id"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: false,
          openWorldHint: false,
        },
        execute: ({ id }) => {
          const removed = deleteTask(id);
          if (!removed) {
            return JSON.stringify({
              success: false,
              error: `No task found with ID ${id}. Use get_tasks to see available tasks.`,
            });
          }
          showToast(
            `\uD83E\uDD16 Agent deleted task: '${removed.text}'`
          );
          return JSON.stringify({
            success: true,
            message: `Deleted task ${id} ("${removed.text}").`,
            new_state: { deleted_task: removed, remaining_tasks: tasks.length },
          });
        },
      },

      // --- 6. clear_completed_tasks ---
      {
        name: "clear_completed_tasks",
        description:
          "Removes all tasks that are currently marked as completed. Returns the list of removed tasks.",
        inputSchema: {
          type: "object",
          properties: {},
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
        execute: () => {
          const cleared = clearCompleted();
          if (cleared.length === 0) {
            return JSON.stringify({
              success: true,
              message: "No completed tasks to clear.",
              new_state: { cleared_tasks: [], remaining_tasks: tasks.length },
            });
          }
          showToast(
            `\uD83E\uDD16 Agent cleared ${cleared.length} completed task(s)`
          );
          return JSON.stringify({
            success: true,
            message: `Cleared ${cleared.length} completed task(s).`,
            new_state: {
              cleared_tasks: cleared,
              remaining_tasks: tasks.length,
            },
          });
        },
      },

      // --- 7. set_ui_filter ---
      {
        name: "set_ui_filter",
        description:
          'Changes the current view filter to show "all", "active", or "completed" tasks.',
        inputSchema: {
          type: "object",
          properties: {
            filter: {
              type: "string",
              enum: ["all", "active", "completed"],
              description:
                'The filter to apply: "all" shows every task, "active" shows only pending tasks, "completed" shows only finished tasks.',
            },
          },
          required: ["filter"],
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
        execute: ({ filter }) => {
          const validFilters = ["all", "active", "completed"];
          if (!validFilters.includes(filter)) {
            return JSON.stringify({
              success: false,
              error: `Invalid filter "${filter}". Must be one of: ${validFilters.join(", ")}.`,
            });
          }
          setFilter(filter);
          const visibleCount = getVisibleTasks().length;
          showToast(
            `\uD83E\uDD16 Agent set filter to '${filter}'`
          );
          return JSON.stringify({
            success: true,
            message: `Filter set to "${filter}". Showing ${visibleCount} task(s).`,
            new_state: {
              current_filter: filter,
              visible_task_count: visibleCount,
            },
          });
        },
      },
    ],
  });
});
