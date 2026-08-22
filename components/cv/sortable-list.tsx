"use client";

import type { ReactNode } from "react";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useMessages } from "@/components/i18n/locale-provider";
import { cn } from "@/lib/utils";

/**
 * Accessible, touch-friendly vertical drag-and-drop list. Wraps react-hook-form
 * useFieldArray items: pass the field ids and the array's move(); each child is
 * rendered with a drag handle it places wherever it wants. Keyboard sortable
 * (Tab to the handle, Space then arrows) so reordering works on every device.
 */
function SortableItem({
  id,
  children,
}: {
  id: string;
  children: (handle: ReactNode) => ReactNode;
}) {
  const m = useMessages();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style = { transform: CSS.Transform.toString(transform), transition };
  const handle = (
    <button
      type="button"
      className="flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
      aria-label={m.forms.layout.dragHandle}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4" aria-hidden />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "relative z-10 opacity-80 shadow-lg")}
    >
      {children(handle)}
    </div>
  );
}

export function SortableList({
  ids,
  onMove,
  children,
  className,
}: {
  ids: string[];
  onMove: (from: number, to: number) => void;
  children: (handle: ReactNode, index: number) => ReactNode;
  className?: string;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from >= 0 && to >= 0) onMove(from, to);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToParentElement]}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className={cn("space-y-4", className)}>
          {ids.map((id, i) => (
            <SortableItem key={id} id={id}>
              {(handle) => children(handle, i)}
            </SortableItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
