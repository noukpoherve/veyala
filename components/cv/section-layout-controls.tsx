"use client";

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
import { Eye, EyeOff, GripVertical, RotateCcw } from "lucide-react";
import {
  SECTION_IDS,
  sectionLabels,
  type SectionId,
  type TemplateDefinition,
  uniqueSectionIds,
} from "@/lib/templates/definition";
import { cn } from "@/lib/utils";
import { useLocale, useMessages } from "@/components/i18n/locale-provider";

/**
 * Atelier control: reorder and show/hide CV sections. Sidebar layouts use two
 * columns; single-column uses one list. Hidden sections can be re-enabled.
 */

type Column = "sidebar" | "main" | "hidden";

function columnOf(id: SectionId, sidebar: SectionId[], main: SectionId[]): Column {
  if (sidebar.includes(id)) return "sidebar";
  if (main.includes(id)) return "main";
  return "hidden";
}

function VisibleRow({
  id,
  column,
  showColumnSelect,
  onToggle,
  onMoveColumn,
  labels,
  layoutCopy,
}: {
  id: SectionId;
  column: "sidebar" | "main";
  showColumnSelect: boolean;
  onToggle: () => void;
  onMoveColumn?: (to: "sidebar" | "main") => void;
  labels: Record<SectionId, string>;
  layoutCopy: ReturnType<typeof useMessages>["forms"]["layout"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border bg-card px-1.5 py-1.5",
        isDragging && "z-10 shadow-md"
      )}
    >
      <button
        type="button"
        className="flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={layoutCopy.reorderAria(labels[id])}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{labels[id]}</span>
      {showColumnSelect && onMoveColumn ? (
        <select
          aria-label={layoutCopy.columnAria(labels[id])}
          className="h-7 max-w-[5.5rem] rounded-md border bg-background px-1 text-[11px]"
          value={column}
          onChange={(e) => onMoveColumn(e.target.value as "sidebar" | "main")}
        >
          <option value="sidebar">{layoutCopy.columnSidebar}</option>
          <option value="main">{layoutCopy.columnMain}</option>
        </select>
      ) : null}
      <button
        type="button"
        onClick={onToggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-pressed
        aria-label={layoutCopy.hideAria(labels[id])}
      >
        <Eye className="size-4" aria-hidden />
      </button>
    </li>
  );
}

function HiddenRow({
  id,
  onToggle,
  labels,
  layoutCopy,
}: {
  id: SectionId;
  onToggle: () => void;
  labels: Record<SectionId, string>;
  layoutCopy: ReturnType<typeof useMessages>["forms"]["layout"];
}) {
  return (
    <li className="flex items-center gap-1.5 rounded-lg border bg-card px-1.5 py-1.5 opacity-55">
      <span className="size-8 shrink-0" aria-hidden />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{labels[id]}</span>
      <button
        type="button"
        onClick={onToggle}
        className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        aria-pressed={false}
        aria-label={layoutCopy.showAria(labels[id])}
      >
        <EyeOff className="size-4" aria-hidden />
      </button>
    </li>
  );
}

function ColumnList({
  title,
  ids,
  column,
  onReorder,
  onToggle,
  onMoveColumn,
  showColumnSelect,
  labels,
  layoutCopy,
}: {
  title: string;
  ids: SectionId[];
  column: "sidebar" | "main";
  onReorder: (from: number, to: number) => void;
  onToggle: (id: SectionId) => void;
  onMoveColumn?: (id: SectionId, to: "sidebar" | "main") => void;
  showColumnSelect: boolean;
  labels: Record<SectionId, string>;
  layoutCopy: ReturnType<typeof useMessages>["forms"]["layout"];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = ids.indexOf(active.id as SectionId);
    const to = ids.indexOf(over.id as SectionId);
    if (from < 0 || to < 0) return;
    onReorder(from, to);
  }

  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </legend>
      {ids.length === 0 ? (
        <p className="text-xs text-muted-foreground">{layoutCopy.emptyColumn}</p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5">
              {ids.map((id) => (
                <VisibleRow
                  key={id}
                  id={id}
                  column={column}
                  showColumnSelect={showColumnSelect}
                  onToggle={() => onToggle(id)}
                  onMoveColumn={onMoveColumn ? (to) => onMoveColumn(id, to) : undefined}
                  labels={labels}
                  layoutCopy={layoutCopy}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </fieldset>
  );
}

export function SectionLayoutControls({
  layout,
  templateSidebar,
  templateMain,
  sidebarSections,
  mainSections,
  onChange,
  onReset,
}: {
  layout: TemplateDefinition["layout"];
  templateSidebar: SectionId[];
  templateMain: SectionId[];
  sidebarSections: SectionId[];
  mainSections: SectionId[];
  onChange: (next: { sidebarSections: SectionId[]; mainSections: SectionId[] }) => void;
  onReset: () => void;
}) {
  const isSidebar = layout === "sidebar-left";
  const labels = sectionLabels(useLocale());
  const layoutCopy = useMessages().forms.layout;
  const visible = new Set([...sidebarSections, ...mainSections]);
  const hidden = SECTION_IDS.filter((id) => !visible.has(id));

  function emit(sidebar: SectionId[], main: SectionId[]) {
    const mainClean = uniqueSectionIds(main);
    const sidebarClean = isSidebar
      ? uniqueSectionIds(sidebar.filter((id) => !mainClean.includes(id)))
      : [];
    const mainFinal = uniqueSectionIds(mainClean.filter((id) => !sidebarClean.includes(id)));
    onChange({
      sidebarSections: sidebarClean,
      mainSections: mainFinal.length > 0 ? mainFinal : templateMain.slice(0, 1),
    });
  }

  function reorder(list: "sidebar" | "main", from: number, to: number) {
    const src = list === "sidebar" ? [...sidebarSections] : [...mainSections];
    const [item] = src.splice(from, 1);
    if (!item) return;
    src.splice(to, 0, item);
    if (list === "sidebar") emit(src, mainSections);
    else emit(sidebarSections, src);
  }

  function toggle(id: SectionId) {
    const col = columnOf(id, sidebarSections, mainSections);
    if (col === "hidden") {
      if (isSidebar && templateSidebar.includes(id)) {
        emit([...sidebarSections, id], mainSections);
      } else {
        emit(sidebarSections, [...mainSections, id]);
      }
      return;
    }
    if (col === "sidebar")
      emit(
        sidebarSections.filter((s) => s !== id),
        mainSections
      );
    else
      emit(
        sidebarSections,
        mainSections.filter((s) => s !== id)
      );
  }

  function moveColumn(id: SectionId, to: "sidebar" | "main") {
    const from = columnOf(id, sidebarSections, mainSections);
    if (from === to || from === "hidden") return;
    if (to === "sidebar") {
      emit(
        [...sidebarSections.filter((s) => s !== id), id],
        mainSections.filter((s) => s !== id)
      );
    } else {
      emit(
        sidebarSections.filter((s) => s !== id),
        [...mainSections.filter((s) => s !== id), id]
      );
    }
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{layoutCopy.hint}</p>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          {layoutCopy.resetToTemplate}
        </button>
      </div>

      {isSidebar ? (
        <ColumnList
          title={layoutCopy.sidebarColumn}
          ids={sidebarSections}
          column="sidebar"
          onReorder={(f, t) => reorder("sidebar", f, t)}
          onToggle={toggle}
          onMoveColumn={moveColumn}
          showColumnSelect
          labels={labels}
          layoutCopy={layoutCopy}
        />
      ) : null}

      <ColumnList
        title={isSidebar ? layoutCopy.mainColumn : layoutCopy.singleColumn}
        ids={mainSections}
        column="main"
        onReorder={(f, t) => reorder("main", f, t)}
        onToggle={toggle}
        onMoveColumn={isSidebar ? moveColumn : undefined}
        showColumnSelect={isSidebar}
        labels={labels}
        layoutCopy={layoutCopy}
      />

      {hidden.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {layoutCopy.hiddenColumn}
          </legend>
          <ul className="space-y-1.5">
            {hidden.map((id) => (
              <HiddenRow
                key={id}
                id={id}
                onToggle={() => toggle(id)}
                labels={labels}
                layoutCopy={layoutCopy}
              />
            ))}
          </ul>
        </fieldset>
      ) : null}
    </div>
  );
}
