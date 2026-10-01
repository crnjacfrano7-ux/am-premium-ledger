import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { eur, sqm } from "@/lib/format";
import { DEFAULT_LAYOUT, paidFor, unitTotal, type Payment, type Unit } from "@/lib/units";
import { Link2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export type Layout = { grid_x: number; grid_y: number; grid_w: number; grid_h: number };

type Props = {
  units: Unit[];
  payments: Payment[];
  activeId: string | null;
  joinMode: boolean;
  editMode: boolean;
  joinSelection: string[];
  onSelect: (u: Unit) => void;
  onToggleJoin: (id: string) => void;
  onDeleteFloor: (floor: number) => void;
  onAddUnit: (floor: number, layout: Layout) => void;
  onLayout: (id: string, layout: Layout) => void;
};

const COLS = 12;
const ROW = 34;

function statusClasses(u: Unit, pct: number) {
  if (u.status === "prodan") return "floor-unit-sold";
  if (u.status === "rezervisan" || pct > 0) return "floor-unit-reserved";
  return "floor-unit-free";
}

function layoutsFor(units: Unit[]): Map<string, Layout> {
  const map = new Map<string, Layout>();
  let extraY = 4;
  units.forEach((u, i) => {
    if (u.grid_x != null && u.grid_y != null && u.grid_w && u.grid_h) {
      map.set(u.id, { grid_x: u.grid_x, grid_y: u.grid_y, grid_w: u.grid_w, grid_h: u.grid_h });
    } else if (i < DEFAULT_LAYOUT.length) {
      map.set(u.id, DEFAULT_LAYOUT[i]!);
    } else {
      map.set(u.id, { grid_x: ((i - 5) % 3) * 4, grid_y: extraY, grid_w: 4, grid_h: 2 });
      if ((i - 5) % 3 === 2) extraY += 2;
    }
  });
  return map;
}

export function BuildingPlan(props: Props) {
  const floors = [...new Set(props.units.map((u) => u.floor))].sort((a, b) => b - a);
  return (
    <div className="building-elevation animate-rise">
      <div className="building-roof" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {floors.map((floor, i) => (
        <FloorCanvas
          key={floor}
          floor={floor}
          index={i}
          {...props}
          units={props.units
            .filter((u) => u.floor === floor)
            .sort((a, b) => a.block - b.block || a.slot - b.slot)}
        />
      ))}
      <div className="building-base" aria-hidden="true" />
    </div>
  );
}

type Drag = { id: string; mode: "move" | "resize"; sx: number; sy: number; start: Layout; cur: Layout };

function FloorCanvas({
  floor,
  index,
  units,
  payments,
  activeId,
  joinMode,
  editMode,
  joinSelection,
  onSelect,
  onToggleJoin,
  onDeleteFloor,
  onAddUnit,
  onLayout,
}: Props & { floor: number; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [overrides, setOverrides] = useState<Record<string, Layout>>({});
  const base = layoutsFor(units);
  const get = (id: string): Layout =>
    drag?.id === id ? drag.cur : (overrides[id] ?? base.get(id)!);
  const rows = Math.max(4, ...units.map((u) => get(u.id).grid_y + get(u.id).grid_h));

  const down = (e: React.PointerEvent, id: string, mode: Drag["mode"]) => {
    if (!editMode) return;
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const start = get(id);
    setDrag({ id, mode, sx: e.clientX, sy: e.clientY, start, cur: start });
  };

  const move = (e: React.PointerEvent) => {
    if (!drag || !ref.current) return;
    const colW = ref.current.clientWidth / COLS;
    const dx = Math.round((e.clientX - drag.sx) / colW);
    const dy = Math.round((e.clientY - drag.sy) / ROW);
    const s = drag.start;
    const cur =
      drag.mode === "move"
        ? { ...s, grid_x: Math.min(COLS - s.grid_w, Math.max(0, s.grid_x + dx)), grid_y: Math.max(0, s.grid_y + dy) }
        : { ...s, grid_w: Math.min(COLS - s.grid_x, Math.max(1, s.grid_w + dx)), grid_h: Math.max(1, s.grid_h + dy) };
    if (JSON.stringify(cur) !== JSON.stringify(drag.cur)) setDrag({ ...drag, cur });
  };

  const up = () => {
    if (!drag) return;
    const { id, cur, start } = drag;
    setDrag(null);
    if (JSON.stringify(cur) !== JSON.stringify(start)) {
      setOverrides((o) => ({ ...o, [id]: cur }));
      onLayout(id, cur);
    }
  };

  const addBlock = () => onAddUnit(floor, { grid_x: 0, grid_y: rows, grid_w: 4, grid_h: 2 });

  return (
    <section className="floor-plan" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="floor-number" aria-label={`${floor}. sprat`}>
        <strong>{floor}</strong>
        <span>SPRAT</span>
      </div>

      <div
        ref={ref}
        className={cn("floor-canvas", editMode && "floor-canvas-edit")}
        style={{ height: rows * ROW + 4 }}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      >
        {units.map((u) => {
          const l = get(u.id);
          const total = unitTotal(u);
          const paid = paidFor(u.id, payments);
          const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
          const picked = joinSelection.includes(u.id);
          const dragging = drag?.id === u.id;
          return (
            <div
              key={u.id}
              role="button"
              tabIndex={0}
              onPointerDown={(e) => down(e, u.id, "move")}
              onClick={() => {
                if (editMode) return onSelect(u);
                return joinMode ? onToggleJoin(u.id) : onSelect(u);
              }}
              onKeyDown={(e) => e.key === "Enter" && (joinMode ? onToggleJoin(u.id) : onSelect(u))}
              className={cn(
                "floor-unit",
                statusClasses(u, pct),
                activeId === u.id && !joinMode && "floor-unit-active",
                picked && "floor-unit-picked",
                dragging && "floor-unit-dragging",
              )}
              style={{
                left: `${(l.grid_x / COLS) * 100}%`,
                width: `${(l.grid_w / COLS) * 100}%`,
                top: l.grid_y * ROW + 2,
                height: l.grid_h * ROW,
              }}
              aria-label={`Stan ${u.label}`}
            >
              <span className="floor-unit-label">{u.label}</span>
              {u.buyer_name ? <span className="floor-unit-buyer">{u.buyer_name}</span> : null}
              <span className="floor-unit-area">
                {paid > 0 ? `${eur(paid)} / ${eur(total)}` : sqm(u.sqm)}
              </span>
              <span className="floor-unit-progress" aria-hidden="true">
                <span style={{ width: `${pct}%` }} />
              </span>
              {u.group_id ? <Link2 className="floor-unit-link" /> : null}
              {editMode ? (
                <span
                  className="floor-unit-resize"
                  onPointerDown={(e) => down(e, u.id, "resize")}
                  aria-hidden="true"
                />
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="floor-actions">
        {editMode ? (
          <Button variant="outline" size="sm" onClick={addBlock}>
            <Plus className="size-4" /> Blok
          </Button>
        ) : null}
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={addBlock} aria-label="Dodaj stan">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDeleteFloor(floor)} aria-label="Obriši sprat">
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
