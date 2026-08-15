# TaskFlow

TaskFlow is a lightweight todo list app built with HTML, CSS, and vanilla JavaScript. It stores tasks locally in the browser with `localStorage`, so your tasks persist between refreshes without a backend.

## Features

 Add tasks with a title, due date, and category
 Toggle complete and important states
 Edit tasks in a dedicated modal and delete them instantly
 Search tasks live while filtering by category
 Sort tasks by manual order, date added, due date, or importance
 See overdue tasks marked with a warning pill and highlighted styling
 Keep optional subtasks/checklists per task with progress tracking
 Reorder tasks manually with drag anddrop and touchfriendly arrow controls
 Toggle between dark and light themes, with the choice saved across reloads
 Responsive layout built to stay usable on phonesized screens
 Emptystate messaging for each category filter
 Animated completion feedback when a task is checked off
 Keyboard support for quick task entry and modal cancel behavior

## Mobile support

TaskFlow is tuned for small screens and supports narrow layouts down to roughly 375px width. The composer stacks cleanly, the sidebar moves below the task list, task rows compress without overflow, and interactive controls keep comfortable tap targets for touch use.

## Run it locally

1. Open the project folder in a browser.
2. Open `index.html` directly in your browser.
3. Start managing tasks immediately.

## Files

 `index.html`  app structure and theme toggle markup
 `styles.css`  light theme variables, mobile responsiveness, checklist styling, and drag states
 `script.js` task logic, filtering, sorting, subtasks, drag reordering, theme persistence, and local storage handling
