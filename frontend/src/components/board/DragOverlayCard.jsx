import { useBoardStore }   from '../../store/boardStore';
import TaskCard            from '../task/TaskCard';

/**
 * DragOverlayCard
 *
 * Rendered inside dnd-kit's <DragOverlay>.
 * Finds the active task from the store and renders a
 * styled TaskCard with the overlay prop set to true.
 *
 * Drop this directly inside <DragOverlay> in BoardPage:
 *
 *   <DragOverlay dropAnimation={dropAnimation}>
 *     <DragOverlayCard />
 *   </DragOverlay>
 */
export default function DragOverlayCard() {
  const { activeTaskId, findTask } = useBoardStore();

  if (!activeTaskId) return null;

  const result = findTask(activeTaskId);
  if (!result) return null;

  return (
    <div className="w-[280px] pointer-events-none">
      <TaskCard
        task={result.task}
        overlay={true}
        isDragging={false}
      />
    </div>
  );
}