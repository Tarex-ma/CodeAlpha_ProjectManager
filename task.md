# Complete Task Management Feature

## Backend
- [x] Models (`Label`, `Comment`, `ActivityLog`) added to `models.py`
- [x] `Task` model updated: `assignees` (M2M) and `labels` (M2M)
- [x] Signals (`signals.py`) for auto-generating `ActivityLog` entries
- [x] App registry (`apps.py`) updated to load signals
- [x] Serializers updated (`TaskSerializer` nested data, `ActivityLogSerializer`, `LabelSerializer`)
- [x] Viewsets updated (`TaskViewSet.activity_log` action, `_get_queryset` fixes)
- [x] Admin site (`admin.py`) registered and `assignees` supported
- [x] Django Migrations created and applied

## Frontend Services & State
- [x] Update `TaskCard.jsx` to map over `task.assignees`
- [x] Update mock data in `MyTasksPage.jsx`
- [x] Extend `src/api/tasks.js` with `fetchActivity`
- [ ] Create `src/api/comments.js`
- [ ] Implement `useTaskDetail.js` hook
- [ ] Implement `useComments.js` hook
- [ ] Update `useTasks.js` for search and filters

## Frontend Components
- [ ] Develop `TaskModal.jsx` (full detail view, edits, labels, assignees)
- [ ] Develop `CommentSection.jsx`
- [ ] Develop `ActivityLog.jsx` panel
- [ ] Connect `MyTasksPage.jsx` real data via `useTasks` hook
- [ ] Implement `dnd-kit` drag-and-drop on `MyTasksPage`
- [ ] Build Search & Filter UI bar
