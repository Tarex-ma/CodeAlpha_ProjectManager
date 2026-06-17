import { useCallback, useRef } from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  getFirstCollision,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useBoardStore } from '../store/boardStore';

/**
 * useBoardDnd
 *
 * Encapsulates all dnd-kit drag logic.
 * Returns { sensors, collisionDetection, onDragStart, onDragOver, onDragEnd, onDragCancel }
 *
 * @param {{ moveTask: Function }} param0
 */
export function useBoardDnd({ moveTask }) {
  const store       = useBoardStore();
  const snapshotRef = useRef(null); // taken at drag start for rollback

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Custom collision: prefer tasks inside columns, fall back to column itself
  const collisionDetection = useCallback((args) => {
    const { active, droppableContainers } = args;

    // If dragging over a column directly
    const pointerCollisions = pointerWithin(args);
    const intersectionRect  = pointerCollisions.length > 0
      ? pointerCollisions
      : rectIntersection(args);

    let overId = getFirstCollision(intersectionRect, 'id');
    if (overId != null) {
      const isColumn = store.columns.some((c) => c.id === overId);
      if (isColumn) {
        // Find the closest task inside that column
        const columnTasks = droppableContainers
          .filter((dc) => {
            const col = store.columns.find((c) => c.id === overId);
            return col?.tasks.some((t) => t.id === dc.id);
          })
          .map((dc) => dc.id);

        if (columnTasks.length > 0) {
          overId = closestCorners({ ...args, droppableContainers: droppableContainers.filter((dc) => columnTasks.includes(dc.id)) })[0]?.id ?? overId;
        }
      }
      return [{ id: overId }];
    }
    return intersectionRect;
  }, [store.columns]);

  const onDragStart = useCallback(({ active }) => {
    store.setActiveTaskId(active.id);
    snapshotRef.current = store.snapshot();
  }, [store]);

  const onDragOver = useCallback(({ active, over }) => {
    if (!over) return;

    const activeId = active.id;
    const overId   = over.id;
    if (activeId === overId) return;

    const activeCol  = store.findColumnByTaskId(activeId);
    if (!activeCol) return;

    // Determine the target column
    const overIsColumn = store.columns.some((c) => c.id === overId);
    const overCol      = overIsColumn
      ? store.columns.find((c) => c.id === overId)
      : store.findColumnByTaskId(overId);

    if (!overCol) return;
    if (activeCol.id === overCol.id) return; // same column — handled in onDragEnd

    // Cross-column move: insert at end of target column
    const newIndex = overIsColumn
      ? overCol.tasks.length
      : overCol.tasks.findIndex((t) => t.id === overId);

    store.moveTask(activeId, activeCol.id, overCol.id, Math.max(0, newIndex));
  }, [store]);

  const onDragEnd = useCallback(({ active, over }) => {
    store.setActiveTaskId(null);
    if (!over) {
      store.restoreSnapshot(snapshotRef.current);
      return;
    }

    const activeId = active.id;
    const overId   = over.id;

    const activeCol = store.findColumnByTaskId(activeId);
    if (!activeCol) return;

    const overIsColumn = store.columns.some((c) => c.id === overId);
    const overCol      = overIsColumn
      ? store.columns.find((c) => c.id === overId)
      : store.findColumnByTaskId(overId);

    if (!overCol) return;

    // Reorder within same column
    if (activeCol.id === overCol.id && activeId !== overId) {
      const tasks    = activeCol.tasks;
      const oldIndex = tasks.findIndex((t) => t.id === activeId);
      const newIndex = overIsColumn ? tasks.length - 1 : tasks.findIndex((t) => t.id === overId);
      if (oldIndex !== newIndex) {
        store.moveTask(activeId, activeCol.id, overCol.id, newIndex);
      }
    }

    // Sync with API (columns may have already been updated in onDragOver)
    const finalCol   = store.findColumnByTaskId(activeId);
    const finalIndex = finalCol?.tasks.findIndex((t) => t.id === activeId) ?? 0;

    moveTask(activeId, activeCol.id, finalCol?.id ?? activeCol.id, finalIndex, snapshotRef.current);
  }, [store, moveTask]);

  const onDragCancel = useCallback(() => {
    store.setActiveTaskId(null);
    if (snapshotRef.current) {
      store.restoreSnapshot(snapshotRef.current);
    }
  }, [store]);

  return { sensors, collisionDetection, onDragStart, onDragOver, onDragEnd, onDragCancel };
}