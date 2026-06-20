# Complete Task Management Feature

**Goal**: Implement a full‑stack task management system that satisfies all 20 user activities, including CRUD, workflow moves, reordering, assignee/label handling, comments, activity log, search, filter, and UI integration.

## User Review Required

> **[!IMPORTANT]** The design introduces new database tables (`Label`, `Comment`, `ActivityLog`) and several API endpoints. Please confirm:
> 1. **Assignee model** – use Django's default `auth.User` (as in current code) or a custom profile?
> 2. **Label management** – predefined only, or UI for creating new labels?
> 3. **Activity‑log exposure** – API endpoint per task (paginated) is sufficient?
> 4. **Search implementation** – simple text search on `title`/`description` or PostgreSQL full‑text search?
> 5. **Permissions** – only creator can delete, or board admins also allowed?

## Open Questions

- **Real‑time updates** – do you want WebSocket notifications for task changes, or is polling acceptable?
- **State‑management** – continue with custom hooks (`useTasks`, `useTaskDetail`) or switch to Redux/TanStack Query?
- **Label color palette** – any preferred color scheme or allow free‑form hex input?

## Proposed Changes

### Backend (Django + DRF)

1. **Models** – `Task` already exists; added `Label`, `Comment`, `ActivityLog` (see recent edit).
2. **Serializers** – `TaskSerializer` (nested assignees, labels, comments), `LabelSerializer`, `CommentSerializer`, `ActivityLogSerializer`.
3. **ViewSets** –
   - `TaskViewSet` (ModelViewSet) with custom actions: `move`, `reorder`, `assign`, `unassign`, `add_label`, `remove_label`, `add_comment`, `edit_comment`, `delete_comment`, `search`, `filter`.
   - `CommentViewSet` (if needed).
   - `ActivityLogViewSet` (read‑only, task‑scoped).
4. **Permissions** – `IsTaskOwnerOrAssigneeOrReadOnly` (owner = creator), plus `IsAuthenticated`.
5. **URLs** – router registration for tasks, comments, activity logs.
6. **Signals** – `post_save`/`post_delete` on `Task`, `Comment`, `Label` to create `ActivityLog` entries.
7. **Optimized QuerySets** – `select_related`/`prefetch_related` for assignees, labels, comments.

### Frontend (React + Vite + Tailwind + dnd‑kit)

1. **API Service (`src/api/tasks.js`)** – add functions for all new endpoints (move, reorder, assign/unassign, label ops, comment ops, activity fetch, search, filter).
2. **Hooks** –
   - `useTaskDetail(taskId)` – loads task with comments, labels, activity log, provides mutation helpers.
   - `useComments(taskId)`, `useLabels()`, `useActivityLog(taskId)`.
3. **Components** –
   - **TaskModal** – full detail view, editable fields (title, description, due date, priority, status dropdown, assignee multi‑select, label multi‑select). Includes comment section and activity timeline.
   - **TaskForm** – reuse for create and edit (opened from modal or “+ New Task” button).
   - **CommentSection** – list, add, edit, delete comments inline.
   - **LabelBadge** – colored pill, removable when editing.
   - **ActivityLog** – scrollable timeline inside the modal.
4. **Drag‑and‑Drop** – use `dnd-kit` `SortableContext` per column (status). On drag end, call `moveTask` if column changed or `reorderTasks` if same column.
5. **Search & Filter UI** – top bar with debounced search input, dropdowns for status, priority, assignee. Calls `searchTasks` / `filterTasks` API.
6. **Styling** – continue dark‑mode glassmorphism, gradient headers, subtle hover/elevation, Tailwind utilities for badge colors (`bg-emerald-600`, etc.).

### Verification Plan

- **Backend unit tests** for models, serializers, viewsets, permissions, activity log creation.
- **API integration tests** using DRF `APITestCase` covering all custom actions.
- **Frontend unit tests** (`jest` + `react-testing-library`) for components and hooks.
- **E2E Playwright** script: create task, drag between stages, edit, assign, add comment, verify activity log entries.
- **Performance** – ensure task list endpoint emits ≤ 3 DB queries (select_related/prefetch).

## Verification Steps (post‑implementation)

1. Run `python manage.py test` – all tests must pass.
2. Start backend (`python manage.py runserver`) and frontend (`npm run dev`).
3. Navigate to **/tasks** – create a task, move it through Todo → In Progress → Review → Done, add assignees, labels, comments, change priority & due date.
4. Confirm activity log shows each action with correct timestamps and actors.
5. Use search bar and filters – results should update accordingly.

---

*Please review the open questions and the overall design. Once approved, I will proceed with the remaining backend code (serializers, viewsets, permissions, signals, URLs) and the frontend implementation (API service, hooks, components, dnd‑kit integration).*
