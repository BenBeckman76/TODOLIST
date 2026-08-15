// TaskFlow app state and behavior.
// This file manages storage, rendering, filters, sorting, task actions, and theme control.

const STORAGE_KEY = 'taskflow.tasks';
const validCategories = ['Work', 'Study', 'Health', 'Personal'];

const defaultTasks = [
  {
    id: crypto.randomUUID(),
    title: 'Complete portfolio website',
    dueDate: '2025-05-20',
    category: 'Work',
    completed: false,
    important: true,
    createdAt: Date.now() - 3600000,
    expanded: false,
    subtasks: [
      { id: crypto.randomUUID(), title: 'Write README', done: false },
      { id: crypto.randomUUID(), title: 'Deploy preview', done: true },
      { id: crypto.randomUUID(), title: 'Test on mobile', done: false },
    ],
  },
  {
    id: crypto.randomUUID(),
    title: 'Study JavaScript concepts',
    dueDate: '2025-05-18',
    category: 'Study',
    completed: false,
    important: false,
    createdAt: Date.now() - 7200000,
    expanded: false,
    subtasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: 'Go to the gym',
    dueDate: '2025-05-17',
    category: 'Health',
    completed: false,
    important: false,
    createdAt: Date.now() - 10800000,
    expanded: false,
    subtasks: [],
  },
  {
    id: crypto.randomUUID(),
    title: 'Buy groceries',
    dueDate: '2025-05-16',
    category: 'Personal',
    completed: true,
    important: true,
    createdAt: Date.now() - 14400000,
    expanded: false,
    subtasks: [{ id: crypto.randomUUID(), title: 'Pick up milk', done: true }],
  },
  {
    id: crypto.randomUUID(),
    title: 'Read 20 pages of a book',
    dueDate: '2025-05-15',
    category: 'Study',
    completed: true,
    important: false,
    createdAt: Date.now() - 18000000,
    expanded: false,
    subtasks: [],
  },
];

const taskTitleInput = document.getElementById('task-title');
const taskDateInput = document.getElementById('task-date');
const taskCategorySelect = document.getElementById('task-category');
const addTaskButton = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const sortSelect = document.getElementById('sort-select');
const categoryList = document.getElementById('category-list');
const searchInput = document.getElementById('task-search');
const editModal = document.getElementById('task-modal');
const editForm = document.getElementById('task-edit-form');
const editTaskTitleInput = document.getElementById('edit-task-title-input');
const editTaskDateInput = document.getElementById('edit-task-date-input');
const editTaskCategoryInput = document.getElementById('edit-task-category-input');

let tasks = loadTasks();
let selectedFilter = 'All';
let selectedSort = 'date-added';
let searchTerm = '';
let editingTaskId = null;
let completingTaskId = null;
let draggedTaskId = null;

// Storage helpers

function normalizeTask(task) {
  const normalizedSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks.map((subtask) => ({
        id: subtask.id || crypto.randomUUID(),
        title: String(subtask.title || '').trim(),
        done: Boolean(subtask.done),
      }))
    : [];

  return {
    id: task.id || crypto.randomUUID(),
    title: String(task.title || '').trim() || 'Untitled task',
    dueDate: task.dueDate || '',
    category: validCategories.includes(task.category) ? task.category : 'Work',
    completed: Boolean(task.completed),
    important: Boolean(task.important),
    createdAt: Number(task.createdAt || Date.now()),
    expanded: Boolean(task.expanded),
    subtasks: normalizedSubtasks.filter((subtask) => subtask.title),
  };
}

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!Array.isArray(saved) || !saved.length) {
      return defaultTasks.map(normalizeTask);
    }
    return saved.map(normalizeTask);
  } catch (error) {
    console.warn('Unable to load tasks from localStorage:', error);
    return defaultTasks.map(normalizeTask);
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

// Utility helpers

function formatDate(dateString) {
  if (!dateString) return 'No date';

  const date = new Date(`${dateString}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function isOverdue(task) {
  if (!task.dueDate || task.completed) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(`${task.dueDate}T00:00:00`);

  return dueDate < today;
}

function getCounts() {
  return {
    all: tasks.length,
    pending: tasks.filter((task) => !task.completed).length,
    completed: tasks.filter((task) => task.completed).length,
    important: tasks.filter((task) => task.important).length,
  };
}

function sortTasks(items) {
  return [...items].sort((a, b) => {
    const aOverdue = isOverdue(a) ? 1 : 0;
    const bOverdue = isOverdue(b) ? 1 : 0;

    if (aOverdue !== bOverdue) {
      return bOverdue - aOverdue;
    }

    switch (selectedSort) {
      case 'due-date':
        return new Date(a.dueDate || '9999-12-31') - new Date(b.dueDate || '9999-12-31');
      case 'importance':
        return Number(b.important) - Number(a.important);
      case 'date-added':
      default:
        return (b.createdAt || 0) - (a.createdAt || 0);
    }
  });
}

function getFilteredTasks() {
  let filtered = [...tasks];

  if (searchTerm) {
    filtered = filtered.filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }

  switch (selectedFilter) {
    case 'Pending':
      filtered = filtered.filter((task) => !task.completed);
      break;
    case 'Completed':
      filtered = filtered.filter((task) => task.completed);
      break;
    case 'Important':
      filtered = filtered.filter((task) => task.important);
      break;
    default:
      break;
  }

  if (selectedSort === 'manual') {
    return filtered;
  }

  return sortTasks(filtered);
}

function renderStats() {
  const counts = getCounts();

  document.getElementById('count-all').textContent = counts.all;
  document.getElementById('count-pending').textContent = counts.pending;
  document.getElementById('count-completed').textContent = counts.completed;
  document.getElementById('count-important').textContent = counts.important;

  document.getElementById('stat-total').textContent = counts.all;
  document.getElementById('stat-pending').textContent = counts.pending;
  document.getElementById('stat-completed').textContent = counts.completed;
  document.getElementById('stat-important').textContent = counts.important;
}

function renderCategorySelection() {
  categoryList.querySelectorAll('.category-item').forEach((item) => {
    item.classList.toggle('active', item.dataset.filter === selectedFilter);
  });
}

function getEmptyStateContent() {
  const messages = {
    All: { icon: '✨', text: 'No tasks yet — add your first task!' },
    Pending: { icon: '⏳', text: 'No pending tasks — you’re all caught up!' },
    Completed: { icon: '✅', text: 'No completed tasks yet — finish something!' },
    Important: { icon: '📌', text: 'No important tasks yet — mark one as priority!' },
  };

  return messages[selectedFilter] || messages.All;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function reorderTasks(taskId, targetId) {
  if (!taskId || !targetId || taskId === targetId) return;

  const draggedIndex = tasks.findIndex((task) => task.id === taskId);
  const targetIndex = tasks.findIndex((task) => task.id === targetId);

  if (draggedIndex === -1 || targetIndex === -1) return;

  const updatedTasks = [...tasks];
  const [movedTask] = updatedTasks.splice(draggedIndex, 1);
  updatedTasks.splice(targetIndex, 0, movedTask);

  tasks = updatedTasks;
  selectedSort = 'manual';
  sortSelect.value = 'manual';
  saveTasks();
  renderTasks();
}

function moveTask(taskId, direction) {
  const currentIndex = tasks.findIndex((task) => task.id === taskId);
  if (currentIndex === -1) return;

  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= tasks.length) return;

  const updatedTasks = [...tasks];
  const [movedItem] = updatedTasks.splice(currentIndex, 1);
  updatedTasks.splice(targetIndex, 0, movedItem);

  tasks = updatedTasks;
  selectedSort = 'manual';
  sortSelect.value = 'manual';
  saveTasks();
  renderTasks();
}

// Subtask helpers

function toggleSubtaskPanel(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, expanded: !task.expanded } : task,
  );
  saveTasks();
  renderTasks();
}

function addSubtask(taskId, rawValue) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  const text = String(rawValue || '').trim();
  if (!text) return;

  task.subtasks = task.subtasks || [];
  task.subtasks.push({
    id: crypto.randomUUID(),
    title: text,
    done: false,
  });
  task.expanded = true;

  saveTasks();
  renderTasks();
}

function toggleSubtask(taskId, subtaskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;

    return {
      ...task,
      subtasks: (task.subtasks || []).map((subtask) =>
        subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
      ),
    };
  });

  saveTasks();
  renderTasks();
}

function deleteSubtask(taskId, subtaskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) return task;

    return {
      ...task,
      subtasks: (task.subtasks || []).filter((subtask) => subtask.id !== subtaskId),
    };
  });

  saveTasks();
  renderTasks();
}

// Render tasks

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  if (!filteredTasks.length) {
    const emptyState = getEmptyStateContent();
    taskList.innerHTML = `
      <li class="empty-state">
        <div class="empty-icon">${emptyState.icon}</div>
        <p>${emptyState.text}</p>
      </li>
    `;
    renderStats();
    renderCategorySelection();
    return;
  }

  taskList.innerHTML = filteredTasks
    .map((task) => {
      const overdue = isOverdue(task) && !task.completed;
      const overdueMarkup = overdue ? '<span class="overdue-badge">Overdue</span>' : '';
      const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
      const completedSubtasks = subtasks.filter((subtask) => subtask.done).length;
      const subtaskSummary = subtasks.length
        ? `${completedSubtasks}/${subtasks.length} subtasks done`
        : 'No subtasks';
      const expanded = Boolean(task.expanded);
      const dragEnabled = selectedSort === 'manual';

      const subtaskMarkup = expanded
        ? `
          <div class="subtask-panel">
            ${subtasks.length
              ? `<ul class="subtask-list">${subtasks
                  .map(
                    (subtask) => `
                      <li class="subtask-item ${subtask.done ? 'done' : ''}">
                        <button
                          type="button"
                          class="subtask-check"
                          data-action="toggle-subtask"
                          data-id="${task.id}"
                          data-subtask-id="${subtask.id}"
                          aria-label="Toggle subtask"
                        ></button>
                        <span class="subtask-text">${escapeHtml(subtask.title)}</span>
                        <button
                          type="button"
                          class="subtask-delete"
                          data-action="delete-subtask"
                          data-id="${task.id}"
                          data-subtask-id="${subtask.id}"
                          aria-label="Delete subtask"
                        >
                          ×
                        </button>
                      </li>
                    `,
                  )
                  .join('')}
                </ul>`
              : '<div class="subtask-empty">No subtasks yet.</div>'}

            <div class="subtask-form">
              <input
                type="text"
                class="subtask-input"
                data-subtask-input="${task.id}"
                placeholder="Add subtask"
                aria-label="Add subtask"
              />
              <button type="button" class="subtask-add" data-action="add-subtask" data-id="${task.id}">
                Add
              </button>
            </div>
          </div>
        `
        : '';

      return `
        <li
          class="task-item ${task.completed ? 'completed' : ''} ${completingTaskId === task.id ? 'animating' : ''}"
          data-id="${task.id}"
          draggable="${dragEnabled}"
        >
          <div class="task-main">
            <button class="task-checkbox" type="button" aria-label="Toggle completion" data-action="toggle-complete" data-id="${task.id}"></button>

            <div class="task-content">
              <span class="task-title">${escapeHtml(task.title)}</span>
              <div class="task-meta">
                <span class="task-date-pill ${overdue ? 'overdue' : ''}">
                  ${formatDate(task.dueDate)}
                  ${overdueMarkup}
                </span>
                <span class="task-tag ${task.category.toLowerCase()}">${task.category}</span>
              </div>

              <div class="task-subtasks ${expanded ? 'open' : ''}">
                <button class="subtask-toggle" type="button" data-action="toggle-subtasks" data-id="${task.id}">
                  <span>${expanded ? 'Hide subtasks' : 'Add subtask'}</span>
                  <span class="subtask-progress">${subtaskSummary}</span>
                </button>
                ${subtaskMarkup}
              </div>
            </div>
          </div>

          <div class="task-actions">
            <div class="task-move-group" aria-label="Reorder task">
              <button class="task-move" type="button" data-action="move-up" data-id="${task.id}" aria-label="Move task up">↑</button>
              <button class="task-move" type="button" data-action="move-down" data-id="${task.id}" aria-label="Move task down">↓</button>
            </div>

            <button
              class="task-star ${task.important ? 'filled' : ''}"
              type="button"
              data-action="toggle-important"
              data-id="${task.id}"
              aria-label="Toggle important"
            >
              ${task.important ? '★' : '☆'}
            </button>

            <div class="task-menu-wrap">
              <button class="task-menu-btn" type="button" data-action="toggle-menu" data-id="${task.id}" aria-label="More task actions">⋯</button>
              <div class="task-menu" id="menu-${task.id}">
                <button type="button" data-action="edit" data-id="${task.id}">Edit</button>
                <button type="button" data-action="delete" data-id="${task.id}" class="delete-action">Delete</button>
              </div>
            </div>
          </div>
        </li>
      `;
    })
    .join('');

  renderStats();
  renderCategorySelection();
}

// Task actions

function addTask() {
  const title = taskTitleInput.value.trim();
  const dueDate = taskDateInput.value;
  const category = taskCategorySelect.value;

  if (!title) {
    taskTitleInput.focus();
    return;
  }

  if (category === 'All') {
    alert('Please choose a valid category for the task.');
    return;
  }

  tasks.unshift({
    id: crypto.randomUUID(),
    title,
    dueDate: dueDate || new Date().toISOString().slice(0, 10),
    category,
    completed: false,
    important: false,
    createdAt: Date.now(),
    expanded: false,
    subtasks: [],
  });

  saveTasks();
  taskTitleInput.value = '';
  taskDateInput.value = '';
  taskCategorySelect.value = 'All';
  taskTitleInput.focus();
  renderTasks();
}

function toggleCompleted(taskId) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  const nextCompletedState = !task.completed;

  tasks = tasks.map((entry) =>
    entry.id === taskId ? { ...entry, completed: nextCompletedState } : entry,
  );
  saveTasks();

  if (nextCompletedState) {
    completingTaskId = taskId;
    renderTasks();
    window.setTimeout(() => {
      completingTaskId = null;
      renderTasks();
    }, 340);
    return;
  }

  renderTasks();
}

function toggleImportant(taskId) {
  tasks = tasks.map((task) =>
    task.id === taskId ? { ...task, important: !task.important } : task,
  );
  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function closeEditModal() {
  editModal.classList.remove('open');
  editModal.setAttribute('aria-hidden', 'true');
  editingTaskId = null;
  editForm.reset();
}

function openEditModal(taskId) {
  const task = tasks.find((entry) => entry.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  editTaskTitleInput.value = task.title;
  editTaskDateInput.value = task.dueDate || '';
  editTaskCategoryInput.value = task.category;

  editModal.classList.add('open');
  editModal.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => editTaskTitleInput.focus());
}

function saveEditedTask(event) {
  event.preventDefault();

  if (!editingTaskId) return;

  const title = editTaskTitleInput.value.trim();
  const date = editTaskDateInput.value;
  const category = editTaskCategoryInput.value;

  if (!title) {
    editTaskTitleInput.focus();
    return;
  }

  tasks = tasks.map((task) =>
    task.id === editingTaskId
      ? {
          ...task,
          title,
          dueDate: date || task.dueDate,
          category,
        }
      : task,
  );

  saveTasks();
  closeEditModal();
  renderTasks();
}

function toggleMenu(taskId) {
  document.querySelectorAll('.task-menu').forEach((menu) => {
    if (menu.id !== `menu-${taskId}`) {
      menu.classList.remove('open');
    }
  });

  const menu = document.getElementById(`menu-${taskId}`);
  if (menu) {
    menu.classList.toggle('open');
  }
}

// Event binding

function attachTaskEvents() {
  taskList.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;

    const { action, id } = button.dataset;
    if (!action || !id) return;

    switch (action) {
      case 'toggle-complete':
        toggleCompleted(id);
        break;
      case 'toggle-important':
        toggleImportant(id);
        break;
      case 'delete':
        deleteTask(id);
        break;
      case 'edit':
        openEditModal(id);
        break;
      case 'toggle-menu':
        toggleMenu(id);
        break;
      case 'toggle-subtasks':
        toggleSubtaskPanel(id);
        break;
      case 'add-subtask': {
        const input = taskList.querySelector(`[data-subtask-input="${id}"]`);
        addSubtask(id, input ? input.value : '');
        break;
      }
      case 'toggle-subtask':
        toggleSubtask(id, button.dataset.subtaskId);
        break;
      case 'delete-subtask':
        deleteSubtask(id, button.dataset.subtaskId);
        break;
      case 'move-up':
        moveTask(id, -1);
        break;
      case 'move-down':
        moveTask(id, 1);
        break;
      default:
        break;
    }
  });

  taskList.addEventListener('keydown', (event) => {
    const input = event.target.closest('.subtask-input');
    if (!input || event.key !== 'Enter') return;

    const taskId = input.dataset.subtaskInput;
    addSubtask(taskId, input.value);
  });

  taskList.addEventListener('dragstart', (event) => {
    const item = event.target.closest('.task-item');
    if (!item || selectedSort !== 'manual') return;

    draggedTaskId = item.dataset.id;
    item.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', draggedTaskId);
  });

  taskList.addEventListener('dragover', (event) => {
    const item = event.target.closest('.task-item');
    if (!item || selectedSort !== 'manual') return;

    event.preventDefault();
    item.classList.add('drop-target');
  });

  taskList.addEventListener('dragleave', (event) => {
    const item = event.target.closest('.task-item');
    if (item) {
      item.classList.remove('drop-target');
    }
  });

  taskList.addEventListener('drop', (event) => {
    const item = event.target.closest('.task-item');
    if (!item || !draggedTaskId || selectedSort !== 'manual') return;

    event.preventDefault();
    reorderTasks(draggedTaskId, item.dataset.id);
    draggedTaskId = null;
    taskList.querySelectorAll('.task-item').forEach((row) => row.classList.remove('drop-target', 'dragging'));
  });

  taskList.addEventListener('dragend', () => {
    draggedTaskId = null;
    taskList.querySelectorAll('.task-item').forEach((row) => row.classList.remove('drop-target', 'dragging'));
  });

  categoryList.addEventListener('click', (event) => {
    const item = event.target.closest('.category-item');
    if (!item) return;

    selectedFilter = item.dataset.filter;
    renderTasks();
  });

  sortSelect.addEventListener('change', (event) => {
    selectedSort = event.target.value;
    renderTasks();
  });

  searchInput.addEventListener('input', (event) => {
    searchTerm = event.target.value.trim();
    renderTasks();
  });

  addTaskButton.addEventListener('click', addTask);

  taskTitleInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      addTask();
    }
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.task-menu-btn') && !event.target.closest('.task-menu')) {
      document.querySelectorAll('.task-menu').forEach((menu) => menu.classList.remove('open'));
    }
    if (event.target.matches('[data-close="modal"]')) {
      closeEditModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && editModal.classList.contains('open')) {
      closeEditModal();
    }
  });

  editForm.addEventListener('submit', saveEditedTask);
}

// Initial bootstrapping

function init() {
  document.documentElement.setAttribute('data-theme', 'light');
  sortSelect.value = 'date-added';
  taskCategorySelect.value = 'All';
  renderTasks();
  attachTaskEvents();
}

init();
