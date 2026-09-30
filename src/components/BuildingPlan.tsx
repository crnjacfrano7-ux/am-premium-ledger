import { cn } from "@/lib/utils";
import { sqm } from "@/lib/format";
import { paidFor, unitTotal, type Payment, type Unit } from "@/lib/units";
import { Link2, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  units: Unit[];
  payments: Payment[];
  activeId: string | null;
  joinMode: boolean;
  joinSelection: string[];
  onSelect: (u: Unit) => void;
  onToggleJoin: (id: string) => void;
  onDeleteFloor: (floor: number) => void;
  onAddUnit: (floor: number) => void;
};

function statusClasses(u: Unit, pct: number) {
  if (u.status === "prodan") return "floor-unit-sold";
  if (u.status === "rezervisan" || pct > 0) return "floor-unit-reserved";
  return "floor-unit-free";
}

export function BuildingPlan({
  units,
  payments,
  activeId,
  joinMode,
  joinSelection,
  onSelect,
  onToggleJoin,
  onDeleteFloor,
  onAddUnit,
}: Props) {
  const floors = [...new Set(units.map((u) => u.floor))].sort((a, b) => b - a);

  return (
    <div className="building-elevation animate-rise">
      <div className="building-roof" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      {floors.map((floor, i) => {
        const floorUnits = units.filter((u) => u.floor === floor);
        const ordered = [...floorUnits].sort((a, b) => a.block - b.block || a.slot - b.slot);
        const planUnits = ordered.slice(0, 5);
        const extraUnits = ordered.slice(5);
        return (
          <section
            key={floor}
            className="floor-plan"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="floor-number" aria-label={`${floor}. sprat`}>
              <strong>{floor}</strong>
              <span>SPRAT</span>
            </div>

            <div className="floor-blueprint">
              {planUnits.map((u, index) => {
                const total = unitTotal(u);
                const paid = paidFor(u.id, payments);
                const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                const picked = joinSelection.includes(u.id);
                const positions = ["left-top", "left-bottom", "center-top", "right-top", "right-bottom"];
                return (
                  <Button
                    key={u.id}
                    type="button"
                    variant="ghost"
                    onClick={() => (joinMode ? onToggleJoin(u.id) : onSelect(u))}
                    className={cn(
                      "floor-unit",
                      positions[index],
                      statusClasses(u, pct),
                      activeId === u.id && !joinMode && "floor-unit-active",
                      picked && "floor-unit-picked",
                    )}
                    aria-label={`Stan ${u.label}, ${sqm(u.sqm)}, plaćeno ${pct.toFixed(0)}%`}
                  >
                    <span className="floor-unit-label">{u.label}</span>
                    <span className="floor-unit-area">{sqm(u.sqm)}</span>
                    <span className="floor-unit-progress" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </span>
                    {u.group_id ? <Link2 className="floor-unit-link" /> : null}
                  </Button>
                );
              })}

              <div className="stair-core" aria-hidden="true">
                <span className="stair-lines" />
                <span className="lift-shaft" />
                <span className="corridor-line" />
              </div>

              <div className="balcony balcony-left" aria-hidden="true" />
              <div className="balcony balcony-right" aria-hidden="true" />
            </div>

            <div className="floor-actions">
              {extraUnits.map((u) => {
                const total = unitTotal(u);
                const paid = paidFor(u.id, payments);
                const pct = total > 0 ? Math.min(100, (paid / total) * 100) : 0;
                return (
                  <Button
                    key={u.id}
                    variant="outline"
                    size="sm"
                    onClick={() => (joinMode ? onToggleJoin(u.id) : onSelect(u))}
                    className={cn(
                      "floor-extra-unit",
                      activeId === u.id && !joinMode && "border-gold",
                      joinSelection.includes(u.id) && "border-primary",
                    )}
                  >
                    {u.label} · {sqm(u.sqm)} · {pct.toFixed(0)}%
                  </Button>
                );
              })}
              <div className="ml-auto flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => onAddUnit(floor)} aria-label="Dodaj stan">
                  <Plus className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteFloor(floor)}
                  aria-label="Obriši sprat"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          </section>
        );
      })}
      <div className="building-base" aria-hidden="true" />
    </div>
  );
}
